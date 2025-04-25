from dotenv import load_dotenv
load_dotenv(dotenv_path='.env.local')
from backend.models import Agent, Event
import threading
import os
from backend.config_manager import ConfigManager

# 动态加载 agent 预设
agents = [Agent(**a) for a in ConfigManager.get_agent_presets()]
events = []
simulation_status = "idle"
simulation_thread = None
stop_event = threading.Event()

DASHSCOPE_API_KEY = os.getenv('DASHSCOPE_API_KEY', '') 