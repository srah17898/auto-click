# Auto Clicker Linux

O **Auto Clicker Linux** é um sistema profissional e seguro de automatização física de mouse e teclado para computadores Linux. O projeto é composto por duas partes: um **Painel Web de Controle moderno** (desenvolvido em React, Vite e Tailwind CSS) e um **Agente Executor Local** desenvolvido em Python 3.

Com ele, você pode criar rotinas complexas de cliques, digitação de textos, movimentação suave do mouse, tempos de espera e repetições em loop, além de gravar suas ações físicas no computador em tempo real para reprodução automática.

---

## 📂 Estrutura do Projeto

```text
/auto-clicker-linux
├── /frontend               # Código fonte do Painel Web (React/TypeScript)
│   ├── /src
│   │   ├── App.tsx         # Orquestrador de estado e comunicação HTTP
│   │   ├── types.ts        # Definições estritas de interfaces de dados
│   │   ├── /components
│   │   │   ├── Dashboard.tsx    # Controle central, telemetria e biblioteca
│   │   │   ├── TaskEditor.tsx   # Sequenciador visual de ações
│   │   │   ├── TaskRecorder.tsx # Interface do gravador de teclado/mouse
│   │   │   ├── Settings.tsx     # Ajustes de porta, token e atalhos
│   │   │   └── Instructions.tsx # Manual interativo dentro do app
│   │   ├── index.css
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── /executor               # Código fonte do Agente Local (Python)
│   ├── main.py             # Servidor HTTP local de automação e listeners
│   ├── requirements.txt    # Dependência única (pynput)
│   ├── config.json         # Configuração persistente (porta, token)
│   ├── install.sh          # Script bash de instalação com detecção de dependências
│   ├── start.sh            # Script bash de inicialização limpa
│   ├── uninstall.sh        # Script bash de desinstalação
│   └── auto-clicker.desktop # Atalho do sistema Linux desktop
└── README.md               # Este arquivo de documentação completo
```

---

## 🛠️ Requisitos e Instalação Local (Linux)

### 1. Dependências do Sistema
Como o Python precisa simular sinais físicos e escutar periféricos globais do Linux, ele requer pacotes de desenvolvimento do servidor gráfico X11. Abra o terminal e instale:

```bash
sudo apt update
sudo apt install -y python3-pip python3-dev python3-tk libxext-dev libxtst-dev
```

### 2. Instalação Automatizada
Navegue até a pasta `executor` e execute o script de instalação para criar um ambiente virtual isolado (`.venv`):

```bash
cd executor
chmod +x install.sh
./install.sh
```

---

## 🚀 Como Iniciar e Usar

### Passo 1: Iniciar o Agente Local (Terminal)
Com a instalação concluída, execute o script de inicialização rápida:

```bash
./start.sh
```
O console exibirá as seguintes informações:
```text
--- AUTO CLICKER LINUX EXECUTOR RUNNING ---
Puerto local: 18080
Token de Autenticación: clicker-token-seguro-123
Parada de emergencia: Tecla ESC
-------------------------------------------
```

### Passo 2: Acessar o Painel Web
Abra o painel web no seu navegador. 

1. Acesse a aba **Configurações**.
2. Certifique-se de que a **Porta** está configurada como `18080` e o **Token** é `clicker-token-seguro-123`.
3. Clique em **Testar Conexão**. O status no cabeçalho mudará para **Conectado**.

---

## 🧪 Receitas de Testes Rápidos

### Teste 1: Testar Clique do Mouse
1. No Painel Principal, clique em **Nova tarefa**.
2. Adicione uma ação de **Clique do Mouse**.
3. Defina as coordenadas: `X=150`, `Y=150`, selecione o botão **Esquerdo** e clique em **Salvar**.
4. Clique em **Executar** na tarefa correspondente.
5. Uma janela de confirmação de segurança será exibida. Clique em **Autorizar e Iniciar**.
6. O ponteiro do mouse pulará para a posição `X=150, Y=150` na sua tela e executará o clique.

