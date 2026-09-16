import { useState, useEffect } from 'react';
import { Task, Action, ActionType } from '../types';
import { Plus, Trash2, ArrowUp, ArrowDown, Copy, Save, X, MousePointer, Type, Keyboard, Clock, HelpCircle } from 'lucide-react';

interface TaskEditorProps {
  task: Task | null; // null if creating a new task
  onSave: (task: Task) => void;
  onCancel: () => void;
}

const ACTION_DESCRIPTIONS: Record<ActionType, string> = {
  click: 'Clique do Mouse',
  wait: 'Esperar Tempo',
  type: 'Digitar Texto',
  key: 'Pressionar Tecla / Atalho',
  move: 'Mover Cursor'
};

const COMMON_KEYS = [
  'enter', 'tab', 'esc', 'backspace', 'space',
  'ctrl+c', 'ctrl+v', 'ctrl+t', 'ctrl+w', 'alt+f4'
];

export default function TaskEditor({ task, onSave, onCancel }: TaskEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [repeatMode, setRepeatMode] = useState<'once' | 'count' | 'infinite'>('once');
  const [repeatCount, setRepeatCount] = useState(1);
  const [pauseBetweenRepeats, setPauseBetweenRepeats] = useState(0);
  const [actions, setActions] = useState<Action[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Initialize form with task data if editing
  useEffect(() => {
    if (task) {
      setName(task.name);
      setDescription(task.description);
      setRepeatMode(task.repeatMode);
      setRepeatCount(task.repeatCount);
      setPauseBetweenRepeats(task.pauseBetweenRepeats);
      setActions(JSON.parse(JSON.stringify(task.actions))); // deep copy
    } else {
      // New task defaults
      setName('');
      setDescription('');
      setRepeatMode('once');
      setRepeatCount(1);
      setPauseBetweenRepeats(1);
      setActions([
        {
          id: 'act-' + Date.now() + '-1',
          type: 'click',
          params: { x: 500, y: 300, button: 'left', clicks: 1, interval: 0.1, duration: 0 }
        }
      ]);
    }
    setErrors([]);
  }, [task]);

  const addAction = (type: ActionType) => {
    const id = `act-${Date.now()}-${actions.length + 1}`;
    let newAction: Action;

    switch (type) {
      case 'click':
        newAction = {
          id,
          type,
          params: { x: 500, y: 300, button: 'left', clicks: 1, interval: 0.1, duration: 0 }
        };
        break;
      case 'wait':
        newAction = {
          id,
          type,
          params: { seconds: 1.5 }
        };
        break;
      case 'type':
        newAction = {
          id,
          type,
          params: { text: 'Olá Mundo!', interval: 0.05 }
        };
        break;
      case 'key':
        newAction = {
          id,
          type,
          params: { key: 'enter' }
        };
        break;
      case 'move':
        newAction = {
          id,
          type,
          params: { x: 100, y: 100, duration: 0.5 }
        };
        break;
    }

    setActions([...actions, newAction]);
  };

  const updateActionParam = (actionId: string, key: string, value: any) => {
    setActions(actions.map(act => {
      if (act.id === actionId) {
        return {
          ...act,
          params: {
            ...act.params,
            [key]: value
          }
        };
      }
      return act;
    }));
  };

  const removeAction = (actionId: string) => {
    setActions(actions.filter(act => act.id !== actionId));
  };

  const duplicateAction = (actionId: string, idx: number) => {
    const original = actions[idx];
    const duplicated: Action = {
      ...JSON.parse(JSON.stringify(original)),
      id: `act-${Date.now()}-dup-${idx}`
    };
    const updated = [...actions];
    updated.splice(idx + 1, 0, duplicated);
    setActions(updated);
  };

  const moveAction = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === actions.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...actions];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setActions(updated);
  };

  const handleSave = () => {
    const newErrors: string[] = [];
    if (!name.trim()) newErrors.push('O nome da tarefa é obrigatório.');
    if (actions.length === 0) newErrors.push('A tarefa deve conter pelo menos uma ação.');
    
    // Validate individual action params
    actions.forEach((act, idx) => {
      if (act.type === 'click' || act.type === 'move') {
        if (act.params.x === undefined || act.params.x < 0) newErrors.push(`Ação ${idx + 1}: Coordenada X deve ser maior ou igual a 0.`);
        if (act.params.y === undefined || act.params.y < 0) newErrors.push(`Ação ${idx + 1}: Coordenada Y deve ser maior ou igual a 0.`);
      }
      if (act.type === 'wait' && (act.params.seconds === undefined || act.params.seconds <= 0)) {
        newErrors.push(`Ação ${idx + 1}: Tempo de espera deve ser maior que 0.`);
      }
      if (act.type === 'type' && !act.params.text) {
        newErrors.push(`Ação ${idx + 1}: Digite o texto que deve ser inserido.`);
      }
      if (act.type === 'key' && !act.params.key) {
        newErrors.push(`Ação ${idx + 1}: Selecione ou digite um atalho/tecla.`);
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      // scroll to error
      const errEl = document.getElementById('editor-errors');
      if (errEl) errEl.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    onSave({
      id: task ? task.id : `task-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      actions,
      repeatMode,
      repeatCount: repeatMode === 'count' ? repeatCount : 1,
      pauseBetweenRepeats,
      createdAt: task ? task.createdAt : new Date().toLocaleString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Editor */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">{task ? 'Editar Tarefa' : 'Criar Nova Tarefa'}</h2>
          <p className="text-xs text-slate-400 mt-1">Configure uma linha de tempo de comandos físicos sequenciais.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-650 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-cyan-950/40 transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar Tarefa
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div id="editor-errors" className="bg-red-950/20 border border-red-900/60 p-4 rounded-xl text-red-300 text-xs space-y-1">
          <p className="font-semibold text-sm mb-1 text-red-200">Atenção! Corrija os seguintes problemas:</p>
          {errors.map((err, i) => (
            <p key={i} className="flex items-start gap-1">
              <span className="text-red-400 font-bold">•</span>
              <span>{err}</span>
            </p>
          ))}
        </div>
      )}

      {/* Info Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 border border-slate-800/80 bg-slate-900/60 p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Metadados da Tarefa</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1">Nome da Tarefa</label>
              <input
                type="text"
                placeholder="Ex: Abrir Navegador e Preencher Formulário"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1">Descrição</label>
              <textarea
                placeholder="Explique o que esta rotina faz para identificá-la no futuro..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Repetición y Loops */}
        <div className="border border-slate-800/80 bg-slate-900/60 p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Modo de Repetição</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1">Quantidade de Voltas</label>
              <select
                value={repeatMode}
                onChange={(e) => setRepeatMode(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none transition-all"
              >
                <option value="once">Executar apenas uma vez</option>
                <option value="count">Repetir quantidade definida</option>
                <option value="infinite">Repetir continuamente (Infinito)</option>
              </select>
            </div>

            {repeatMode === 'count' && (
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Número de Repetições</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={repeatCount}
                  onChange={(e) => setRepeatCount(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-1.5 text-sm text-slate-200 outline-none transition-all font-mono"
                />
                <p className="text-[10px] text-amber-400/80 mt-1">Limite preventivo de 1000 loops para evitar clicks descontrolados.</p>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1">Pausa entre Voltas (s)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={pauseBetweenRepeats}
                onChange={(e) => setPauseBetweenRepeats(Math.max(0, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-1.5 text-sm text-slate-200 outline-none transition-all font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Tempo de respiro antes de recomeçar a sequência.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Acciones Rápidas */}
      <div className="border border-slate-800/80 bg-slate-950/60 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Adicionar Ação à Sequência:</span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => addAction('click')}
            className="flex items-center gap-1 bg-cyan-950/40 hover:bg-cyan-900/50 active:bg-cyan-900/70 text-cyan-300 text-xs font-semibold px-3 py-2 rounded-xl border border-cyan-800/50 transition-colors cursor-pointer"
          >
            <MousePointer className="w-3.5 h-3.5" />
            + Clique Mouse
          </button>
          <button
            onClick={() => addAction('wait')}
            className="flex items-center gap-1 bg-amber-950/40 hover:bg-amber-900/50 active:bg-amber-900/70 text-amber-300 text-xs font-semibold px-3 py-2 rounded-xl border border-amber-800/50 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            + Esperar
          </button>
          <button
            onClick={() => addAction('type')}
            className="flex items-center gap-1 bg-purple-950/40 hover:bg-purple-900/50 active:bg-purple-900/70 text-purple-300 text-xs font-semibold px-3 py-2 rounded-xl border border-purple-800/50 transition-colors cursor-pointer"
          >
            <Type className="w-3.5 h-3.5" />
            + Digitar Texto
          </button>
          <button
            onClick={() => addAction('key')}
            className="flex items-center gap-1 bg-emerald-950/40 hover:bg-emerald-900/50 active:bg-emerald-900/70 text-emerald-300 text-xs font-semibold px-3 py-2 rounded-xl border border-emerald-800/50 transition-colors cursor-pointer"
          >
            <Keyboard className="w-3.5 h-3.5" />
            + Atalho/Tecla
          </button>
          <button
            onClick={() => addAction('move')}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <MousePointer className="w-3.5 h-3.5" />
            + Mover Mouse
          </button>
        </div>
      </div>

      {/* Línea de Tiempo de Acciones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Sequência de Comandos ({actions.length})</h3>
          {actions.length === 0 && (
            <span className="text-xs text-red-400 font-medium animate-pulse">Esta rotina está vazia! Adicione ações acima.</span>
          )}
        </div>

        <div className="space-y-3">
          {actions.map((act, idx) => (
            <div
              key={act.id}
              className={`border p-4 rounded-2xl relative transition-all ${
                act.type === 'click' ? 'border-cyan-900/50 bg-cyan-950/10' :
                act.type === 'wait' ? 'border-amber-900/50 bg-amber-950/10' :
                act.type === 'type' ? 'border-purple-900/50 bg-purple-950/10' :
                act.type === 'key' ? 'border-emerald-900/50 bg-emerald-950/10' :
                'border-slate-800 bg-slate-900/35'
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-3 pb-2 border-b border-slate-800/40">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-800/80 border border-slate-700 font-mono text-xs text-slate-300 w-5 h-5 flex items-center justify-center rounded">
                    {idx + 1}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    act.type === 'click' ? 'bg-cyan-950 text-cyan-400 border border-cyan-900/80' :
                    act.type === 'wait' ? 'bg-amber-950 text-amber-400 border border-amber-900/80' :
                    act.type === 'type' ? 'bg-purple-950 text-purple-400 border border-purple-900/80' :
                    act.type === 'key' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/80' :
                    'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {ACTION_DESCRIPTIONS[act.type]}
                  </span>
                </div>

                {/* Controles de Orden, Duplicado y Eliminación */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveAction(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                    title="Mover para cima"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveAction(idx, 'down')}
                    disabled={idx === actions.length - 1}
                    className="p-1 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                    title="Mover para baixo"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => duplicateAction(act.id, idx)}
                    className="p-1 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
                    title="Duplicar ação"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeAction(act.id)}
                    className="p-1 bg-slate-950 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded transition-colors"
                    title="Excluir ação"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Campos dinámicos según el tipo de acción */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
                {act.type === 'click' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-medium text-slate-400 uppercase">Coord X</label>
                      <input
                        type="number"
                        value={act.params.x ?? 0}
                        onChange={(e) => updateActionParam(act.id, 'x', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-medium text-slate-400 uppercase">Coord Y</label>
                      <input
                        type="number"
                        value={act.params.y ?? 0}
                        onChange={(e) => updateActionParam(act.id, 'y', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-medium text-slate-400 uppercase">Botão</label>
                      <select
                        value={act.params.button ?? 'left'}
                        onChange={(e) => updateActionParam(act.id, 'button', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                      >
                        <option value="left">Esquerdo</option>
                        <option value="right">Direito</option>
                        <option value="middle">Meio</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-medium text-slate-400 uppercase">Cliques</label>
                      <input
                        type="number"
                        min="1"
                        value={act.params.clicks ?? 1}
                        onChange={(e) => updateActionParam(act.id, 'clicks', Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-medium text-slate-400 uppercase">Intervalo (s)</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.01"
                        value={act.params.interval ?? 0.1}
                        onChange={(e) => updateActionParam(act.id, 'interval', Math.max(0.01, Number(e.target.value)))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-medium text-slate-400 uppercase">Dur. Mov (s)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={act.params.duration ?? 0}
                        onChange={(e) => updateActionParam(act.id, 'duration', Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono"
                      />
                    </div>
                  </>
                )}

                {act.type === 'move' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-medium text-slate-400 uppercase">Destino X</label>
                      <input
                        type="number"
                        value={act.params.x ?? 0}
                        onChange={(e) => updateActionParam(act.id, 'x', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-medium text-slate-400 uppercase">Destino Y</label>
                      <input
                        type="number"
                        value={act.params.y ?? 0}
                        onChange={(e) => updateActionParam(act.id, 'y', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono"
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <label className="block text-[10px] font-medium text-slate-400 uppercase">Duração Deslocamento (s)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={act.params.duration ?? 0.5}
                        onChange={(e) => updateActionParam(act.id, 'duration', Math.max(0.1, Number(e.target.value)))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono"
                      />
                    </div>
                  </>
                )}

                {act.type === 'wait' && (
                  <div className="space-y-1 col-span-4">
                    <label className="block text-[10px] font-medium text-slate-400 uppercase">Tempo de Espera Silenciosa (segundos)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={act.params.seconds ?? 1.5}
                      onChange={(e) => updateActionParam(act.id, 'seconds', Math.max(0.1, Number(e.target.value)))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1 text-slate-200 font-mono"
                    />
                  </div>
                )}

                {act.type === 'type' && (
                  <>
                    <div className="space-y-1 col-span-4">
                      <label className="block text-[10px] font-medium text-slate-400 uppercase">Digitar Texto Customizado</label>
                      <input
                        type="text"
                        value={act.params.text ?? ''}
                        onChange={(e) => updateActionParam(act.id, 'text', e.target.value)}
                        placeholder="Insira as palavras aqui..."
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1 text-slate-200"
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <label className="block text-[10px] font-medium text-slate-400 uppercase">Atraso de Tecla (s)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={act.params.interval ?? 0.05}
                        onChange={(e) => updateActionParam(act.id, 'interval', Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono"
                      />
                    </div>
                  </>
                )}

                {act.type === 'key' && (
                  <>
                    <div className="space-y-1 col-span-2">
                      <label className="block text-[10px] font-medium text-slate-400 uppercase">Mapear Tecla ou Atalho</label>
                      <input
                        type="text"
                        value={act.params.key ?? 'enter'}
                        onChange={(e) => updateActionParam(act.id, 'key', e.target.value)}
                        placeholder="Ex: enter, ctrl+c, alt+tab"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1 text-slate-200 font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1 col-span-4">
                      <label className="block text-[10px] font-medium text-slate-400 uppercase">Sugestões Rápidas de Teclas</label>
                      <div className="flex flex-wrap gap-1">
                        {COMMON_KEYS.map(k => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => updateActionParam(act.id, 'key', k)}
                            className="bg-slate-950 hover:bg-slate-800 text-[10px] text-slate-300 font-mono px-2 py-1 rounded border border-slate-800 transition-colors cursor-pointer"
                          >
                            {k}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botones de acción inferiores */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          onClick={onCancel}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-slate-300 text-sm font-semibold px-6 py-2.5 rounded-xl border border-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-650 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-cyan-950/40 transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Salvar Rotina Automatizada
        </button>
      </div>
    </div>
  );
}
