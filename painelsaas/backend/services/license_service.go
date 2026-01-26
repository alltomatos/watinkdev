package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/watink/panel-core/database"
)

// SyncLicenseToRedis atualiza o status de uma licença manualmente
func SyncLicenseToRedis(token, status string) error {
	ctx := context.Background()
	// TTL 0 (Sem expiração) ou mantenha 30 dias se preferir
	return database.RedisClient.Set(ctx, "license:"+token, status, 30*24*time.Hour).Err()
}

// ActivateInstance gera um token de licença e ativa no Redis
func ActivateInstance(instanceID string) (string, error) {
	// 1. Gerar Token Seguro (sk_live_...)
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("erro ao gerar entropia: %v", err)
	}
	token := "sk_live_" + hex.EncodeToString(bytes)

	// 2. Salvar no Redis (Chave: license:{token} -> Valor: active)
	// Definimos um TTL (ex: 30 dias) ou 0 para infinito dependendo da regra de negócio
	ctx := context.Background()
	err := database.RedisClient.Set(ctx, "license:"+token, "active", 30*24*time.Hour).Err()

	if err != nil {
		return "", fmt.Errorf("erro ao salvar licença no Redis: %v", err)
	}

	fmt.Printf("🔑 Nova licença gerada para Instância %s: %s\n", instanceID, token)
	return token, nil
}
