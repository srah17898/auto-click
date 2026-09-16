#!/bin/bash

# Auto Clicker Linux - Install Script
# Script de instalación automatizado para configurar el entorno local.

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0;0m' # No Color

echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}      INSTALADOR DE AUTO CLICKER LINUX         ${NC}"
echo -e "${GREEN}===============================================${NC}"

# 1. Verificar si es Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${RED}Error: Este instalador está diseñado únicamente para sistemas Linux.${NC}"
    exit 1
fi

# 2. Verificar Python3
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 no está instalado.${NC}"
    echo -e "Instálalo con: sudo apt install python3"
    exit 1
fi

echo -e "${GREEN}[✔] Python 3 detectado.${NC}"

# 3. Detectar gestor de paquetes de sistema y advertir dependencias de X11 si es necesario
if command -v apt-get &> /dev/null; then
    echo -e "${YELLOW}Detectado Debian/Ubuntu. Se recomiendan los siguientes paquetes de sistema para emulación de mouse y teclado:${NC}"
    echo -e "  sudo apt update && sudo apt install -y python3-pip python3-dev python3-tk libxext-dev libxtst-dev"
    echo ""
fi

# 4. Crear un entorno virtual (recomendado para Linux moderno con PEP 668)
echo -e "${YELLOW}Creando un entorno virtual de Python (.venv) para aislar dependencias...${NC}"
python3 -m venv .venv 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[✔] Entorno virtual creado con éxito.${NC}"
    echo -e "${YELLOW}Activando entorno virtual e instalando requisitos...${NC}"
    source .venv/bin/activate
    pip install -r requirements.txt
else
    echo -e "${YELLOW}No se pudo crear el entorno virtual (quizás falte python3-venv).${NC}"
    echo -e "${YELLOW}Intentando instalar dependencias en el espacio de usuario (--user)...${NC}"
    pip3 install --user -r requirements.txt --break-system-packages 2>/dev/null || pip3 install --user -r requirements.txt
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[✔] Dependencias de Python instaladas correctamente.${NC}"
else
    echo -e "${RED}[❌] Hubo problemas instalando dependencias. Asegúrese de tener 'pip' instalado.${NC}"
    echo -e "Sugerencia: sudo apt install python3-pip"
fi

# 5. Dar permisos de ejecución a main.py y start.sh
chmod +x main.py 2>/dev/null

echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}      ¡INSTALACIÓN COMPLETADA CON ÉXITO!      ${NC}"
echo -e "${GREEN}===============================================${NC}"
echo -e "Para iniciar el executor local, ejecute:"
echo -e "  ${YELLOW}./start.sh${NC}"
echo -e "O active el entorno virtual manualmente con:"
echo -e "  ${YELLOW}source .venv/bin/activate && python3 main.py${NC}"
echo -e "-----------------------------------------------"
