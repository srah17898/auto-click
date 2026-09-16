#!/bin/bash

# Auto Clicker Linux - Uninstall Script

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0;0m'

echo -e "${RED}===============================================${NC}"
echo -e "${RED}     DESINSTALADOR DE AUTO CLICKER LINUX       ${NC}"
echo -e "${RED}===============================================${NC}"

read -p "¿Está seguro de que desea eliminar el entorno de ejecución local? (s/n): " confirm

if [[ "$confirm" =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Eliminando entorno virtual (.venv)...${NC}"
    rm -rf .venv 2>/dev/null
    
    echo -e "${YELLOW}Eliminando configuraciones temporales...${NC}"
    rm -f config.json 2>/dev/null
    
    echo -e "${GREEN}[✔] Desinstalación completada con éxito.${NC}"
else
    echo -e "${GREEN}Desinstalación cancelada.${NC}"
fi
