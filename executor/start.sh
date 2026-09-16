#!/bin/bash

# Auto Clicker Linux - Start Script
# Script para iniciar de forma limpia el executor local.

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0;0m'

# Ir al directorio del script
cd "$(dirname "$0")"

echo -e "${GREEN}Iniciando Auto Clicker Linux Local Executor...${NC}"

# Leer puerto y token por defecto del config.json si existe
PORT=18080
TOKEN="clicker-token-seguro-123"

if [ -f "config.json" ]; then
    # Intentar parsear con python por simplicidad
    PORT=$(python3 -c "import json; print(json.load(open('config.json'))['port'])" 2>/dev/null || echo "18080")
    TOKEN=$(python3 -c "import json; print(json.load(open('config.json'))['token'])" 2>/dev/null || echo "clicker-token-seguro-123")
fi

# Activar el entorno virtual si existe
if [ -d ".venv" ]; then
    echo -e "${YELLOW}Entorno virtual (.venv) detectado. Activando...${NC}"
    source .venv/bin/activate
fi

# Lanzar el servidor
echo -e "${GREEN}Corriendo servidor en puerto ${PORT}...${NC}"
echo -e "${YELLOW}Presione CTRL+C para detener el servidor.${NC}"
echo ""

python3 main.py --port "$PORT" --token "$TOKEN"
