#!/bin/bash
set -e

# Increment Version
if [ ! -f VERSION ]; then echo "0.1.0" > VERSION; fi
VER=$(cat VERSION)
IFS='.' read -r -a parts <<< "$VER"
parts[2]=$((parts[2] + 1))
NEW_VER="${parts[0]}.${parts[1]}.${parts[2]}"
echo "$NEW_VER" > VERSION
echo "📈 Bumpped version to $NEW_VER"

# Build Backend
echo "🔨 Building Backend (Go)..."
docker build --build-arg VERSION=$NEW_VER -t watink/panel-core:latest ./backend

# Build Frontend
echo "🎨 Building Frontend (React)..."
docker build --no-cache -t watink/panel-ui:latest ./frontend

# Deploy Stack (Force update)
echo "🚀 Deploying to Swarm (Network: panel_saas_net)..."
docker service update --force --image watink/panel-ui:latest watink_saas_panel_ui
docker service update --force --image watink/panel-core:latest watink_saas_panel_core
# Fallback if services don't exist yet
docker stack deploy -c docker-stack.saas.yml watink_saas

echo "✅ Panel SaaS Deployed!"
echo "👉 Frontend: http://localhost:3000"
echo "👉 Backend:  http://localhost:8081"
