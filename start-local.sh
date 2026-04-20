#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-8080}"

echo "Iniciando Planificador de Comidas en http://localhost:${PORT}"
python3 -m http.server "${PORT}"
