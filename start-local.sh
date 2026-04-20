#!/usr/bin/env bash
set -euo pipefail

HOST="${1:-0.0.0.0}"
PORT="${2:-8080}"

LOCAL_URL="http://localhost:${PORT}"
NETWORK_URL="http://${HOST}:${PORT}"

if command -v hostname >/dev/null 2>&1; then
  IP_CANDIDATE="$(hostname -I 2>/dev/null | awk '{print $1}')"
  if [[ -n "${IP_CANDIDATE}" ]]; then
    NETWORK_URL="http://${IP_CANDIDATE}:${PORT}"
  fi
fi

echo "Iniciando Planificador de Comidas..."
echo "- URL local: ${LOCAL_URL}"
echo "- URL red:   ${NETWORK_URL}"
echo "Presiona Ctrl + C para detener el servidor."

python3 -m http.server "${PORT}" --bind "${HOST}"
