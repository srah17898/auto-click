import React, { useState } from 'react';
import { Task, ExecutorStatus, ExecutorStatusType } from '../types';
import { 
  Play, Pause, Square, AlertCircle, Plus, Disc, FileDown, FileUp, 
  Trash2, Edit3, Copy, RefreshCw, Terminal, Clock, Activity, Settings2, ShieldAlert
} from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  status: ExecutorStatus | null;
  connectionStatus: ExecutorStatusType;
  onSelectNewTask: () => void;
  onSelectRecordTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onDuplicateTask: (id: string) => void;
  onExportTask: (task: Task) => void;
  onImportTask: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRunTask: (task: Task) => Promise<void>;
  onPauseTask: () => Promise<void>;
  onResumeTask: () => Promise<void>;
  onStopTask: () => Promise<void>;
  testConnection: () => Promise<void>;
  isTesting: boolean;
}

export default function Dashboard({
  tasks,
  status,
  connectionStatus,
  onSelectNewTask,
  onSelectRecordTask,
  onEditTask,
  onDeleteTask,
  onDuplicateTask,
  onExportTask,
  onImportTask,
  onRunTask,
  onPauseTask,
  onResumeTask,
  onStopTask,
  testConnection,
  isTesting,
}: DashboardProps) {
  const [confirmTask, setConfirmTask] = useState<Task | null>(null);

  const triggerRunTask = (task: Task) => {
    if (connectionStatus === 'disconnected') {
      alert('Não é possível iniciar: O executor local está desconectado. Certifique-se de iniciá-lo no terminal.');
      return;
    }
    // Mostrar confirmación obligatoria
    setConfirmTask(task);
  };

  const handleConfirmRun = async () => {
    if (confirmTask) {
      await onRunTask(confirmTask);
      setConfirmTask(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Panel de Estado y Métricas en Tiempo Real */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-slate-800/80 bg-slate-900/60 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-semibold text-slate-100">Status do Sistema</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
                connectionStatus === 'running' ? 'bg-blue-500 animate-pulse' :
                connectionStatus === 'paused' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
              }`} />
              <span className="text-xs font-mono font-semibold uppercase text-slate-300">
                {connectionStatus === 'connected' && 'Conectado'}
                {connectionStatus === 'running' && 'Executando Automação'}
                {connectionStatus === 'paused' && 'Pausado'}
                {connectionStatus === 'disconnected' && 'Desconectado'}
              </span>
            </div>
          </div>

          {/* Métricas e Progresso */}
          {connectionStatus === 'running' || connectionStatus === 'paused' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850">
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Rotina Ativa</span>
                <span className="text-sm font-semibold text-slate-100 truncate block">
                  {status?.activeTask || 'Automação'}
                </span>
              </div>
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850">
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Ação Atual</span>
                <span className="text-sm font-mono font-semibold text-cyan-400">
                  {status?.currentActionIndex !== undefined && status.currentActionIndex >= 0 ? status.currentActionIndex + 1 : 0}
                  <span className="text-slate-500"> / {status?.logs ? 'Processando' : 'Calculando'}</span>
                </span>
              </div>
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850">
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Volta / Loop</span>
                <span className="text-sm font-mono font-semibold text-purple-400">
                  {status?.currentRepeat || 0}
                  <span className="text-slate-500"> / {status?.totalRepeats === -1 ? '∞' : (status?.totalRepeats || 0)}</span>
                </span>
              </div>
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850">
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Tempo Corrido</span>
                <span className="text-sm font-mono font-semibold text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {status?.elapsedTime || 0}s
                </span>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400 bg-slate-950/20 rounded-xl border border-slate-850/60">
              {connectionStatus === 'disconnected' ? (
                <p className="text-red-400/95 font-medium">⚠️ Executor Local Desconectado. Ative seu start.sh para começar.</p>
              ) : (
                <p>Nenhuma automação ativa neste momento. Selecione uma tarefa abaixo e clique em Executar.</p>
              )}
            </div>
          )}

          {/* Botones de Control de Ejecución Global */}
          <div className="flex items-center gap-2 pt-2">
            {connectionStatus === 'running' && (
              <button
                onClick={onPauseTask}
                className="flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-650 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-amber-950/40 cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                Pausar Execução
              </button>
            )}
            {connectionStatus === 'paused' && (
              <button
                onClick={onResumeTask}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-650 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                Continuar
              </button>
            )}
            {(connectionStatus === 'running' || connectionStatus === 'paused') && (
              <button
                onClick={onStopTask}
                className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 active:bg-red-650 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-red-950/40 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" />
                Interromper (Parar)
              </button>
            )}
          </div>
        </div>

        {/* Status de Conexão Rápido */}
        <div className="border border-slate-800/80 bg-slate-900/60 p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-200">Executor Local</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verifique e envie tarefas físicas para o driver local Python do seu computador.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-950/40 border border-slate-850 px-3 py-1.5 rounded-lg">
              <span>Porta:</span>
              <span className="text-cyan-400 font-bold">18080</span>
            </div>
            <button
              onClick={testConnection}
              disabled={isTesting}
              className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-750 active:bg-slate-700 border border-slate-700 text-xs font-semibold py-2.5 rounded-xl text-slate-300 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              Testar Conexão Local
            </button>
          </div>
        </div>
      </div>

      {/* 2. Listado de Tareas Guardadas */}
      <div className="border border-slate-800/80 bg-slate-900/60 p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Biblioteca de Rotinas Automatizadas</h2>
            <p className="text-xs text-slate-400">Salve, gerencie e ordene seus fluxos de cliques e digitação no navegador.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-slate-300 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 cursor-pointer transition-colors">
              <FileUp className="w-3.5 h-3.5" />
              Importar
              <input type="file" accept=".json" onChange={onImportTask} className="hidden" />
            </label>
            <button
              onClick={onSelectRecordTask}
              className="flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/50 active:bg-red-900/70 text-red-300 text-xs font-semibold px-3 py-2 rounded-xl border border-red-800/40 transition-colors cursor-pointer"
            >
              <Disc className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              Gravar tarefa
            </button>
            <button
              onClick={onSelectNewTask}
              className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-650 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-cyan-950/40 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova tarefa
            </button>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm text-slate-400">Você ainda não possui rotinas salvas.</p>
            <button
              onClick={onSelectNewTask}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
            >
              Criar minha primeira tarefa
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map(task => (
              <div 
                key={task.id} 
                className="border border-slate-800/80 bg-slate-950/40 p-4 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-all space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-200 text-sm truncate" title={task.name}>
                      {task.name}
                    </h3>
                    <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-900/30">
                      {task.actions.length} ações
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 h-8 leading-relaxed">
                    {task.description || 'Nenhuma descrição fornecida.'}
                  </p>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono">
                    <div className="bg-slate-900/60 px-2 py-1 rounded border border-slate-850">
                      <span>Loop: </span>
                      <span className="text-slate-300 font-semibold uppercase">
                        {task.repeatMode === 'once' && 'Uma vez'}
                        {task.repeatMode === 'count' && `${task.repeatCount}x`}
                        {task.repeatMode === 'infinite' && 'Infinito'}
                      </span>
                    </div>
                    <div className="bg-slate-900/60 px-2 py-1 rounded border border-slate-850">
                      <span>Intervalo: </span>
                      <span className="text-slate-300 font-semibold">{task.pauseBetweenRepeats}s</span>
                    </div>
                  </div>
                </div>

                {/* Acciones de la tarjeta */}
                <div className="flex items-center justify-between border-t border-slate-800/60 pt-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEditTask(task)}
                      className="text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                      title="Editar rotina"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDuplicateTask(task.id)}
                      className="text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                      title="Duplicar"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onExportTask(task)}
                      className="text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                      title="Exportar arquivo"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="text-slate-400 hover:text-red-400 p-1.5 rounded hover:bg-red-950/20 transition-colors cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => triggerRunTask(task)}
                    className="flex items-center gap-1 bg-cyan-950/50 hover:bg-cyan-900/50 text-cyan-400 hover:text-cyan-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-cyan-900/50 cursor-pointer transition-all"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Executar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Consola de Terminal de Logs do Executor */}
      <div className="border border-slate-800/80 bg-slate-950 p-5 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            Console de Logs do Executor Local
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">Porta de Comunicação: 18080</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 h-[200px] overflow-y-auto font-mono text-xs text-slate-300 space-y-1.5 shadow-inner">
          {status?.logs && status.logs.length > 0 ? (
            status.logs.map((log, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-slate-500 flex-shrink-0">[{log.timestamp}]</span>
                <span className={`flex-shrink-0 uppercase font-semibold text-[10px] px-1 rounded ${
                  log.level === 'error' ? 'bg-red-950/70 text-red-400 border border-red-900/40' :
                  log.level === 'warn' ? 'bg-amber-950/70 text-amber-400 border border-amber-900/40' :
                  log.level === 'success' ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-900/40' :
                  'bg-slate-800/70 text-slate-400 border border-slate-700/40'
                }`}>
                  {log.level}
                </span>
                <span className={
                  log.level === 'error' ? 'text-red-300' :
                  log.level === 'warn' ? 'text-amber-300' :
                  log.level === 'success' ? 'text-emerald-300' : 'text-slate-300'
                }>
                  {log.message}
                </span>
              </div>
            ))
          ) : (
            <p className="text-slate-500 italic text-center py-16">
              Aguardando eventos do executor local... Inicie seu servidor start.sh no Linux para alimentar os logs.
            </p>
          )}
        </div>
      </div>

      {/* OVERLAY / MODAL DE CONFIRMACIÓN DE EJECUCIÓN (MANDATARIO) */}
      {confirmTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-400 border-b border-slate-800 pb-3">
              <ShieldAlert className="w-6 h-6 text-red-500" />
              <h4 className="text-base font-bold text-slate-100">Confirmação de Controle Físico</h4>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p className="font-semibold text-slate-200">Você está prestes a iniciar a seguinte automação:</p>
              
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 font-mono">
                <p><span className="text-slate-500">Tarefa:</span> <span className="text-cyan-400 font-bold">{confirmTask.name}</span></p>
                <p><span className="text-slate-500">Ações:</span> <span className="text-slate-300">{confirmTask.actions.length} ações sequenciais</span></p>
                <p><span className="text-slate-500">Loops:</span> <span className="text-slate-300 capitalize">{confirmTask.repeatMode === 'once' ? 'Uma vez' : confirmTask.repeatMode === 'count' ? `${confirmTask.repeatCount} repetições` : 'Infinito'}</span></p>
                <p><span className="text-slate-500">Intervalo entre Loops:</span> <span className="text-slate-300">{confirmTask.pauseBetweenRepeats} segundos</span></p>
              </div>

              <div className="p-3.5 bg-red-950/20 border border-red-900/40 rounded-xl text-red-300 font-semibold space-y-1 flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-[11px] leading-relaxed">
                  <p>Aviso: O mouse e o teclado físico do seu computador serão controlados automaticamente por esta tarefa.</p>
                  <p className="text-red-400/90">Mantenha as mãos longe dos controles ou pressione a tecla <strong className="bg-red-950 px-1 py-0.5 border border-red-900 rounded">ESC</strong> física para cancelar em caso de emergência!</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3.5 pt-2 border-t border-slate-800">
              <button
                onClick={() => setConfirmTask(null)}
                className="bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRun}
                className="bg-red-600 hover:bg-red-500 active:bg-red-650 text-white text-xs font-semibold px-5 py-2 rounded-xl shadow-lg shadow-red-950/40 cursor-pointer transition-colors"
              >
                Autorizar e Iniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
