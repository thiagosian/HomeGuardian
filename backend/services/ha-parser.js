const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const logger = require('../utils/logger');

class HAParser {
  constructor() {
    this.configPath = process.env.CONFIG_PATH || '/config';
    this.parseESPHome = process.env.PARSE_ESPHOME === 'true';
    this.parsePackages = process.env.PARSE_PACKAGES === 'true';
    this.backupLovelace = process.env.BACKUP_LOVELACE !== 'false'; // Default to true
  }

  /**
   * Parse automations from automations.yaml or included files
   */
  async parseAutomations() {
    try {
      const items = [];

      // Try automations.yaml first
      const automationsFile = path.join(this.configPath, 'automations.yaml');
      const exists = await this.fileExists(automationsFile);

      if (exists) {
        const content = await fs.readFile(automationsFile, 'utf8');
        const automations = yaml.load(content);

        if (Array.isArray(automations)) {
          automations.forEach((automation, index) => {
            items.push({
              id: automation.id || `automation_${index}`,
              type: 'automation',
              alias: automation.alias || 'Unnamed Automation',
              description: automation.description || '',
              file: 'automations.yaml',
              index: index,
              enabled: automation.mode !== 'disabled',
              raw: automation
            });
          });
        }
      }

      // Check for !include_dir_list or !include_dir_merge_list
      const configFile = path.join(this.configPath, 'configuration.yaml');
      if (await this.fileExists(configFile)) {
        const configContent = await fs.readFile(configFile, 'utf8');

        // Basic parsing to find automation includes
        const automationMatch = configContent.match(/automation:\s*!include_dir_(?:list|merge_list)\s+(.+)/);

        if (automationMatch) {
          const automationDir = path.join(this.configPath, automationMatch[1].trim());

          try {
            const files = await fs.readdir(automationDir);

            for (const file of files) {
              if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                const filePath = path.join(automationDir, file);
                const content = await fs.readFile(filePath, 'utf8');
                const automations = yaml.load(content);

                if (Array.isArray(automations)) {
                  automations.forEach((automation, index) => {
                    items.push({
                      id: automation.id || `${file}_${index}`,
                      type: 'automation',
                      alias: automation.alias || 'Unnamed Automation',
                      description: automation.description || '',
                      file: path.join(automationMatch[1].trim(), file),
                      index: index,
                      enabled: automation.mode !== 'disabled',
                      raw: automation
                    });
                  });
                } else if (automations) {
                  // Single automation in file
                  items.push({
                    id: automations.id || file.replace(/\.ya?ml$/, ''),
                    type: 'automation',
                    alias: automations.alias || 'Unnamed Automation',
                    description: automations.description || '',
                    file: path.join(automationMatch[1].trim(), file),
                    index: 0,
                    enabled: automations.mode !== 'disabled',
                    raw: automations
                  });
                }
              }
            }
          } catch (error) {
            logger.warn(`Failed to read automation directory: ${error.message}`);
          }
        }
      }

      return items;
    } catch (error) {
      logger.error('Failed to parse automations:', error);
      return [];
    }
  }

  /**
   * Parse scripts from scripts.yaml or included files
   */
  async parseScripts() {
    try {
      const items = [];

      // Try scripts.yaml first
      const scriptsFile = path.join(this.configPath, 'scripts.yaml');
      const exists = await this.fileExists(scriptsFile);

      if (exists) {
        const content = await fs.readFile(scriptsFile, 'utf8');
        const scripts = yaml.load(content);

        if (scripts && typeof scripts === 'object') {
          Object.entries(scripts).forEach(([key, script]) => {
            items.push({
              id: key,
              type: 'script',
              alias: script.alias || key,
              description: script.description || '',
              file: 'scripts.yaml',
              raw: script
            });
          });
        }
      }

      return items;
    } catch (error) {
      logger.error('Failed to parse scripts:', error);
      return [];
    }
  }

  /**
   * Parse scenes from scenes.yaml
   */
  async parseScenes() {
    try {
      const items = [];

      const scenesFile = path.join(this.configPath, 'scenes.yaml');
      const exists = await this.fileExists(scenesFile);

      if (exists) {
        const content = await fs.readFile(scenesFile, 'utf8');
        const scenes = yaml.load(content);

        if (Array.isArray(scenes)) {
          scenes.forEach((scene, index) => {
            items.push({
              id: scene.id || `scene_${index}`,
              type: 'scene',
              name: scene.name || 'Unnamed Scene',
              file: 'scenes.yaml',
              index: index,
              raw: scene
            });
          });
        }
      }

      return items;
    } catch (error) {
      logger.error('Failed to parse scenes:', error);
      return [];
    }
  }

  /**
   * Parse ESPHome device configurations
   */
  async parseESPHome() {
    try {
      const items = [];
      const esphomeDir = path.join(this.configPath, 'esphome');

      // Check if ESPHome directory exists
      const exists = await this.fileExists(esphomeDir);

      if (!exists) {
        logger.debug('ESPHome directory not found');
        return items;
      }

      const files = await fs.readdir(esphomeDir);

      for (const file of files) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          const filePath = path.join(esphomeDir, file);

          try {
            const content = await fs.readFile(filePath, 'utf8');
            const config = yaml.load(content);

            if (config && config.esphome) {
              items.push({
                id: config.esphome.name || file.replace(/\.ya?ml$/, ''),
                type: 'esphome',
                name: config.esphome.name || file.replace(/\.ya?ml$/, ''),
                description: config.esphome.comment || '',
                platform: config.esphome.platform || config.esp32?.board || config.esp8266?.board || 'unknown',
                board: config.esphome.board || config.esp32?.board || config.esp8266?.board || 'unknown',
                file: path.join('esphome', file),
                raw: config
              });
            }
          } catch (error) {
            logger.warn(`Failed to parse ESPHome config ${file}: ${error.message}`);
          }
        }
      }

      logger.info(`Parsed ${items.length} ESPHome device(s)`);
      return items;
    } catch (error) {
      logger.error('Failed to parse ESPHome configurations:', error);
      return [];
    }
  }

  /**
   * Parse packages directory
   */
  async parsePackages() {
    try {
      const items = [];
      const packagesDir = path.join(this.configPath, 'packages');

      // Check if packages directory exists
      const exists = await this.fileExists(packagesDir);

      if (!exists) {
        logger.debug('Packages directory not found');
        return items;
      }

      const files = await fs.readdir(packagesDir);

      for (const file of files) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          const filePath = path.join(packagesDir, file);

          try {
            const content = await fs.readFile(filePath, 'utf8');
            const config = yaml.load(content);

            if (config) {
              // Extract package components
              const components = Object.keys(config).filter(key =>
                !key.startsWith('_') && typeof config[key] === 'object'
              );

              items.push({
                id: file.replace(/\.ya?ml$/, ''),
                type: 'package',
                name: file.replace(/\.ya?ml$/, '').replace(/_/g, ' '),
                description: config.description || `Package with ${components.length} component(s)`,
                components: components,
                file: path.join('packages', file),
                raw: config
              });
            }
          } catch (error) {
            logger.warn(`Failed to parse package ${file}: ${error.message}`);
          }
        }
      }

      logger.info(`Parsed ${items.length} package(s)`);
      return items;
    } catch (error) {
      logger.error('Failed to parse packages:', error);
      return [];
    }
  }

  /**
   * Parse Lovelace dashboards from .storage
   */
  async parseLovelaceDashboards() {
    try {
      const items = [];
      const storageDir = path.join(this.configPath, '.storage');

      // Check if .storage directory exists
      const exists = await this.fileExists(storageDir);

      if (!exists) {
        logger.debug('.storage directory not found');
        return items;
      }

      const files = await fs.readdir(storageDir);

      for (const file of files) {
        if (file.startsWith('lovelace')) {
          const filePath = path.join(storageDir, file);

          try {
            const content = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(content);

            if (data && data.data) {
              const dashboardName = file === 'lovelace'
                ? 'Main Dashboard'
                : file.replace('lovelace.', '').replace(/_/g, ' ');

              const viewCount = data.data.config?.views?.length || 0;

              items.push({
                id: file,
                type: 'lovelace_dashboard',
                name: data.data.config?.title || dashboardName,
                description: `${viewCount} view(s)`,
                file: path.join('.storage', file),
                views: viewCount,
                raw: data
              });
            }
          } catch (error) {
            logger.warn(`Failed to parse Lovelace dashboard ${file}: ${error.message}`);
          }
        }
      }

      logger.info(`Parsed ${items.length} Lovelace dashboard(s)`);
      return items;
    } catch (error) {
      logger.error('Failed to parse Lovelace dashboards:', error);
      return [];
    }
  }

  /**
   * Parse all HA items
   */
  async parseAllItems() {
    try {
      const promises = [
        this.parseAutomations(),
        this.parseScripts(),
        this.parseScenes()
      ];

      // Add ESPHome parsing if enabled
      if (this.parseESPHome) {
        promises.push(this.parseESPHome());
      }

      // Add packages parsing if enabled
      if (this.parsePackages) {
        promises.push(this.parsePackages());
      }

      // Add Lovelace parsing if enabled
      if (this.backupLovelace) {
        promises.push(this.parseLovelaceDashboards());
      }

      const results = await Promise.all(promises);

      const response = {
        automations: results[0],
        scripts: results[1],
        scenes: results[2]
      };

      let total = results[0].length + results[1].length + results[2].length;
      let resultIndex = 3;

      // Add ESPHome to response if enabled
      if (this.parseESPHome) {
        response.esphome = results[resultIndex];
        total += results[resultIndex].length;
        resultIndex++;
      } else {
        response.esphome = [];
      }

      // Add packages to response if enabled
      if (this.parsePackages) {
        response.packages = results[resultIndex];
        total += results[resultIndex].length;
        resultIndex++;
      } else {
        response.packages = [];
      }

      // Add Lovelace to response if enabled
      if (this.backupLovelace) {
        response.lovelace = results[resultIndex];
        total += results[resultIndex].length;
      } else {
        response.lovelace = [];
      }

      response.total = total;

      return response;
    } catch (error) {
      logger.error('Failed to parse all items:', error);
      throw error;
    }
  }

  /**
   * Get a specific item by type and ID
   */
  async getItem(type, id) {
    try {
      let items = [];

      switch (type) {
        case 'automation':
          items = await this.parseAutomations();
          break;
        case 'script':
          items = await this.parseScripts();
          break;
        case 'scene':
          items = await this.parseScenes();
          break;
        case 'esphome':
          items = await this.parseESPHome();
          break;
        case 'package':
          items = await this.parsePackages();
          break;
        case 'lovelace_dashboard':
          items = await this.parseLovelaceDashboards();
          break;
        default:
          throw new Error(`Unknown item type: ${type}`);
      }

      return items.find(item => item.id === id);
    } catch (error) {
      logger.error(`Failed to get item ${type}:${id}:`, error);
      throw error;
    }
  }

  /**
   * Restore a specific item by replacing it in the file
   */
  async restoreItem(type, id, content) {
    try {
      const item = await this.getItem(type, id);

      if (!item) {
        throw new Error(`Item not found: ${type}:${id}`);
      }

      const filePath = path.join(this.configPath, item.file);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const data = yaml.load(fileContent);

      // For automations and scenes (arrays)
      if (Array.isArray(data)) {
        if (item.index !== undefined) {
          data[item.index] = yaml.load(content);
        } else {
          throw new Error('Item index not found');
        }
      }
      // For scripts (objects)
      else if (typeof data === 'object') {
        data[id] = yaml.load(content);
      }

      // Write back to file
      const newContent = yaml.dump(data, {
        indent: 2,
        lineWidth: -1,
        noRefs: true
      });

      await fs.writeFile(filePath, newContent, 'utf8');

      logger.info(`Item restored: ${type}:${id} in ${item.file}`);

      return true;
    } catch (error) {
      logger.error(`Failed to restore item ${type}:${id}:`, error);
      throw error;
    }
  }

  /**
   * Helper to check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get changed items from a list of changed files
   */
  async getChangedItems(changedFiles) {
    try {
      const allItems = await this.parseAllItems();
      const changedItems = [];

      for (const file of changedFiles) {
        // Check automations
        const matchingAutomations = allItems.automations.filter(
          a => a.file === file || a.file === file.replace(/^\//, '')
        );
        changedItems.push(...matchingAutomations);

        // Check scripts
        const matchingScripts = allItems.scripts.filter(
          s => s.file === file || s.file === file.replace(/^\//, '')
        );
        changedItems.push(...matchingScripts);

        // Check scenes
        const matchingScenes = allItems.scenes.filter(
          s => s.file === file || s.file === file.replace(/^\//, '')
        );
        changedItems.push(...matchingScenes);
      }

      return changedItems;
    } catch (error) {
      logger.error('Failed to get changed items:', error);
      return [];
    }
  }
}

module.exports = HAParser;
