import { AnalysisReport, Module, DependencyGraph } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  hooks: string[];
}

export interface PluginContext {
  report: AnalysisReport;
  graph: DependencyGraph;
  projectPath: string;
  config: any;
}

export interface Plugin {
  metadata: PluginMetadata;
  
  // Lifecycle hooks
  onInit?(): void | Promise<void>;
  onBeforeAnalysis?(context: PluginContext): void | Promise<void>;
  onAfterAnalysis?(context: PluginContext): void | Promise<void>;
  onModuleParsed?(module: Module, context: PluginContext): void | Promise<void>;
  onReportGenerated?(context: PluginContext): void | Promise<void>;
  
  // Custom analyzers
  analyze?(context: PluginContext): any | Promise<any>;
  
  // Custom rules
  defineRules?(): CustomRule[];
}

export interface CustomRule {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  check: (module: Module, context: PluginContext) => boolean | Promise<boolean>;
  message: string;
  fix?: (module: Module, context: PluginContext) => string | Promise<string>;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private pluginDir: string;

  constructor(pluginDir: string = './plugins') {
    this.pluginDir = pluginDir;
  }

  /**
   * Load all plugins from the plugin directory
   */
  async loadPlugins(): Promise<void> {
    if (!fs.existsSync(this.pluginDir)) {
      fs.mkdirSync(this.pluginDir, { recursive: true });
      this.createExamplePlugin();
      return;
    }

    const files = fs.readdirSync(this.pluginDir);
    
    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.ts')) {
        try {
          const pluginPath = path.join(this.pluginDir, file);
          const plugin = require(pluginPath);
          
          if (this.validatePlugin(plugin)) {
            this.registerPlugin(plugin);
          }
        } catch (error) {
          console.error(`Failed to load plugin ${file}:`, error);
        }
      }
    }
  }

  /**
   * Register a plugin
   */
  registerPlugin(plugin: Plugin): void {
    if (!plugin.metadata || !plugin.metadata.name) {
      throw new Error('Plugin must have metadata with a name');
    }

    this.plugins.set(plugin.metadata.name, plugin);
    console.log(`✓ Loaded plugin: ${plugin.metadata.name} v${plugin.metadata.version}`);
  }

  /**
   * Unregister a plugin
   */
  unregisterPlugin(name: string): void {
    this.plugins.delete(name);
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get a specific plugin
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Execute a hook on all plugins
   */
  async executeHook(hookName: keyof Plugin, context: PluginContext): Promise<void> {
    for (const plugin of this.plugins.values()) {
      const hook = plugin[hookName];
      if (typeof hook === 'function') {
        try {
          // Handle different hook signatures
          if (hookName === 'onModuleParsed') {
            // onModuleParsed requires module parameter, skip for now
            continue;
          } else if (hookName === 'onInit') {
            await (hook as () => void | Promise<void>).call(plugin);
          } else if (hookName === 'defineRules') {
            // defineRules doesn't need context
            continue;
          } else {
            await (hook as (context: PluginContext) => void | Promise<void>).call(plugin, context);
          }
        } catch (error) {
          console.error(`Error in plugin ${plugin.metadata.name} hook ${hookName}:`, error);
        }
      }
    }
  }

  /**
   * Collect custom rules from all plugins
   */
  collectCustomRules(): CustomRule[] {
    const rules: CustomRule[] = [];
    
    for (const plugin of this.plugins.values()) {
      if (plugin.defineRules) {
        try {
          const pluginRules = plugin.defineRules();
          rules.push(...pluginRules);
        } catch (error) {
          console.error(`Error collecting rules from ${plugin.metadata.name}:`, error);
        }
      }
    }
    
    return rules;
  }

  /**
   * Run custom analyzers from all plugins
   */
  async runCustomAnalyzers(context: PluginContext): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    
    for (const plugin of this.plugins.values()) {
      if (plugin.analyze) {
        try {
          const result = await plugin.analyze(context);
          results.set(plugin.metadata.name, result);
        } catch (error) {
          console.error(`Error running analyzer from ${plugin.metadata.name}:`, error);
        }
      }
    }
    
    return results;
  }

  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: any): boolean {
    if (!plugin.metadata) {
      console.warn('Plugin missing metadata');
      return false;
    }

    if (!plugin.metadata.name || !plugin.metadata.version) {
      console.warn('Plugin metadata missing name or version');
      return false;
    }

    return true;
  }

  /**
   * Create an example plugin for reference
   */
  private createExamplePlugin(): void {
    const examplePlugin = `// Example Auto-Architect Plugin
// Place this file in the plugins/ directory

module.exports = {
  metadata: {
    name: 'example-plugin',
    version: '1.0.0',
    description: 'Example plugin demonstrating the plugin API',
    author: 'Your Name',
    hooks: ['onAfterAnalysis', 'defineRules']
  },

  // Called when plugin is loaded
  onInit() {
    console.log('Example plugin initialized');
  },

  // Called after analysis is complete
  onAfterAnalysis(context) {
    console.log(\`Analysis complete for \${context.projectPath}\`);
    console.log(\`Total modules: \${context.report.metrics.totalModules}\`);
  },

  // Define custom rules
  defineRules() {
    return [
      {
        id: 'no-console-log',
        name: 'No console.log',
        description: 'Detect console.log statements',
        severity: 'low',
        check: (module, context) => {
          // Read module file and check for console.log
          const fs = require('fs');
          const path = require('path');
          const filePath = path.join(context.projectPath, module.path);
          
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            return content.includes('console.log');
          }
          return false;
        },
        message: 'Found console.log statement. Consider using a proper logger.'
      }
    ];
  },

  // Custom analyzer
  analyze(context) {
    return {
      customMetric: context.report.metrics.totalModules * 2,
      timestamp: new Date().toISOString()
    };
  }
};
`;

    const examplePath = path.join(this.pluginDir, 'example-plugin.js');
    fs.writeFileSync(examplePath, examplePlugin);
    console.log(`Created example plugin at ${examplePath}`);
  }
}
