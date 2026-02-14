@echo off
setlocal enabledelayedexpansion

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

set "ENV_FILE=.env.deploy"
set "COMPOSE_FILE=docker-compose.prod.yml"
set "MODE=%~1"

where docker >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Docker nao encontrado no PATH.
  exit /b 1
)

docker compose version >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Docker Compose plugin nao encontrado.
  exit /b 1
)

if not exist "%ENV_FILE%" (
  copy ".env.deploy.example" "%ENV_FILE%" >nul
  echo [OK] %ENV_FILE% criado a partir de .env.deploy.example
)

set /p APP_DOMAIN=Dominio APP (ex: app.seudominio.com): 
set /p API_DOMAIN=Dominio API (ex: api.seudominio.com): 

if "%APP_DOMAIN%"=="" (
  echo [ERRO] APP_DOMAIN e obrigatorio.
  exit /b 1
)
if "%API_DOMAIN%"=="" (
  echo [ERRO] API_DOMAIN e obrigatorio.
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "
$envFile = '%ENV_FILE%';
$content = Get-Content $envFile -ErrorAction SilentlyContinue;
if(-not $content){$content=@()};
function Upsert([string]$k,[string]$v){
  $script:content = $script:content | Where-Object {$_ -notmatch ('^'+[regex]::Escape($k)+'=')}
  $script:content += ('{0}={1}' -f $k,$v)
}
Upsert 'APP_DOMAIN' '%APP_DOMAIN%';
Upsert 'API_DOMAIN' '%API_DOMAIN%';
Upsert 'DOMAIN_FRONTEND' '%APP_DOMAIN%';
Upsert 'DOMAIN_BACKEND' '%API_DOMAIN%';
if(-not ($content | Select-String '^TRAEFIK_NETWORK=' -Quiet)){ $content += 'TRAEFIK_NETWORK=traefik-public' }
if(-not ($content | Select-String '^INTERNAL_NETWORK=' -Quiet)){ $content += 'INTERNAL_NETWORK=watink-internal' }
if(-not ($content | Select-String '^STACK_NAME=' -Quiet)){ $content += 'STACK_NAME=watink' }
Set-Content -Path $envFile -Value $content -Encoding UTF8
"

for /f "tokens=1,2 delims==" %%A in (%ENV_FILE%) do (
  if "%%A"=="TRAEFIK_NETWORK" set "TRAEFIK_NETWORK=%%B"
  if "%%A"=="INTERNAL_NETWORK" set "INTERNAL_NETWORK=%%B"
  if "%%A"=="STACK_NAME" set "STACK_NAME=%%B"
)

if "%TRAEFIK_NETWORK%"=="" set "TRAEFIK_NETWORK=traefik-public"
if "%INTERNAL_NETWORK%"=="" set "INTERNAL_NETWORK=watink-internal"
if "%STACK_NAME%"=="" set "STACK_NAME=watink"

docker network inspect "%TRAEFIK_NETWORK%" >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Rede Traefik "%TRAEFIK_NETWORK%" nao encontrada.
  echo Crie a rede no host do Traefik e rode novamente.
  exit /b 1
)

if /I "%MODE%"=="swarm" (
  for /f %%s in ('docker info --format "{{.Swarm.LocalNodeState}}"') do set SWARM_STATE=%%s
  if /I not "%SWARM_STATE%"=="active" (
    echo [ERRO] Docker Swarm nao esta ativo. Rode: docker swarm init
    exit /b 1
  )

  docker network inspect "%INTERNAL_NETWORK%" >nul 2>&1
  if errorlevel 1 (
    docker network create --driver overlay --attachable "%INTERNAL_NETWORK%"
  )

  if "%BUILD_LOCAL%"=="1" (
    docker compose --env-file "%ENV_FILE%" -f docker-stack.yml build backend frontend whaileys-engine
  )

  docker stack deploy --with-registry-auth --compose-file docker-stack.yml "%STACK_NAME%"
  if errorlevel 1 exit /b 1
  echo [OK] Stack "%STACK_NAME%" implantada em modo swarm.
) else (
  docker network inspect "%INTERNAL_NETWORK%" >nul 2>&1
  if errorlevel 1 (
    docker network create "%INTERNAL_NETWORK%"
  )

  if "%BUILD_LOCAL%"=="1" (
    docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_FILE%" build backend frontend whaileys-engine
  )

  docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_FILE%" up -d
  if errorlevel 1 exit /b 1
  echo [OK] Watink iniciado com Docker Compose.
)

echo [INFO] APP: https://%APP_DOMAIN%
echo [INFO] API: https://%API_DOMAIN%
exit /b 0
