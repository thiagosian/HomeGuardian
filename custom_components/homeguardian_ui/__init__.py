"""
HomeGuardian UI Integration.

Provides icon-based version control access in the Home Assistant UI.
"""
import logging
from pathlib import Path

from homeassistant.core import HomeAssistant
from homeassistant.components.frontend import add_extra_js_url

_LOGGER = logging.getLogger(__name__)

DOMAIN = "homeguardian_ui"


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the HomeGuardian UI component."""
    _LOGGER.info("Setting up HomeGuardian UI")

    # Register the frontend module
    await hass.http.async_register_static_paths(
        [
            {
                "url_path": f"/hacsfiles/{DOMAIN}",
                "path": str(Path(__file__).parent / "www" / "dist"),
            }
        ]
    )

    # Add the JavaScript module
    add_extra_js_url(hass, f"/hacsfiles/{DOMAIN}/homeguardian-ui.js")

    _LOGGER.info("HomeGuardian UI setup completed")
    return True
