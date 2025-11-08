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
    this.parseBlueprints = process.env.PARSE_BLUEPRINTS !== 'false'; // Default to true
    this.parseVoiceAssistant = process.env.PARSE_VOICE_ASSISTANT !== 'false'; // Default to true
  }

  /**
   * Parse automations from automations.yaml or included files
   * @param {boolean} includeRaw - Include raw YAML object (default: true for backward compatibility)
   */
  async parseAutomations(includeRaw = true) {
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
              ...(includeRaw && { raw: automation })
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
                      ...(includeRaw && { raw: automation })
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
                    ...(includeRaw && { raw: automations })
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
   * @param {boolean} includeRaw - Include raw YAML object (default: true for backward compatibility)
   */
  async parseScripts(includeRaw = true) {
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
              ...(includeRaw && { raw: script })
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
   * Parse blueprints (automation and script blueprints)
   * @param {boolean} includeRaw - Include raw YAML object (default: true)
   */
  async parseBlueprints(includeRaw = true) {
    try {
      const items = [];
      const blueprintsDir = path.join(this.configPath, 'blueprints');

      // Parse automation blueprints
      const automationBlueprintsDir = path.join(blueprintsDir, 'automation');
      if (await this.fileExists(automationBlueprintsDir)) {
        const autoBlueprints = await this.parseBlueprintDirectory(
          automationBlueprintsDir,
          'automation',
          includeRaw
        );
        items.push(...autoBlueprints);
      }

      // Parse script blueprints
      const scriptBlueprintsDir = path.join(blueprintsDir, 'script');
      if (await this.fileExists(scriptBlueprintsDir)) {
        const scriptBlueprints = await this.parseBlueprintDirectory(
          scriptBlueprintsDir,
          'script',
          includeRaw
        );
        items.push(...scriptBlueprints);
      }

      logger.info(`Parsed ${items.length} blueprint(s)`);
      return items;
    } catch (error) {
      logger.error('Failed to parse blueprints:', error);
      return [];
    }
  }

  /**
   * Parse blueprint directory recursively
   * @param {string} dirPath - Directory path to parse
   * @param {string} domain - Blueprint domain (automation or script)
   * @param {boolean} includeRaw - Include raw YAML data
   * @param {number} depth - Current recursion depth (default: 0)
   */
  async parseBlueprintDirectory(dirPath, domain, includeRaw, depth = 0) {
    const MAX_DEPTH = 5; // Prevent excessive recursion
    const items = [];

    // Security: Prevent stack overflow from malicious directory structures
    if (depth > MAX_DEPTH) {
      logger.warn(`Blueprint directory depth exceeded at: ${dirPath}`);
      return items;
    }

    // Security: Ensure path is still within blueprints directory (prevent traversal)
    const blueprintsDir = path.join(this.configPath, 'blueprints');
    const normalizedPath = path.resolve(dirPath);
    const normalizedBlueprintsDir = path.resolve(blueprintsDir);

    if (!normalizedPath.startsWith(normalizedBlueprintsDir)) {
      logger.warn(`Path traversal attempt detected: ${dirPath}`);
      return items;
    }

    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });

      for (const file of files) {
        // Security: Skip hidden files and symlinks
        if (file.name.startsWith('.') || file.isSymbolicLink()) {
          logger.debug(`Skipping hidden/symlink file: ${file.name}`);
          continue;
        }

        const filePath = path.join(dirPath, file.name);

        if (file.isDirectory()) {
          // Recursively parse subdirectories with incremented depth
          const subItems = await this.parseBlueprintDirectory(
            filePath,
            domain,
            includeRaw,
            depth + 1
          );
          items.push(...subItems);
        } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
          try {
            const content = await fs.readFile(filePath, 'utf8');
            const blueprint = yaml.load(content);

            if (blueprint && blueprint.blueprint) {
              const relativePath = path.relative(this.configPath, filePath);
              const blueprintId = this.generateBlueprintId(relativePath);

              items.push({
                id: blueprintId,
                type: 'blueprint',
                name: blueprint.blueprint.name || file.name.replace(/\.ya?ml$/, ''),
                description: blueprint.blueprint.description || '',
                domain: blueprint.blueprint.domain || domain,
                file: relativePath,
                ...(includeRaw && { raw: blueprint })
              });
            }
          } catch (error) {
            logger.warn(`Failed to parse blueprint ${filePath}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      logger.warn(`Failed to read blueprint directory ${dirPath}: ${error.message}`);
    }

    return items;
  }

  /**
   * Generate blueprint ID from file path
   */
  generateBlueprintId(relativePath) {
    return relativePath
      .replace(/^blueprints\//, '')
      .replace(/\.ya?ml$/, '')
      .replace(/\//g, '_');
  }

  /**
   * Parse voice assistants (Assist pipelines)
   * @param {boolean} includeRaw - Include raw JSON object (default: true)
   */
  async parseVoiceAssistants(includeRaw = true) {
    try {
      const items = [];
      const pipelineFile = path.join(this.configPath, '.storage/assist_pipeline');

      if (await this.fileExists(pipelineFile)) {
        const content = await fs.readFile(pipelineFile, 'utf8');
        const data = JSON.parse(content);

        if (data.data && data.data.pipelines) {
          data.data.pipelines.forEach((pipeline, index) => {
            items.push({
              id: pipeline.id || `pipeline_${index}`,
              type: 'voice_assistant',
              name: pipeline.name || `Pipeline ${index + 1}`,
              description: `${pipeline.conversation_engine} | ${pipeline.stt_engine} → ${pipeline.tts_engine}`,
              language: pipeline.language || 'en',
              file: '.storage/assist_pipeline',
              index: index,
              ...(includeRaw && { raw: pipeline })
            });
          });
        }

        logger.info(`Parsed ${items.length} voice assistant pipeline(s)`);
      }

      return items;
    } catch (error) {
      logger.error('Failed to parse voice assistants:', error);
      return [];
    }
  }

  /**
   * Parse conversation intents from configuration.yaml
   * @param {boolean} includeRaw - Include raw YAML object (default: true)
   */
  async parseConversationIntents(includeRaw = true) {
    try {
      const items = [];
      const configFile = path.join(this.configPath, 'configuration.yaml');

      if (await this.fileExists(configFile)) {
        const content = await fs.readFile(configFile, 'utf8');
        const config = yaml.load(content);

        if (config && config.conversation && config.conversation.intents) {
          Object.entries(config.conversation.intents).forEach(([intentName, intentData], index) => {
            items.push({
              id: intentName,
              type: 'conversation_intent',
              name: intentName,
              description: Array.isArray(intentData) ? `${intentData.length} response(s)` : 'Intent',
              file: 'configuration.yaml',
              index: index,
              ...(includeRaw && { raw: intentData })
            });
          });

          logger.info(`Parsed ${items.length} conversation intent(s)`);
        }
      }

      return items;
    } catch (error) {
      logger.error('Failed to parse conversation intents:', error);
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
   * Parse blueprint configurations from blueprints directory
   */
  async parseBlueprints() {
    try {
      const items = [];
      const blueprintsDir = path.join(this.configPath, 'blueprints');

      // Check if blueprints directory exists
      const exists = await this.fileExists(blueprintsDir);

      if (!exists) {
        logger.debug('Blueprints directory not found');
        return items;
      }

      // Parse automation blueprints
      const automationBlueprintsDir = path.join(blueprintsDir, 'automation');
      if (await this.fileExists(automationBlueprintsDir)) {
        const automationBlueprints = await this.parseBlueprintsFromDir(
          automationBlueprintsDir,
          'automation'
        );
        items.push(...automationBlueprints);
      }

      // Parse script blueprints
      const scriptBlueprintsDir = path.join(blueprintsDir, 'script');
      if (await this.fileExists(scriptBlueprintsDir)) {
        const scriptBlueprints = await this.parseBlueprintsFromDir(
          scriptBlueprintsDir,
          'script'
        );
        items.push(...scriptBlueprints);
      }

      logger.info(`Parsed ${items.length} blueprint(s)`);
      return items;
    } catch (error) {
      logger.error('Failed to parse blueprints:', error);
      return [];
    }
  }

  /**
   * Helper method to parse blueprints from a specific directory
   */
  async parseBlueprintsFromDir(dirPath, blueprintType) {
    const items = [];

    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of files) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Recursively parse subdirectories
          const subItems = await this.parseBlueprintsFromDir(fullPath, blueprintType);
          items.push(...subItems);
        } else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
          try {
            const content = await fs.readFile(fullPath, 'utf8');
            const config = yaml.load(content);

            if (config && config.blueprint) {
              const relativePath = path.relative(this.configPath, fullPath);
              const blueprint = config.blueprint;

              items.push({
                id: relativePath.replace(/\.ya?ml$/, '').replace(/\//g, '_'),
                type: 'blueprint',
                blueprintType: blueprintType,
                name: blueprint.name || entry.name.replace(/\.ya?ml$/, ''),
                description: blueprint.description || '',
                domain: blueprint.domain || blueprintType,
                author: blueprint.author || 'Unknown',
                source_url: blueprint.source_url || '',
                file: relativePath,
                inputs: Object.keys(blueprint.input || {}),
                raw: config
              });
            }
          } catch (error) {
            logger.warn(`Failed to parse blueprint ${entry.name}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      logger.warn(`Failed to read blueprint directory ${dirPath}: ${error.message}`);
    }

    return items;
  }

  /**
   * Parse voice assistant configurations
   */
  async parseVoiceAssistants() {
    try {
      const items = [];
      const storageDir = path.join(this.configPath, '.storage');

      // Check if .storage directory exists
      const exists = await this.fileExists(storageDir);

      if (!exists) {
        logger.debug('.storage directory not found');
        return items;
      }

      // Parse assist pipeline configurations
      const assistFile = path.join(storageDir, 'assist_pipeline');
      if (await this.fileExists(assistFile)) {
        try {
          const content = await fs.readFile(assistFile, 'utf8');
          const data = JSON.parse(content);

          if (data && data.data && data.data.items) {
            data.data.items.forEach((pipeline, index) => {
              items.push({
                id: pipeline.id || `pipeline_${index}`,
                type: 'voice_assistant',
                subtype: 'assist_pipeline',
                name: pipeline.name || 'Unnamed Pipeline',
                description: `Language: ${pipeline.language || 'unknown'}`,
                language: pipeline.language || 'unknown',
                conversation_engine: pipeline.conversation_engine || 'none',
                conversation_language: pipeline.conversation_language || pipeline.language,
                stt_engine: pipeline.stt_engine || 'none',
                stt_language: pipeline.stt_language || pipeline.language,
                tts_engine: pipeline.tts_engine || 'none',
                tts_language: pipeline.tts_language || pipeline.language,
                tts_voice: pipeline.tts_voice || 'none',
                wake_word_entity: pipeline.wake_word_entity || null,
                wake_word_id: pipeline.wake_word_id || null,
                file: '.storage/assist_pipeline',
                raw: pipeline
              });
            });
          }
        } catch (error) {
          logger.warn(`Failed to parse assist pipeline: ${error.message}`);
        }
      }

      // Parse conversation agents
      const conversationFile = path.join(storageDir, 'conversation');
      if (await this.fileExists(conversationFile)) {
        try {
          const content = await fs.readFile(conversationFile, 'utf8');
          const data = JSON.parse(content);

          if (data && data.data) {
            items.push({
              id: 'conversation_agent',
              type: 'voice_assistant',
              subtype: 'conversation_agent',
              name: 'Conversation Agent',
              description: `Agent: ${data.data.agent_id || 'default'}`,
              agent_id: data.data.agent_id || 'conversation.home_assistant',
              file: '.storage/conversation',
              raw: data
            });
          }
        } catch (error) {
          logger.warn(`Failed to parse conversation agent: ${error.message}`);
        }
      }

      // Parse intent scripts (if exists in YAML)
      const intentScriptFile = path.join(this.configPath, 'intent_script.yaml');
      if (await this.fileExists(intentScriptFile)) {
        try {
          const content = await fs.readFile(intentScriptFile, 'utf8');
          const config = yaml.load(content);

          if (config && typeof config === 'object') {
            Object.entries(config).forEach(([intentName, intentConfig]) => {
              items.push({
                id: `intent_${intentName}`,
                type: 'voice_assistant',
                subtype: 'intent_script',
                name: intentName,
                description: intentConfig.speech?.text || 'Custom intent handler',
                file: 'intent_script.yaml',
                raw: intentConfig
              });
            });
          }
        } catch (error) {
          logger.warn(`Failed to parse intent scripts: ${error.message}`);
        }
      }

      logger.info(`Parsed ${items.length} voice assistant configuration(s)`);
      return items;
    } catch (error) {
      logger.error('Failed to parse voice assistant configurations:', error);
      return [];
    }
  }

  /**
   * Parse all HA items
   * @param {Object} options - Parsing options
   * @param {boolean} options.includeRaw - Include raw YAML objects (default: false to save memory)
   * @param {boolean} options.sequential - Parse sequentially to reduce memory spikes (default: true)
   * @param {Array<string>} options.types - Only parse specific types (default: all)
   */
  async parseAllItems(options = {}) {
    try {
      const {
        includeRaw = false,  // Default to false to save memory
        sequential = true,   // Default to true to reduce memory spikes
        types = null
      } = options;

      const parsers = {
        automations: () => this.parseAutomations(includeRaw),
        scripts: () => this.parseScripts(includeRaw),
        scenes: () => this.parseScenes(includeRaw),
        blueprints: () => this.parseBlueprints(includeRaw),
        voice_assistants: () => this.parseVoiceAssistants(includeRaw),
        conversation_intents: () => this.parseConversationIntents(includeRaw)
      };

      // Add optional parsers if enabled
      if (this.parseESPHome) {
        parsers.esphome = () => this.parseESPHome(includeRaw);
      }
      if (this.parsePackages) {
        parsers.packages = () => this.parsePackages(includeRaw);
      }
      if (this.backupLovelace) {
        parsers.lovelace = () => this.parseLovelaceDashboards(includeRaw);
      }
      if (this.parseBlueprints) {
        parsers.blueprints = () => this.parseBlueprints(includeRaw);
      }
      if (this.parseVoiceAssistant) {
        parsers.voice_assistants = () => this.parseVoiceAssistants(includeRaw);
      }

      // If specific types requested, filter parsers
      if (types && Array.isArray(types)) {
        const filteredParsers = {};
        types.forEach(type => {
          if (parsers[type]) {
            filteredParsers[type] = parsers[type];
          }
        });
        Object.keys(parsers).forEach(key => {
          if (!filteredParsers[key]) {
            delete parsers[key];
          }
        });
      }

      let results;
      if (sequential) {
        // Parse sequentially to reduce memory spike
        results = {};
        for (const [key, parser] of Object.entries(parsers)) {
          results[key] = await parser();
        }
      } else {
        // Parse in parallel (original behavior)
        const promises = Object.values(parsers).map(p => p());
        const resultArray = await Promise.all(promises);
        results = {};
        Object.keys(parsers).forEach((key, index) => {
          results[key] = resultArray[index];
        });
      }

      // Calculate total
      let total = 0;
      Object.values(results).forEach(arr => {
        total += arr ? arr.length : 0;
      });

      // Ensure all expected keys exist
      const response = {
        automations: results.automations || [],
        scripts: results.scripts || [],
        scenes: results.scenes || [],
        blueprints: results.blueprints || [],
        voice_assistants: results.voice_assistants || [],
        conversation_intents: results.conversation_intents || [],
        esphome: results.esphome || [],
        packages: results.packages || [],
        lovelace: results.lovelace || [],
        blueprints: results.blueprints || [],
        voice_assistants: results.voice_assistants || [],
        total
      };

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
        case 'blueprint':
          items = await this.parseBlueprints();
          break;
        case 'voice_assistant':
          items = await this.parseVoiceAssistants();
          break;
        case 'conversation_intent':
          items = await this.parseConversationIntents();
          break;
        case 'esphome':
          items = await this.parseESPHome();
          break;
        case 'package':
          items = await this.parsePackages();
          break;
        case 'lovelace_dashboard':
        case 'dashboard':
          items = await this.parseLovelaceDashboards();
          break;
        case 'blueprint':
          items = await this.parseBlueprints();
          break;
        case 'voice_assistant':
          items = await this.parseVoiceAssistants();
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
   * Get all items of a specific type
   */
  async getItemsByType(type, includeRaw = false) {
    try {
      switch (type) {
        case 'automation':
          return await this.parseAutomations(includeRaw);
        case 'script':
          return await this.parseScripts(includeRaw);
        case 'scene':
          return await this.parseScenes(includeRaw);
        case 'blueprint':
          return await this.parseBlueprints(includeRaw);
        case 'voice_assistant':
          return await this.parseVoiceAssistants(includeRaw);
        case 'conversation_intent':
          return await this.parseConversationIntents(includeRaw);
        case 'esphome':
          return await this.parseESPHome(includeRaw);
        case 'package':
          return await this.parsePackages(includeRaw);
        case 'lovelace_dashboard':
        case 'dashboard':
          return await this.parseLovelaceDashboards(includeRaw);
        default:
          throw new Error(`Unknown item type: ${type}`);
      }
    } catch (error) {
      logger.error(`Failed to get items of type ${type}:`, error);
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
