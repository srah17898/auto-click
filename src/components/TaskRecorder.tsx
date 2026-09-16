import { useState, useEffect } from 'react';
import { Action, ExecutorStatus, ExecutorStatusType } from '../types';
import { Disc, Square, Play, Pause, AlertCircle, Save, X, Trash2, Clock, CheckCircle } from 'lucide-react';

interface TaskRecorderProps {
  status: ExecutorStatus | null;
  connectionStatus: ExecutorStatusType;
  onStartRecord: () => Promise<boolean>;
  onStopRecord: () => Promise<Action[]>;
  onSaveRecordedTask: (name: string, description: string, actions: Action[]) => void;
  onClose: () => void;
}

export default function TaskRecorder({
  status,
  connectionStatus,
  onStartRecord,
  onStopRecord,
  onSaveRecordedTask,
  onClose,
}: TaskRecorderProps) {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'finished'>('idle');
  const [recordedActions, setRecordedActions] = useState<Action[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Stop watch for recording duration
  useEffect(() => {
    let interval: any = null;
    if (recordingState === 'recording' && status?.recording) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else if (recordingState === 'idle') {
      setSecondsElapsed(0);
    }
    return () => clearInterval(interval);
  }, [recordingState, status]);

  // Sync state if python status tells us it's recording
  useEffect(() => {
    if (status?.recording) {
      setRecordingState('recording');
    }
  }, [status]);

  const handleStart = async () => {
    setError(null);
    if (connectionStatus === 'disconnected') {
      setError('O executor local está desconectado. Siga as instruções para iniciá-lo no seu Linux antes de gravar.');
      return;
    }
    const success = await onStartRecord();
    if (success) {
      setRecordingState('recording');
      setRecordedActions([]);
      setSecondsElapsed(0);
    } else {
      setError('Não foi possível iniciar a gravação. Verifique as permissões de periféricos no seu computador.');
    }
  };

  const handleStop = async () => {
    setError(null);
    try {
      const actions = await onStopRecord();
      setRecordedActions(actions);
      setRecordingState('finished');
      setName(`Gravação do Sistema - ${new Date().toLocaleDateString()}`);
      setDescription(`Tarefa gravada fisicamente com ${actions.length} ações.`);
    } catch (err: any) {
      setError('Falha ao obter ações gravadas do executor local.');
    }
  };

  const handleDeleteAction = (idx: number) => {
    setRecordedActions(recordedActions.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('O nome da tarefa gravada é obrigatório.');
      return;
    }
    if (recordedActions.length === 0) {
      setError('Não há ações na lista para salvar.');
      return;
    }
    onSaveRecordedTask(name.trim(), description.trim(), recordedActions);
    onClose();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="border border-slate-800 bg-slate-900/90 rounded-2xl p-6 shadow-2xl relative" id="recorder-panel">
      {/* Cabecera */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <Disc className={`w-5 h-5 ${recordingState === 'recording' ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
          <h3 className="text-lg font-bold text-slate-100">Gravar Nova Tarefa Local</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 border border-red-950 bg-red-950/20 rounded-xl flex items-start gap-3 text-sm text-red-300">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Flujo de Grabación */}
      {recordingState === 'idle' && (
        <div className="text-center py-10 space-y-6">
          <div className="w-20 h-20 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto shadow-inner">
            <Disc className="w-10 h-10 text-slate-500 hover:text-red-500 transition-colors cursor-pointer" onClick={handleStart} />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h4 className="text-base font-semibold text-slate-200">Pronto para Gravar</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ao iniciar a gravação, o executor monitorará cliques, teclas digitadas e o tempo entre cada um de forma inteligente. Ao concluir, salve a lista como uma tarefa editável.
            </p>
          </div>
          <button
            onClick={handleStart}
            className="bg-red-600 hover:bg-red-500 active:bg-red-650 text-white font-semibold text-xs px-6 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-red-950/40 transition-colors"
          >
            Iniciar Gravação Física
          </button>
        </div>
      )}

      {recordingState === 'recording' && (
        <div className="text-center py-10 space-y-6">
          <div className="flex items-center justify-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping" />
            <span className="font-mono text-3xl font-bold text-red-500 tracking-widest">{formatTime(secondsElapsed)}</span>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h4 className="text-sm font-semibold text-slate-300">Gravador Ativo - Realize as ações na sua tela</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Qualquer clique físico do mouse ou teclas pressionadas fora da janela do navegador serão gravados de forma segura, junto com o tempo de espera real.
            </p>
            {status && (
              <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl mt-3 text-xs text-cyan-400 font-mono inline-block">
                Ações Gravadas até agora: {status.recordedActionsCount || 0}
              </div>
            )}
          </div>

          <button
            onClick={handleStop}
            className="bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-6 py-2.5 rounded-xl cursor-pointer transition-colors inline-flex items-center gap-2"
          >
            <Square className="w-4 h-4 text-red-500" />
            Parar Gravação
          </button>
        </div>
      )}

      {recordingState === 'finished' && (
        <div className="space-y-6">
          <div className="bg-emerald-950/20 border border-emerald-900/60 p-4 rounded-xl flex items-center gap-3 text-sm text-emerald-300">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="font-semibold">Gravação concluída com sucesso!</p>
              <p className="text-xs text-emerald-400/80 mt-0.5">Capturadas {recordedActions.length} ações. Atribua um nome e salve-as abaixo.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Metadados */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Configurar Nova Tarefa</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nome da Tarefa Gravada</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Descrição</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none transition-all resize-none"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-800/60 space-y-2">
                <button
                  onClick={handleSave}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-650 text-white font-semibold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-950/40 inline-flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar como Tarefa
                </button>
                <button
                  onClick={() => setRecordingState('idle')}
                  className="w-full bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 font-semibold text-xs py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center"
                >
                  Gravar Novamente
                </button>
              </div>
            </div>

            {/* Listado de acciones capturadas para editar/eliminar antes de guardar */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Visualização Cronológica das Ações</span>
                <span className="text-cyan-400 font-mono text-[10px]">{recordedActions.length} itens</span>
              </h4>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 max-h-[300px] overflow-y-auto space-y-2.5">
                {recordedActions.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-10">Todas as ações foram removidas.</p>
                ) : (
                  recordedActions.map((act, idx) => (
                    <div key={act.id} className="flex items-center justify-between bg-slate-900/60 border border-slate-800/40 px-3 py-2 rounded-xl text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-mono text-[10px] w-4">{idx + 1}</span>
                        <span className={`font-bold px-2 py-0.5 rounded ${
                          act.type === 'click' ? 'bg-cyan-950 text-cyan-400 border border-cyan-900/30' :
                          act.type === 'wait' ? 'bg-amber-950 text-amber-400 border border-amber-900/30' :
                          act.type === 'type' ? 'bg-purple-950 text-purple-400 border border-purple-900/30' :
                          act.type === 'key' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30' :
                          'bg-slate-850 text-slate-300 border border-slate-800'
                        }`}>
                          {act.type === 'click' && `Clique (${act.params.button})`}
                          {act.type === 'wait' && `Esperar`}
                          {act.type === 'type' && `Digitar`}
                          {act.type === 'key' && `Teclar`}
                        </span>
                        <span className="text-slate-300 font-mono">
                          {act.type === 'click' && `X=${act.params.x}, Y=${act.params.y}`}
                          {act.type === 'wait' && `${act.params.seconds}s`}
                          {act.type === 'type' && `"${act.params.text}"`}
                          {act.type === 'key' && `${act.params.key}`}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteAction(idx)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-850 transition-all cursor-pointer"
                        title="Excluir ação da gravação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
