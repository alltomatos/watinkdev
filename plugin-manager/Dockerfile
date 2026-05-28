FROM golang:1.25rc1-alpine AS builder

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY . .

RUN go build -o /plugin-manager main.go

FROM alpine:latest

RUN addgroup -g 1000 -S watink &&\
    adduser -u 1000 -S watink -G watink

WORKDIR /
COPY --from=builder /plugin-manager /plugin-manager

RUN chown watink:watink /plugin-manager

USER watink

EXPOSE 8081

ENTRYPOINT ["/plugin-manager"]
