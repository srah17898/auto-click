import { BookOpen, Terminal, CheckCircle2, HelpCircle, AlertTriangle } from 'lucide-react';

export default function Instructions() {
  return (
    <div className="space-y-6 text-slate-300">
      <div className="border border-slate-800/80 bg-slate-900/60 p-6 rounded-2xl" id="manual-intro">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-semibold text-slate-100">Guia de Instalação e Uso do Executor</h2>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          O **Auto Clicker Linux** necessita de um pequeno programa local executando no seu computador para enviar comandos físicos de mouse e teclado. Siga os passos abaixo para configurá-lo e conectá-lo com segurança a este painel web.
        </p>
      </div>

      {/* Instalação em Passos */}
      <div className="border border-slate-800/80 bg-slate-900/60 p-6 rounded-2xl space-y-4" id="manual-steps">
        <h3 className="text-lg font-medium text-slate-100 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-purple-400" />
          Passo a Passo de Instalação no Linux
        </h3>
        
        <div className="space-y-4 text-sm">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs border border-slate-700">1</span>
            <div>
              <p className="font-semibold text-slate-200">Abra um terminal e navegue até a pasta do executor:</p>
              <p className="text-xs text-slate-400 mt-1">Geralmente incluído no arquivo baixado ou no diretório local do projeto.</p>
              <pre className="bg-slate-950 px-3 py-2 rounded-lg font-mono text-xs text-cyan-400 mt-2 overflow-x-auto">
                cd auto-clicker-linux/executor
              </pre>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs border border-slate-700">2</span>
            <div>
              <p className="font-semibold text-slate-200">Garanta as dependências de sistema (Debian/Ubuntu/Mint):</p>
              <p className="text-xs text-slate-400 mt-1">O controle de periféricos exige acesso a bibliotecas X11 de simulação e interface.</p>
              <pre className="bg-slate-950 px-3 py-2 rounded-lg font-mono text-xs text-cyan-400 mt-2 overflow-x-auto">
                sudo apt update && sudo apt install -y python3-pip python3-dev python3-tk libxext-dev libxtst-dev
              </pre>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs border border-slate-700">3</span>
            <div>
              <p className="font-semibold text-slate-200">Execute o script de instalação:</p>
              <p className="text-xs text-slate-400 mt-1">Este script criará um ambiente virtual seguro isolando as dependências de Python.</p>
              <pre className="bg-slate-950 px-3 py-2 rounded-lg font-mono text-xs text-cyan-400 mt-2 overflow-x-auto">
                chmod +x install.sh && ./install.sh
              </pre>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs border border-slate-700">4</span>
            <div>
              <p className="font-semibold text-slate-200">Inicie o executor local:</p>
              <p className="text-xs text-slate-400 mt-1">Iniciará o servidor HTTP local na porta de comunicação.</p>
              <pre className="bg-slate-950 px-3 py-2 rounded-lg font-mono text-xs text-cyan-400 mt-2 overflow-x-auto">
                chmod +x start.sh && ./start.sh
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Compatibilidade X11 vs Wayland */}
      <div className="border border-slate-800/80 bg-amber-950/20 p-6 rounded-2xl" id="compat-alert">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-semibold text-amber-200">Importante: Compatibilidade com Wayland / X11</h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed space-y-2">
          Os servidores gráficos Linux modernos usam **Wayland** por padrão (como Ubuntu 22.04+ e Fedora). Por questões de segurança rígidas, o Wayland impede que qualquer programa capture ou simule cliques e teclas fora da sua própria janela.
        </p>
        <div className="mt-3 text-xs text-slate-400 space-y-2 leading-relaxed">
          <p className="flex items-start gap-1">
            <span className="text-amber-400 font-bold">• Solução Recomendada:</span>
            <span>Se o executor não registrar ou não conseguir mover o mouse, encerre sua sessão atual do Linux e, na tela de login (GDM/SDDM), clique no ícone de engrenagem no canto inferior direito e escolha <strong>&quot;Ubuntu sobre Xorg&quot;</strong> ou <strong>&quot;X11&quot;</strong>.</span>
          </p>
          <p className="flex items-start gap-1">
            <span className="text-amber-400 font-bold">• Execução como Root:</span>
            <span>Algumas janelas protegidas (de administrador) exigirão que o executor local seja rodado com permissões elevadas se você precisar clicar dentro delas.</span>
          </p>
        </div>
      </div>

      {/* Instruções de Teste */}
      <div className="border border-slate-800/80 bg-slate-900/60 p-6 rounded-2xl space-y-4" id="manual-testing">
        <h3 className="text-lg font-medium text-slate-100 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          Como realizar os Testes de Automação
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <h4 className="font-semibold text-slate-200 mb-2">1. Testar Clique de Mouse</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Adicione a ação de <strong>Clique do Mouse</strong> com coordenadas específicas (ex: X=100, Y=150) e selecione o botão esquerdo. Clique em Executar. O mouse do seu sistema irá saltar até a coordenada e clicar automaticamente.
            </p>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <h4 className="font-semibold text-slate-200 mb-2">2. Testar Digitação de Texto</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Abra um editor de texto simples no seu Linux (como o Gedit ou VSCode). Crie uma tarefa com uma ação de clique na área do editor, adicione uma ação de <strong>Digitar Texto</strong> (&quot;Olá mundo!&quot;) e uma ação de <strong>Pressionar Tecla</strong> (ENTER). Veja-o digitar em tempo real!
            </p>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <h4 className="font-semibold text-slate-200 mb-2">3. Testar Gravação Inteligente</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ative o modo <strong>Gravar tarefa</strong>, realize alguns cliques na sua tela e pressione teclas. Em seguida, clique em Parar Gravação no painel. O painel importará toda a linha cronológica de ações e intervalos para que você a edite.
            </p>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <h4 className="font-semibold text-slate-200 mb-2">4. Parada de Emergência</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Se uma repetição infinita sair do controle, pressione a tecla <strong className="text-red-400 bg-red-950/50 px-1 py-0.5 rounded border border-red-900/50">ESC</strong> no teclado físico do seu computador. O executor irá travar a thread de simulação imediatamente e retornar ao estado seguro de prontidão.
            </p>
          </div>
        </div>
      </div>

      {/* Checklist de Segurança */}
      <div className="border border-slate-800/80 bg-slate-900/60 p-6 rounded-2xl" id="security-checklist">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-semibold text-slate-100">Políticas de Segurança e Proteções Ativas</h3>
        </div>
        <ul className="space-y-2 text-xs text-slate-400 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✔</span>
            <span><strong>Token de Autenticação Único:</strong> Cada requisição vinda do painel carrega um token criptográfico configurado. Sites não autorizados não podem acessar sua máquina.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✔</span>
            <span><strong>Nenhuma Captura Permanente:</strong> O detector de gravação só liga quando você clica em &quot;Gravar tarefa&quot; e se autodesliga ao parar, garantindo total privacidade.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✔</span>
            <span><strong>Sem Comandos de Terminal Remotos:</strong> O executor não aceita strings bash ou de shell direto. Apenas executa movimentos geométricos e teclas pré-definidas.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
