#!/usr/bin/env bash
# Quick log viewer for all services

echo "📋 ShadowSurface Logs"
echo "Usage: ./logs.sh [app|worker|postgres|redis|nginx|all]"
echo ""

SERVICE=${1:-app}

if [ "$SERVICE" == "all" ]; then
    docker compose logs -f --tail 100
else
    docker compose logs -f --tail 100 "$SERVICE"
fi
