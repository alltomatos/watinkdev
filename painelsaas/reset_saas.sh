#!/bin/bash
echo "🧨 Destroying SaaS Stack..."
docker stack rm watink_saas

echo "⏳ Waiting 15s for container cleanup..."
sleep 15

echo "🧹 Removing Volumes (Data Wipe)..."
docker volume rm watink_saas_panel_db_data
docker volume rm watink_saas_panel_redis_data

echo "🔄 Triggering Rebuild & Deploy..."
./update_saas.sh
