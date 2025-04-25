import importlib
import backend.config as config_module

class ConfigManager:
    _config_module = config_module

    @classmethod
    def reload(cls):
        importlib.reload(cls._config_module)

    @classmethod
    def get_llm_models(cls):
        return cls._config_module.LLM_MODELS

    @classmethod
    def get_agent_presets(cls):
        return cls._config_module.AGENT_PRESETS

    @classmethod
    def get_llm_prompts(cls):
        return cls._config_module.LLM_PROMPTS

    @classmethod
    def get_global_settings(cls):
        return cls._config_module.GLOBAL_SETTINGS 