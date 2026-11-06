"""Poptart native Hermes plugin."""
def register(ctx):
    from .bridge import register as register_tools
    register_tools(ctx)
