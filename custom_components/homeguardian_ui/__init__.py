"""
HomeGuardian UI Integration.

Provides icon-based version control access in the Home Assistant UI.
"""
import logging
from pathlib import Path

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.components.http import StaticPathConfig

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

# Use the correct data key for extra modules
DATA_EXTRA_MODULE_URL = "frontend_extra_module_url"


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the HomeGuardian UI component from configuration.yaml."""
    # Check if we have config in configuration.yaml
    if DOMAIN in config:
        # Import the config to config entry
        hass.async_create_task(
            hass.config_entries.flow.async_init(
                DOMAIN, context={"source": "import"}, data=config[DOMAIN]
            )
        )

    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up HomeGuardian UI from a config entry."""
    _LOGGER.info("Setting up HomeGuardian UI from config entry")

    # Register the frontend module
    await hass.http.async_register_static_paths([
        StaticPathConfig(
            url_path=f"/hacsfiles/{DOMAIN}",
            path=str(Path(__file__).parent / "www" / "dist"),
            cache_headers=False
        )
    ])

    # Register as a frontend module using the correct method
    if DATA_EXTRA_MODULE_URL not in hass.data:
        hass.data[DATA_EXTRA_MODULE_URL] = set()

    url = f"/hacsfiles/{DOMAIN}/homeguardian-ui.js"
    hass.data[DATA_EXTRA_MODULE_URL].add(url)

    _LOGGER.info("HomeGuardian UI setup completed - registered %s", url)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    _LOGGER.info("Unloading HomeGuardian UI")
    return True
