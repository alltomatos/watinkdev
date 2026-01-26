# Build Stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build binary (Static linking for Distroless)
ARG VERSION=1.0.0
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-X main.Version=${VERSION}" -o panel-core .

# Production Stage
FROM gcr.io/distroless/static-debian12

WORKDIR /

COPY --from=builder /app/panel-core /panel-core

# Expose port
EXPOSE 8081

# Run as non-root (security best practice)
USER nonroot:nonroot

CMD ["/panel-core"]
