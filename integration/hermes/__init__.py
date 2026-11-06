"""Hermes adapter scaffold. Intentionally registers no tools until a trusted service bridge is configured.

See INTEGRATION.md. Never connect a Hermes tool to an unauthenticated HTTP endpoint.
"""
import logging


def register(ctx):
    logging.getLogger(__name__).warning(
        "Strudel Studio Hermes adapter is a scaffold: no tools registered; see INTEGRATION.md"
    )
