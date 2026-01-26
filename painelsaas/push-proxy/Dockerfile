FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o push-proxy main.go

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/push-proxy .
# Copiar o mock apenas para garantir que existe, em prod deve ser volume
COPY --from=builder /app/service-account.json . 

EXPOSE 8080

CMD ["./push-proxy"]