### Teste 2: Testar Digitação Sequencial
1. Abra um editor de texto no seu Linux (como o Gedit, Kate ou VS Code) e coloque-o ao lado da tela.
2. No Painel Principal, crie uma tarefa com a seguinte sequência:
   - **Ação 1:** Clique do Mouse na área interna do seu editor de texto (ex: `X=500`, `Y=400`).
   - **Ação 2:** Esperar `1.5` segundos.
   - **Ação 3:** Digitar Texto com o conteúdo: `Olá do Auto Clicker!`.
   - **Ação 4:** Pressionar Tecla com o valor: `enter`.
3. Salve a tarefa e clique em **Executar** (Autorizando a ativação física).
4. Assista ao executor focar a janela do editor, aguardar o tempo de segurança e digitar perfeitamente a frase!

### Teste 3: Testar Gravação Física
1. No Painel Principal, clique no botão **Gravar tarefa**.
2. O modal do gravador abrirá. Clique em **Iniciar Gravação Física**.
3. Agora, clique em alguns locais da sua tela ou digite no teclado. O executor local registrará as posições geométricas e os tempos de atraso reais.
4. Volte ao navegador e clique em **Parar Gravação**.
5. Uma linha de tempo cronológica com todas as ações será montada.
6. Dê um nome à gravação e clique em **Salvar como Tarefa** para transformá-la em uma rotina 100% editável!

### Teste 4: Parada de Emergência
1. Crie uma tarefa simples e altere o **Modo de Repetição** para **Repetir continuamente (Infinito)**.
2. Inicie a execução.
3. Para interromper o loop imediatamente a qualquer momento, pressione a tecla **`ESC`** física no teclado do seu computador Linux.
4. O executor local travará instantaneamente a simulação, cancelando o loop e salvaguardando o controle da sua máquina.

---

## 🔒 Segurança e Boas Práticas

- **Token de Autenticação (Auth Token):** O executor local rejeitará qualquer comando enviado sem o cabeçalho `X-Auth-Token` correto. Isso impede que outros sites executem rotinas maliciosas no seu computador.
- **Isolamento de Código:** O executor aceita apenas comandos estruturados geométricos e de teclado. Ele **nunca** executa comandos arbitrários de console ou terminal enviados pelo navegador.
- **Gravação Controlada:** Os listeners de gravação desligam-se automaticamente após o encerramento da captura, impedindo espionagem em segundo plano (keylogging).

---

## ⚠️ Limitações do Linux e Solução de Problemas

### 🔴 O mouse não se move ou não clica (Wayland vs X11)
A maioria das distribuições Linux modernas (como Ubuntu 22.04+ ou Fedora) utilizam o servidor de exibição **Wayland**. Por segurança, o Wayland restringe severamente que programas em segundo plano controlem ou escutem periféricos globais.
- **Solução:** Encerre sua sessão atual (Log out). Na tela de login do Linux, clique no seu usuário e depois no ícone de engrenagem no canto inferior direito. Escolha **"Ubuntu sobre Xorg"** ou **"X11"** e faça o login. Sob o X11, a automação de periféricos funcionará com total desempenho.

### 🔴 O cursor não clica em janelas de Administrador
Janelas rodando com privilégios de root (como o Terminal de Administrador ou Gerenciador de Arquivos do sistema) recusam comandos físicos gerados por usuários comuns.
- **Solução:** Inicie o executor local como superusuário no terminal:
  ```bash
  sudo .venv/bin/python3 main.py
  ```

### 🔴 Erro de Dependência Ausente "pynput"
Se a instalação falhar ou avisar que a biblioteca `pynput` não existe:
- Certifique-se de que instalou os pacotes de desenvolvimento do X11 (`libxext-dev` e `libxtst-dev`) listados no passo 1.
- Caso o ambiente virtual dê erro, você pode instalar localmente forçando os pacotes de sistema se necessário:
  ```bash
  pip3 install --user pynput --break-system-packages
  ```
