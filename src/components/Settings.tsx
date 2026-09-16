import React, { useState } from 'react';
import { ExecutorConfig, ExecutorStatusType } from '../types';
import { Settings as SettingsIcon, Link2, Shield, Eye, EyeOff, CheckCircle, AlertCircle, RefreshCw, Sliders } from 'lucide-react';

interface SettingsProps {
  config: ExecutorConfig;
  onSave: (config: ExecutorConfig) => void;
  connectionStatus: ExecutorStatusType;
  testConnection: () => Promise<void>;
  isTesting: boolean;
  testError: string | null;
}

export default function Settings({
  config,
  onSave,
  connectionStatus,
  testConnection,
  isTesting,
  testError,
}: SettingsProps) {
  const [port, setPort] = useState(config.port);
  const [token, setToken] = useState(config.token);
  const [defaultDelay, setDefaultDelay] = useState(config.defaultDelay);
  const [typeSpeed, setTypeSpeed] = useState(config.typeSpeed);
  const [emergencyShortcut, setEmergencyShortcut] = useState(config.emergencyShortcut);
  const [showToken, setShowToken] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      port: Number(port),
      token,
      defaultDelay: Number(defaultDelay),
      typeSpeed: Number(typeSpeed),
      emergencyShortcut,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 text-slate-300">
      {/* Estado del Agente */}
      <div className="border border-slate-800/80 bg-slate-900/60 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-cyan-400" />
            Conexão com o Executor Local
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Verifique se o seu script local está ativo no endereço <code className="text-cyan-400 font-mono">http://127.0.0.1:{port}</code>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
              connectionStatus === 'running' ? 'bg-blue-500 animate-pulse' :
              connectionStatus === 'paused' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
            }`} />
            <span className="text-sm font-semibold capitalize text-slate-200">
              {connectionStatus === 'connected' && 'Conectado e Pronto'}
              {connectionStatus === 'running' && 'Executando Tarefa'}
              {connectionStatus === 'paused' && 'Pausado'}
              {connectionStatus === 'disconnected' && 'Desconectado'}
            </span>
          </div>
          <button
            onClick={testConnection}
            disabled={isTesting}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-650 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 text-slate-200 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin text-cyan-400' : ''}`} />
            Testar Conexão
          </button>
        </div>
      </div>

      {testError && (
        <div className="border border-red-950 bg-red-950/20 p-4 rounded-xl flex items-start gap-3 text-sm text-red-300">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Erro de Conexão com o Executor Local</p>
            <p className="text-xs text-red-400/90 mt-1 leading-relaxed">
              {testError}. Certifique-se de executar <code className="bg-red-950/50 px-1 py-0.5 rounded border border-red-900/40 text-red-300">./start.sh</code> na pasta do executor local do seu computador Linux e que o token e a porta coincidam.
            </p>
          </div>
        </div>
      )}

      {/* Formulário de Configurações */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rede e Autenticação */}
          <div className="border border-slate-800/80 bg-slate-900/60 p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-purple-400" />
              Parâmetros de Rede e Autenticação
            </h3>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Porta HTTP do Daemon</label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none transition-all font-mono"
                required
              />
              <p className="text-[11px] text-slate-500">Porta padrão recomendada: 18080.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Token de Segurança (Auth Token)</label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-xl pl-4 pr-10 py-2 text-sm text-slate-200 outline-none transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">Utilizado para autenticar comandos. Deve ser igual ao configurado no executor local.</p>
            </div>
          </div>

          {/* Comportamento de Automação */}
          <div className="border border-slate-800/80 bg-slate-900/60 p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 mb-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Preferências de Execução
            </h3>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Intervalo Padrão entre Ações (s)</label>
              <input
                type="number"
                step="0.05"
                value={defaultDelay}
                onChange={(e) => setDefaultDelay(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none transition-all font-mono"
                required
              />
              <p className="text-[11px] text-slate-500">Atraso de segurança padrão aplicado se não especificado.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Velocidade de Digitação (s por tecla)</label>
              <input
                type="number"
                step="0.01"
                value={typeSpeed}
                onChange={(e) => setTypeSpeed(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none transition-all font-mono"
                required
              />
              <p className="text-[11px] text-slate-500">Intervalo opcional entre teclas ao usar a ação de digitar texto.</p>
            </div>
          </div>
        </div>

        {/* Parada de Emergência */}
        <div className="border border-slate-800/80 bg-slate-900/60 p-6 rounded-2xl space-y-3">
          <h3 className="text-base font-semibold text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            Mecanismo de Parada de Emergência
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Por motivos de integridade e usabilidade física, pressionar a tecla configurada irá suspender instantaneamente o loop de repetição ativa e forçar o executor local a retornar ao estado seguro.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <div className="w-1/3 min-w-[120px]">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Tecla de Emergência</label>
              <select
                value={emergencyShortcut}
                onChange={(e) => setEmergencyShortcut(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none transition-all"
              >
                <option value="esc">ESC (Recomendado)</option>
                <option value="f12">F12</option>
                <option value="space">Espaço</option>
              </select>
            </div>
            <div className="text-xs text-slate-500 leading-relaxed self-end pb-1.5">
              Ao iniciar qualquer automação de longo prazo, mantenha a mão próxima da tecla <strong className="text-red-400 bg-red-950/35 px-1 py-0.5 rounded border border-red-900/40">ESC</strong> para interromper cliques excessivos de forma imediata.
            </div>
          </div>
        </div>

        {/* Botão de Salvar */}
        <div className="flex items-center justify-between">
          <div>
            {saveSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Configurações salvas e enviadas!
              </div>
            )}
          </div>
          <button
            type="submit"
            className="bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-650 text-white font-semibold text-sm px-6 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-cyan-950/40 transition-all flex items-center gap-2"
          >
            <SettingsIcon className="w-4 h-4" />
            Salvar Configurações
          </button>
        </div>
      </form>
    </div>
  );
}
