import React, { useState, useEffect } from 'react';
import { Task, Action, ExecutorConfig, ExecutorStatus, ExecutorStatusType } from './types';
import Dashboard from './components/Dashboard';
import TaskEditor from './components/TaskEditor';
import TaskRecorder from './components/TaskRecorder';
import Settings from './components/Settings';
import Instructions from './components/Instructions';
import { Play, Settings2, BookOpen, Cpu, Terminal, HelpCircle, ShieldCheck } from 'lucide-react';

const DEFAULT_CONFIG: ExecutorConfig = {
  port: 18080,
  token: 'clicker-token-seguro-123',
  defaultDelay: 0.5,
  typeSpeed: 0.05,
  emergencyShortcut: 'esc'
};

const SAMPLE_TASKS: Task[] = [
  {
    id: 'task-sample-1',
    name: 'Exemplo: Clicar e Digitar Sequencial',
    description: 'Rotina de demonstração de cliques, tempo de espera e digitação automatizada em loop.',
    actions: [
      {
        id: 'act-sample-1-1',
        type: 'click',
        params: { x: 500, y: 300, button: 'left', clicks: 1, interval: 0.1, duration: 0 }
      },
      {
        id: 'act-sample-1-2',
        type: 'wait',
        params: { seconds: 2 }
      },
      {
        id: 'act-sample-1-3',
        type: 'type',
        params: { text: 'Olá, esta é uma automação real do Auto Clicker Linux!', interval: 0.05 }
      },
      {
        id: 'act-sample-1-4',
        type: 'key',
        params: { key: 'enter' }
      },
      {
        id: 'act-sample-1-5',
        type: 'wait',
        params: { seconds: 1 }
      }
    ],
    repeatMode: 'count',
    repeatCount: 5,
    pauseBetweenRepeats: 2,
    createdAt: new Date().toLocaleString()
  }
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [config, setConfig] = useState<ExecutorConfig>(DEFAULT_CONFIG);
  const [executorStatus, setExecutorStatus] = useState<ExecutorStatus | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ExecutorStatusType>('disconnected');
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'settings' | 'instructions'>('dashboard');
  const [editingTask, setEditingTask] = useState<Task | 'new' | null>(null);
  const [recordingActive, setRecordingActive] = useState(false);
  
  // Connection testing states
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  // 1. Load data from localStorage on start
  useEffect(() => {
    const savedTasks = localStorage.getItem('clicker_linux_tasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        setTasks(SAMPLE_TASKS);
      }
    } else {
      setTasks(SAMPLE_TASKS);
      localStorage.setItem('clicker_linux_tasks', JSON.stringify(SAMPLE_TASKS));
    }

    const savedConfig = localStorage.getItem('clicker_linux_config');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        setConfig(DEFAULT_CONFIG);
      }
    }
  }, []);

  // 2. Poll Executor Status every 1000ms
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`http://127.0.5.1:${config.port}/status`, {
          method: 'GET',
          headers: {
            'X-Auth-Token': config.token,
            'Content-Type': 'application/json'
          },
          mode: 'cors'
        });

        if (response.ok) {
          const data = await response.json();
          setExecutorStatus(data);
          
          // Map connection state
          if (data.recording) {
            setConnectionStatus('connected');
          } else {
            setConnectionStatus(data.status as ExecutorStatusType);
          }
          setTestError(null);
        } else {
          setConnectionStatus('disconnected');
        }
      } catch (err) {
        // Fallback to localhost if 127.0.5.1 fails or is blocked
        try {
          const response = await fetch(`http://127.0.0.1:${config.port}/status`, {
            method: 'GET',
            headers: {
              'X-Auth-Token': config.token,
              'Content-Type': 'application/json'
            },
            mode: 'cors'
          });
          if (response.ok) {
            const data = await response.json();
            setExecutorStatus(data);
            if (data.recording) {
              setConnectionStatus('connected');
            } else {
              setConnectionStatus(data.status as ExecutorStatusType);
            }
            setTestError(null);
          } else {
            setConnectionStatus('disconnected');
          }
        } catch (innerErr) {
          setConnectionStatus('disconnected');
        }
      }
    };

    fetchStatus(); // First immediate call
    const interval = setInterval(fetchStatus, 1200);
    return () => clearInterval(interval);
  }, [config.port, config.token]);

  // Save changes to tasks in localStorage
  const saveTasksList = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    localStorage.setItem('clicker_linux_tasks', JSON.stringify(updatedTasks));
  };

  // Test Connection Manually
  const testConnection = async (): Promise<void> => {
    setIsTesting(true);
    setTestError(null);
    try {
      const response = await fetch(`http://127.0.0.1:${config.port}/status`, {
        method: 'GET',
        headers: {
          'X-Auth-Token': config.token,
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      if (response.ok) {
        const data = await response.json();
        setExecutorStatus(data);
        setConnectionStatus(data.status as ExecutorStatusType);
        setTestError(null);
      } else {
        setConnectionStatus('disconnected');
        setTestError('O servidor retornou um erro não autorizado. Verifique se o token de autenticação está correto.');
      }
    } catch (err) {
      setConnectionStatus('disconnected');
      setTestError('Não foi possível conectar ao executor local na porta ' + config.port + '. Certifique-se de iniciar o executor ./start.sh no computador.');
    } finally {
      setIsTesting(false);
    }
  };

  // 3. Executor commands
  const onRunTask = async (task: Task) => {
    try {
      const response = await fetch(`http://127.0.0.1:${config.port}/execute`, {
        method: 'POST',
        headers: {
          'X-Auth-Token': config.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ task }),
        mode: 'cors'
      });
      if (!response.ok) {
        const data = await response.json();
        alert(`Erro ao iniciar execução: ${data.error || 'Não autorizado'}`);
      }
    } catch (err) {
      alert('Erro ao se conectar com o executor local para iniciar a tarefa.');
    }
  };

  const onPauseTask = async () => {
    try {
      await fetch(`http://127.0.0.1:${config.port}/pause`, {
        method: 'POST',
        headers: {
          'X-Auth-Token': config.token,
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
    } catch (err) {
      console.error('Erro de rede ao pausar:', err);
    }
  };

  const onResumeTask = async () => {
    try {
      await fetch(`http://127.0.0.1:${config.port}/resume`, {
        method: 'POST',
        headers: {
          'X-Auth-Token': config.token,
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
    } catch (err) {
      console.error('Erro de rede ao reatar:', err);
    }
  };

  const onStopTask = async () => {
    try {
      await fetch(`http://127.0.0.1:${config.port}/stop`, {
        method: 'POST',
        headers: {
          'X-Auth-Token': config.token,
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
    } catch (err) {
      console.error('Erro de rede ao parar:', err);
    }
  };

  // 4. Recording commands
  const onStartRecord = async (): Promise<boolean> => {
    try {
      const response = await fetch(`http://127.0.0.1:${config.port}/record/start`, {
        method: 'POST',
        headers: {
          'X-Auth-Token': config.token,
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      if (response.ok) {
        const data = await response.json();
        return data.success;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const onStopRecord = async (): Promise<Action[]> => {
    try {
      const response = await fetch(`http://127.0.0.1:${config.port}/record/stop`, {
        method: 'POST',
        headers: {
          'X-Auth-Token': config.token,
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      if (response.ok) {
        const data = await response.json();
        return data.actions || [];
      }
      return [];
    } catch (err) {
      return [];
    }
  };

  const onSaveRecordedTask = (name: string, description: string, recordedActions: Action[]) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      name,
      description,
      actions: recordedActions,
      repeatMode: 'once',
      repeatCount: 1,
      pauseBetweenRepeats: 1,
      createdAt: new Date().toLocaleString()
    };
    saveTasksList([...tasks, newTask]);
  };

  // 5. Task CRUD managers
  const handleSaveTask = (savedTask: Task) => {
    const exists = tasks.some(t => t.id === savedTask.id);
    let updated: Task[];
    if (exists) {
      updated = tasks.map(t => t.id === savedTask.id ? savedTask : t);
    } else {
      updated = [...tasks, savedTask];
    }
    saveTasksList(updated);
    setEditingTask(null);
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Tem certeza de que deseja remover esta rotina de automação?')) {
      const updated = tasks.filter(t => t.id !== id);
      saveTasksList(updated);
    }
  };

  const handleDuplicateTask = (id: string) => {
    const target = tasks.find(t => t.id === id);
    if (target) {
      const duplicated: Task = {
        ...JSON.parse(JSON.stringify(target)),
        id: `task-${Date.now()}`,
        name: `${target.name} (Cópia)`,
        createdAt: new Date().toLocaleString()
      };
      saveTasksList([...tasks, duplicated]);
    }
  };

  const handleExportTask = (task: Task) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(task, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `auto-clicker-${task.name.toLowerCase().replace(/\s+/g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportTask = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && parsed.name && Array.isArray(parsed.actions)) {
            // Assign new ID to prevent conflicts
            const imported: Task = {
              ...parsed,
              id: `task-imported-${Date.now()}`,
              createdAt: new Date().toLocaleString()
            };
            saveTasksList([...tasks, imported]);
            alert('Tarefa importada com sucesso!');
          } else {
            alert('Arquivo inválido: Verifique se o arquivo JSON possui um formato válido de tarefa.');
          }
        } catch (err) {
          alert('Erro ao ler o arquivo JSON selecionado.');
        }
      };
    }
  };

  const handleSaveSettings = (newConfig: ExecutorConfig) => {
    setConfig(newConfig);
    localStorage.setItem('clicker_linux_config', JSON.stringify(newConfig));
    
    // Send updated config to local python server if connected
    if (connectionStatus !== 'disconnected') {
      fetch(`http://127.0.0.1:${newConfig.port}/config`, {
        method: 'POST',
        headers: {
          'X-Auth-Token': newConfig.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: newConfig.token,
          emergencyShortcut: newConfig.emergencyShortcut
        }),
        mode: 'cors'
      }).catch(err => console.log('Erro ao sincronizar config local:', err));
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Header Premium de Navegación */}
      <header className="border-b border-slate-900 bg-[#080d1a]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-950/40">
            <Cpu className="w-5 h-5 text-slate-100 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-100">Auto Clicker Linux</h1>
            <p className="text-[10px] text-slate-400 font-medium">Automatização Física e Controle Local de Macros</p>
          </div>
        </div>

        {/* Tab Switcher */}
        {!editingTask && !recordingActive && (
          <nav className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-slate-900/80 text-xs font-semibold text-slate-400">
            <button
              onClick={() => { setCurrentTab('dashboard'); }}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'dashboard' ? 'bg-slate-900 text-cyan-400 border border-slate-800' : 'hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Painel Principal
            </button>
            <button
              onClick={() => { setCurrentTab('settings'); }}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'settings' ? 'bg-slate-900 text-cyan-400 border border-slate-800' : 'hover:text-slate-200'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              Configurações
            </button>
            <button
              onClick={() => { setCurrentTab('instructions'); }}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'instructions' ? 'bg-slate-900 text-cyan-400 border border-slate-800' : 'hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Manual do Linux
            </button>
          </nav>
        )}

        {/* Status de Conexão Rápido */}
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${
            connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
            connectionStatus === 'running' ? 'bg-blue-500 animate-pulse' :
            connectionStatus === 'paused' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
          }`} />
          <span className="hidden sm:inline text-xs font-mono font-bold text-slate-300 capitalize">
            {connectionStatus === 'connected' && 'Executor Pronto'}
            {connectionStatus === 'running' && 'Executando...'}
            {connectionStatus === 'paused' && 'Pausado'}
            {connectionStatus === 'disconnected' && 'Agente Desconectado'}
          </span>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
        {editingTask ? (
          <TaskEditor
            task={editingTask === 'new' ? null : editingTask}
            onSave={handleSaveTask}
            onCancel={() => setEditingTask(null)}
          />
        ) : recordingActive ? (
          <TaskRecorder
            status={executorStatus}
            connectionStatus={connectionStatus}
            onStartRecord={onStartRecord}
            onStopRecord={onStopRecord}
            onSaveRecordedTask={onSaveRecordedTask}
            onClose={() => setRecordingActive(false)}
          />
        ) : (
          <div>
            {currentTab === 'dashboard' && (
              <Dashboard
                tasks={tasks}
                status={executorStatus}
                connectionStatus={connectionStatus}
                onSelectNewTask={() => setEditingTask('new')}
                onSelectRecordTask={() => setRecordingActive(true)}
                onEditTask={(t) => setEditingTask(t)}
                onDeleteTask={handleDeleteTask}
                onDuplicateTask={handleDuplicateTask}
                onExportTask={handleExportTask}
                onImportTask={handleImportTask}
                onRunTask={onRunTask}
                onPauseTask={onPauseTask}
                onResumeTask={onResumeTask}
                onStopTask={onStopTask}
                testConnection={testConnection}
                isTesting={isTesting}
              />
            )}
            {currentTab === 'settings' && (
              <Settings
                config={config}
                onSave={handleSaveSettings}
                connectionStatus={connectionStatus}
                testConnection={testConnection}
                isTesting={isTesting}
                testError={testError}
              />
            )}
            {currentTab === 'instructions' && (
              <Instructions />
            )}
          </div>
        )}
      </main>

      {/* Pie de página */}
      <footer className="border-t border-slate-900 bg-[#06080e] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Auto Clicker Linux. Código aberto sob licença Apache-2.0.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Execução local e privada garantida no ambiente do usuário.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
