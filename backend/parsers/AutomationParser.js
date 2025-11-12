const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const ParserStrategy = require('./ParserStrategy');
const logger = require('../utils/logger');

/**
 * Automation Parser Strategy
 * Parses Home Assistant automations from automations.yaml
 */
class AutomationParser extends ParserStrategy {
  /**
   * Parse all automations
   * @param {Object} options - Parsing options
   * @param {boolean} options.includeRaw - Include raw YAML object
   * @returns {Promise<Array>} Array of automation objects
   */
  async parse(options = {}) {
    const { includeRaw = true } = options;
    const items = [];

    try {
      // Try automations.yaml first
      const automationsFile = path.join(this.configPath, 'automations.yaml');
      const exists = await this.fileExists(automationsFile);

      if (exists) {
        const content = await fs.readFile(automationsFile, 'utf8');
        const automations = yaml.load(content);

        if (Array.isArray(automations)) {
          automations.forEach((automation, index) => {
            items.push(this.transformAutomation(automation, index, 'automations.yaml', includeRaw));
          });
        }
      }

      // TODO: Check for !include_dir_list or !include_dir_merge_list
      // (Implementation would follow similar pattern to original HAParser)

      logger.debug(`Parsed ${items.length} automations`);
      return items;
    } catch (error) {
      logger.error('Failed to parse automations:', error);
      throw error;
    }
  }

  /**
   * Get automation by ID
   * @param {string} id - Automation ID
   * @returns {Promise<Object|null>} Automation or null
   */
  async getById(id) {
    const items = await this.parse({ includeRaw: true });
    return items.find(item => item.id === id) || null;
  }

  /**
   * Get parser type
   * @returns {string} Type name
   */
  getType() {
    return 'automation';
  }

  /**
   * Transform raw automation to standard format
   * @param {Object} automation - Raw automation object
   * @param {number} index - Index in file
   * @param {string} file - File name
   * @param {boolean} includeRaw - Include raw object
   * @returns {Object} Transformed automation
   * @private
   */
  transformAutomation(automation, index, file, includeRaw) {
    return {
      id: automation.id || `automation_${index}`,
      type: 'automation',
      alias: automation.alias || 'Unnamed Automation',
      description: automation.description || '',
      file: file,
      index: index,
      enabled: automation.mode !== 'disabled',
      ...(includeRaw && { raw: automation })
    };
  }

  /**
   * Check if file exists
   * @param {string} filePath - File path
   * @returns {Promise<boolean>} True if exists
   * @private
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = AutomationParser;
