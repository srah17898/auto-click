export type ActionType = 'click' | 'wait' | 'type' | 'key' | 'move';

export interface Action {
  id: string;
  type: ActionType;
  params: {
    x?: number;
    y?: number;
    button?: 'left' | 'right' | 'middle';
    clicks?: number;
    interval?: number; // interval between clicks or keypresses
    duration?: number; // move duration
    seconds?: number;  // wait time in seconds
    text?: string;     // text to type
    key?: string;      // key combination to press
  };
}

export interface Task {
  id: string;
  name: string;
  description: string;
  actions: Action[];
  repeatMode: 'once' | 'count' | 'infinite';
  repeatCount: number;
  pauseBetweenRepeats: number; // in seconds
  createdAt: string;
  lastExecutedAt?: string;
}

export interface ExecutorConfig {
  port: number;
  token: string;
  defaultDelay: number; // default delay between actions in seconds
  typeSpeed: number;     // delay between keystrokes in seconds
  emergencyShortcut: string; // e.g. "esc" or "ctrl+shift+q"
}

export type ExecutorStatusType = 'connected' | 'disconnected' | 'running' | 'paused';

export interface ExecutorStatus {
  status: ExecutorStatusType;
  version?: string;
  platform?: string;
  activeTask?: string;
  currentActionIndex?: number;
  currentRepeat?: number;
  totalRepeats?: number;
  actionsExecuted?: number;
  elapsedTime?: number; // in seconds
  logs: LogEntry[];
  recording?: boolean;
  recordedActionsCount?: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}
