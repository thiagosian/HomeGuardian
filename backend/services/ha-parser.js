const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const logger = require('../utils/logger');

class HAParser {
  constructor() {
    this.configPath = process.env.CONFIG_PATH || '/config';
    this.parseESPHome = process.env.PARSE_ESPHOME === 'true';
    this.parsePackages = process.env.PARSE_PACKAGES === 'true';
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
   * Parse all HA items
   */
  async parseAllItems() {
    try {
      const [automations, scripts, scenes] = await Promise.all([
        this.parseAutomations(),
        this.parseScripts(),
        this.parseScenes()
      ]);

      return {
        automations,
        scripts,
        scenes,
        total: automations.length + scripts.length + scenes.length
      };
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
