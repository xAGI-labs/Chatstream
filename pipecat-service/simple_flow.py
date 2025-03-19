class Flow:
    @classmethod
    def from_config(cls, config):
        """Create a flow from configuration"""
        return cls(config)
        
    def __init__(self, config):
        self.config = config
        
    def run(self, inputs):
        """Simple mock implementation"""
        # Just echo back for testing
        return {
            "audio_output": inputs.get("audio_input", ""),
            "text_output": f"Processed input from {inputs.get('audio_input', 'unknown')}"
        }
