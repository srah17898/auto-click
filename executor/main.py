#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Auto Clicker Linux - Local Executor Daemon
Establece un servidor HTTP local seguro con el panel web de Auto Clicker.
Utiliza 'pynput' para controlar y grabar eventos de mouse y teclado.
"""

import sys
import os
import json
import time
import threading
import traceback
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Intentar importar pynput para control y monitoreo
try:
    from pynput import mouse, keyboard
    from pynput.keyboard import Key, KeyCode
    PYNPUT_AVAILABLE = True
except ImportError:
    PYNPUT_AVAILABLE = False

# Configuración por defecto
DEFAULT_PORT = 18080
DEFAULT_TOKEN = "clicker-token-seguro-123"

class ExecutorState:
    def __init__(self):
        self.status = "disconnected" if not PYNPUT_AVAILABLE else "connected"
        self.active_task_name = ""
        self.active_task_id = ""
        self.current_action_index = -1
        self.current_repeat = 0
        self.total_repeats = 0
        self.actions_executed = 0
        self.elapsed_time = 0
        self.logs = []
        self.recording = False
        self.recorded_actions = []
        self.recording_start_time = 0
        self.last_recording_event_time = 0
        
        # Hilos y control de ejecución
        self.exec_thread = None
        self.stop_event = threading.Event()
        self.pause_event = threading.Event() # Limpia cuando está pausado, se activa para correr
        self.pause_event.set() # Inicialmente no pausado
        
        # Listeners para grabación
        self.mouse_listener = None
        self.keyboard_listener = None
        
        # Listener de parada de emergencia
        self.emergency_listener = None
        self.emergency_key = "esc"
        self.auth_token = DEFAULT_TOKEN
        
        # Controladores de pynput
        if PYNPUT_AVAILABLE:
            self.mouse_controller = mouse.Controller()
            self.keyboard_controller = keyboard.Controller()
            self.add_log("info", "Controladores de teclado y mouse inicializados con éxito.")
        else:
            self.add_log("error", "Error: 'pynput' no está instalado. Ejecute 'pip install pynput' para habilitar la automatización.")

    def add_log(self, level, message):
        timestamp = time.strftime("%H:%M:%S")
        self.logs.append({
            "timestamp": timestamp,
            "level": level,
            "message": message
        })
        # Mantener últimos 100 logs
        if len(self.logs) > 100:
            self.logs.pop(0)
        print(f"[{level.upper()}] {timestamp} - {message}")

    def reset_stats(self):
        self.current_action_index = -1
        self.current_repeat = 0
        self.actions_executed = 0
        self.elapsed_time = 0

state = ExecutorState()

# Mapeo de teclas comunes para pynput
KEY_MAP = {
    "enter": Key.enter,
    "tab": Key.tab,
    "esc": Key.esc,
    "backspace": Key.backspace,
    "space": Key.space,
    "shift": Key.shift,
    "ctrl": Key.ctrl,
    "alt": Key.alt,
    "f1": Key.f1,
    "f2": Key.f2,
    "f3": Key.f3,
    "f4": Key.f4,
    "f5": Key.f5,
    "f6": Key.f6,
    "f7": Key.f7,
    "f8": Key.f8,
    "f9": Key.f9,
    "f10": Key.f10,
    "f11": Key.f11,
    "f12": Key.f12,
}

def parse_key_combination(key_str):
    """Parsea atajos como 'ctrl+c' o teclas simples como 'enter'"""
    parts = key_str.lower().split('+')
    keys_to_press = []
    
    for p in parts:
        p = p.strip()
        if p in KEY_MAP:
            keys_to_press.append(KEY_MAP[p])
        elif len(p) == 1:
            keys_to_press.append(p)
        else:
            # Tecla desconocida, intentar crear KeyCode
            try:
                keys_to_press.append(KeyCode.from_char(p))
            except Exception:
                pass
    return keys_to_press

def execute_task_thread(task, state):
    state.status = "running"
    state.active_task_name = task.get("name", "Tarea sin nombre")
    state.active_task_id = task.get("id", "")
    state.reset_stats()
    
    actions = task.get("actions", [])
    repeat_mode = task.get("repeatMode", "once")
    repeat_count = int(task.get("repeatCount", 1))
    pause_between = float(task.get("pauseBetweenRepeats", 0))
    
    state.add_log("info", f"Iniciando ejecución de '{state.active_task_name}'. Acciones: {len(actions)}, Repeticiones: {repeat_mode}")
    
    start_time = time.time()
    
    try:
        repeat_idx = 0
        while not state.stop_event.is_set():
            # Actualizar stats de repetición
            state.current_repeat = repeat_idx + 1
            if repeat_mode == "once":
                state.total_repeats = 1
                max_repeats = 1
            elif repeat_mode == "count":
                state.total_repeats = repeat_count
                max_repeats = repeat_count
            else:
                state.total_repeats = -1 # Infinito
                max_repeats = 999999 # Protección lógica
                
            if repeat_mode == "count" and repeat_idx >= repeat_count:
                break
                
            state.add_log("info", f"Iniciando repetición {repeat_idx + 1}")
            
            for action_idx, action in enumerate(actions):
                if state.stop_event.is_set():
                    break
                    
                # Verificar pausa (si el evento está limpio, bloquea aquí hasta que se asigne)
                if not state.pause_event.is_set():
                    state.status = "paused"
                    state.add_log("warn", "Automatización pausada. Esperando reanudación...")
                    state.pause_event.wait()
                    state.status = "running"
                    state.add_log("info", "Automatización reanudada.")
                
                state.current_action_index = action_idx
                action_type = action.get("type")
                params = action.get("params", {})
                
                state.add_log("info", f"Ejecutando acción {action_idx + 1}: {action_type}")
                
                # Ejecutar acción correspondiente
                if action_type == "click":
                    execute_click(params)
                elif action_type == "move":
                    execute_move(params)
                elif action_type == "wait":
                    execute_wait(params, state)
                elif action_type == "type":
                    execute_type(params)
                elif action_type == "key":
                    execute_key(params)
                    
                state.actions_executed += 1
                state.elapsed_time = int(time.time() - start_time)
                
                # Un pequeño retardo por seguridad entre acciones
                time.sleep(0.05)
                
            repeat_idx += 1
            if repeat_mode == "infinite" and repeat_idx >= 5000:
                state.add_log("warn", "Protección de límite infinito alcanzada (5000 repeticiones). Parando por seguridad.")
                break
                
            # Intervalo entre repeticiones
            if not state.stop_event.is_set() and (repeat_mode == "infinite" or repeat_idx < max_repeats):
                if pause_between > 0:
                    state.add_log("info", f"Esperando {pause_between}s antes de la siguiente repetición...")
                    # Esperar con chequeo rápido de parada
                    steps = int(pause_between * 10)
                    for _ in range(steps):
                        if state.stop_event.is_set():
                            break
                        time.sleep(0.1)
        
        if state.stop_event.is_set():
            state.add_log("warn", "Tarea cancelada por el usuario o parada de emergencia.")
            state.status = "connected"
        else:
            state.add_log("success", f"¡Tarea '{state.active_task_name}' completada con éxito!")
            state.status = "connected"
            
    except Exception as e:
        state.add_log("error", f"Error durante la ejecución: {str(e)}")
        state.add_log("error", traceback.format_exc())
        state.status = "connected"
    finally:
        state.active_task_name = ""
        state.active_task_id = ""
        state.current_action_index = -1

# Implementación de simulaciones de teclado y mouse
def execute_click(params):
    if not PYNPUT_AVAILABLE:
        return
    x = int(params.get("x", 0))
    y = int(params.get("y", 0))
    button_str = params.get("button", "left")
    clicks = int(params.get("clicks", 1))
    interval = float(params.get("interval", 0.1))
    duration = float(params.get("duration", 0))
    
    # Mapear botón
    if button_str == "right":
        btn = mouse.Button.right
    elif button_str == "middle":
        btn = mouse.Button.middle
    else:
        btn = mouse.Button.left
        
    # Mover mouse primero
    if duration > 0:
        # Movimiento suave
        start_x, start_y = state.mouse_controller.position
        steps = int(duration * 60) # 60 fps
        if steps > 0:
            for s in range(steps):
                t = s / steps
                curr_x = int(start_x + (x - start_x) * t)
                curr_y = int(start_y + (y - start_y) * t)
                state.mouse_controller.position = (curr_x, curr_y)
                time.sleep(duration / steps)
    
    state.mouse_controller.position = (x, y)
    time.sleep(0.05)
    
    # Realizar clicks
    for i in range(clicks):
        state.mouse_controller.click(btn, 1)
        if i < clicks - 1:
            time.sleep(interval)

def execute_move(params):
    if not PYNPUT_AVAILABLE:
        return
    x = int(params.get("x", 0))
    y = int(params.get("y", 0))
    duration = float(params.get("duration", 0))
    
    if duration > 0:
        start_x, start_y = state.mouse_controller.position
        steps = int(duration * 60)
        if steps > 0:
            for s in range(steps):
                t = s / steps
                curr_x = int(start_x + (x - start_x) * t)
                curr_y = int(start_y + (y - start_y) * t)
                state.mouse_controller.position = (curr_x, curr_y)
                time.sleep(duration / steps)
    state.mouse_controller.position = (x, y)

def execute_wait(params, state):
    seconds = float(params.get("seconds", 1.0))
    steps = int(seconds * 10)
    for _ in range(steps):
        if state.stop_event.is_set():
            break
        time.sleep(0.1)

def execute_type(params):
    if not PYNPUT_AVAILABLE:
        return
    text = params.get("text", "")
    interval = float(params.get("interval", 0.05))
    
    if interval > 0:
        for char in text:
            state.keyboard_controller.type(char)
            time.sleep(interval)
    else:
        state.keyboard_controller.type(text)

def execute_key(params):
    if not PYNPUT_AVAILABLE:
        return
    key_str = params.get("key", "")
    if not key_str:
        return
        
    keys = parse_key_combination(key_str)
    
    # Presionar teclas en orden
    for k in keys:
        state.keyboard_controller.press(k)
        time.sleep(0.02)
        
    # Soltar teclas en orden inverso
    for k in reversed(keys):
        state.keyboard_controller.release(k)
        time.sleep(0.02)


# SISTEMA DE GRABACIÓN
def on_record_click(x, y, button, pressed):
    if not state.recording:
        return False # Detiene el listener
        
    if pressed:
        now = time.time()
        delay = round(now - state.last_recording_event_time, 2) if state.last_recording_event_time > 0 else 0.5
        state.last_recording_event_time = now
        
        # Mapear botón a string
        btn_str = "left"
        if button == mouse.Button.right:
            btn_str = "right"
        elif button == mouse.Button.middle:
            btn_str = "middle"
            
        # Si hay un delay significativo, añadir acción de esperar primero
        if delay > 0.15:
            state.recorded_actions.append({
                "id": f"rec-wait-{int(now*1000)}",
                "type": "wait",
                "params": {"seconds": delay}
            })
            
        state.recorded_actions.append({
            "id": f"rec-click-{int(now*1000)}",
            "type": "click",
            "params": {
                "x": x,
                "y": y,
                "button": btn_str,
                "clicks": 1,
                "interval": 0.1,
                "duration": 0
            }
        })
        state.add_log("info", f"[Grabado] Click {btn_str} en X={x}, Y={y} (Espera: {delay}s)")

def on_record_press(key):
    if not state.recording:
        return False
        
    now = time.time()
    delay = round(now - state.last_recording_event_time, 2) if state.last_recording_event_time > 0 else 0.5
    state.last_recording_event_time = now
    
    # Ignorar la tecla de parada de emergencia durante la grabación para que no se autograbre
    if key == Key.esc and state.emergency_key == "esc":
        return
        
    # Mapear tecla
    key_name = ""
    is_special = False
    
    if hasattr(key, 'name') and key.name is not None:
        key_name = key.name
        is_special = True
    elif hasattr(key, 'char') and key.char is not None:
        key_name = key.char
        
    if not key_name:
        return
        
    # Añadir espera primero
    if delay > 0.15:
        state.recorded_actions.append({
            "id": f"rec-wait-{int(now*1000)}",
            "type": "wait",
            "params": {"seconds": delay}
        })
        
    if is_special:
        # Pressionar tecla especial
        state.recorded_actions.append({
            "id": f"rec-key-{int(now*1000)}",
            "type": "key",
            "params": {"key": key_name}
        })
        state.add_log("info", f"[Grabado] Tecla especial: {key_name} (Espera: {delay}s)")
    else:
        # Si es texto común, podemos añadirlo como digitar
        # Pero para simplicidad de grabación tecla por tecla, o intentar agrupar:
        # Vamos a guardar como tecla individual por ahora, o agrupar si es rápido
        state.recorded_actions.append({
            "id": f"rec-type-{int(now*1000)}",
            "type": "type",
            "params": {"text": key_name, "interval": 0}
        })
        state.add_log("info", f"[Grabado] Escribir: {key_name} (Espera: {delay}s)")

def start_recording():
    if not PYNPUT_AVAILABLE:
        state.add_log("error", "No se puede grabar: pynput no está instalado.")
        return False
        
    if state.recording:
        return True
        
    state.recording = True
    state.recorded_actions = []
    state.recording_start_time = time.time()
    state.last_recording_event_time = time.time()
    state.status = "connected"
    
    state.add_log("info", "Iniciando grabación de eventos de mouse y teclado...")
    
    state.mouse_listener = mouse.Listener(on_click=on_record_click)
    state.keyboard_listener = keyboard.Listener(on_press=on_record_press)
    
    state.mouse_listener.start()
    state.keyboard_listener.start()
    return True

def stop_recording():
    if not state.recording:
        return []
        
    state.recording = False
    
    if state.mouse_listener:
        state.mouse_listener.stop()
    if state.keyboard_listener:
        state.keyboard_listener.stop()
        
    duration = round(time.time() - state.recording_start_time, 1)
    state.add_log("success", f"Grabación finalizada. Acciones capturadas: {len(state.recorded_actions)}. Duración: {duration}s")
    
    return state.recorded_actions


# LISTENER DE PARADA DE EMERGENCIA
def on_emergency_press(key):
    # Parada si se presiona ESC
    if key == Key.esc and state.emergency_key == "esc":
        if state.status == "running" or state.status == "paused":
            state.add_log("error", "¡PARADA DE EMERGENCIA! Tecla ESC presionada.")
            state.stop_event.set()
            state.pause_event.set() # Desbloquear si estaba pausado

def start_emergency_listener():
    if not PYNPUT_AVAILABLE:
        return
    state.emergency_listener = keyboard.Listener(on_press=on_emergency_press)
    state.emergency_listener.daemon = True
    state.emergency_listener.start()
    state.add_log("info", "Mecanismo de parada de emergencia activado (Tecla ESC).")


# SERVIDOR HTTP LOCAL (CON AUTENTICACIÓN Y CORS)
class ClickerHTTPHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Sobrescribir para evitar logs ruidosos en consola, manejados por state.add_log
        pass
        
    def end_headers(self):
        # SOPORTE CORS COMPLETO PARA EL PANEL WEB
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Auth-Token, Content-Type')
        super().end_headers()
        
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
        
    def authenticate(self):
        # Obtener token de cabeceras o query params
        token_header = self.headers.get('X-Auth-Token')
        if token_header == state.auth_token:
            return True
            
        # Intentar con query params
        parsed_path = urlparse(self.path)
        queries = parse_qs(parsed_path.query)
        if 'token' in queries and queries['token'][0] == state.auth_token:
            return True
            
        # Si no hay token configurado, permitir desarrollo local simple,
        # pero es mejor exigir autenticación por seguridad
        self.send_response(401)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            "error": "No autorizado",
            "message": "Token de autenticación inválido o ausente. Configúrelo en los ajustes del panel."
        }).encode('utf-8'))
        return False

    def do_GET(self):
        parsed_path = urlparse(parsed_path_str := self.path)
        path = parsed_path.path
        
        if path == "/" or path == "/status":
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            # Devolver estado completo
            response = {
                "status": state.status,
                "version": "1.0.0",
                "platform": sys.platform,
                "activeTask": state.active_task_name,
                "activeTaskId": state.active_task_id,
                "currentActionIndex": state.current_action_index,
                "currentRepeat": state.current_repeat,
                "totalRepeats": state.total_repeats,
                "actionsExecuted": state.actions_executed,
                "elapsedTime": state.elapsed_time,
                "recording": state.recording,
                "recordedActionsCount": len(state.recorded_actions),
                "logs": state.logs,
                "pynputAvailable": PYNPUT_AVAILABLE
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return
            
        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if not self.authenticate():
            return
            
        # Leer body
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length) if content_length > 0 else b'{}'
        
        try:
            body = json.loads(post_data.decode('utf-8'))
        except Exception:
            body = {}
            
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        response = {"success": True}
        
        if path == "/execute":
            task = body.get("task")
            if not task:
                response = {"success": False, "error": "Falta la tarea en la petición"}
            elif state.status == "running" or state.status == "paused":
                response = {"success": False, "error": "Ya hay una tarea en ejecución. Deténgala primero."}
            elif not PYNPUT_AVAILABLE:
                response = {"success": False, "error": "Librería de automatización 'pynput' ausente."}
            else:
                state.stop_event.clear()
                state.pause_event.set() # Asegurar no pausado
                state.exec_thread = threading.Thread(target=execute_task_thread, args=(task, state))
                state.exec_thread.daemon = True
                state.exec_thread.start()
                state.add_log("info", "Hilo de ejecución iniciado.")
                
        elif path == "/pause":
            if state.status == "running":
                state.pause_event.clear() # Limpia el flag para pausar el hilo
                state.status = "paused"
                state.add_log("info", "Petición de pausa recibida.")
            else:
                response = {"success": False, "error": "La automatización no está en ejecución."}
                
        elif path == "/resume":
            if state.status == "paused":
                state.pause_event.set() # Establece el flag para reanudar el hilo
                state.status = "running"
                state.add_log("info", "Petición de reanudación recibida.")
            else:
                response = {"success": False, "error": "La automatización no está pausada."}
                
        elif path == "/stop":
            if state.status == "running" or state.status == "paused":
                state.add_log("info", "Petición de parada recibida. Deteniendo...")
                state.stop_event.set()
                state.pause_event.set() # Despertar si estaba pausado
            else:
                response = {"success": False, "error": "No hay ninguna tarea activa para detener."}
                
        elif path == "/record/start":
            success = start_recording()
            response = {"success": success, "error": None if success else "No se pudo iniciar la grabación."}
            
        elif path == "/record/stop":
            recorded = stop_recording()
            response = {"success": True, "actions": recorded}
            
        elif path == "/config":
            # Cambiar token de seguridad o atajo
            new_token = body.get("token")
            new_shortcut = body.get("emergencyShortcut")
            if new_token:
                state.auth_token = new_token
                state.add_log("info", "Token de autenticación actualizado con éxito.")
            if new_shortcut:
                state.emergency_key = new_shortcut.lower()
                state.add_log("info", f"Tecla de emergencia cambiada a: {state.emergency_key}")
                
        self.wfile.write(json.dumps(response).encode('utf-8'))

def run_server(port):
    server_address = ('', port)
    httpd = HTTPServer(server_address, ClickerHTTPHandler)
    print(f"--- AUTO CLICKER LINUX EXECUTOR RUNNING ---")
    print(f"Puerto local: {port}")
    print(f"Token de Autenticación: {state.auth_token}")
    print(f"Parada de emergencia: Tecla ESC")
    print(f"-------------------------------------------")
    state.add_log("info", f"Servidor local iniciado en el puerto {port}")
    
    # Iniciar listener de emergencia
    start_emergency_listener()
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        state.add_log("info", "Cerrando servidor local...")
        if state.emergency_listener:
            state.emergency_listener.stop()
        stop_recording()
        httpd.server_close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Auto Clicker Linux Local Executor")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help=f"Puerto de escucha (defecto: {DEFAULT_PORT})")
    parser.add_argument("--token", type=str, default=DEFAULT_TOKEN, help="Token de seguridad de autenticación")
    args = parser.parse_args()
    
    state.auth_token = args.token
    run_server(args.port)
