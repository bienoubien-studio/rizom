import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

/**
 * Vite plugin that serves the browser config as a virtual module
 * This way file imports works without package.json export error
 * Caveats : Vite will not optimize imported modules, so if an error
 * occured, the module should be added to vite config optimizeDeps.include
 */
export function browserConfig(): Plugin {
  const virtualModuleId = 'virtual:browser-config';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  return {
    name: 'rizom:browser-config',
    
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    
    load(id) {
      if (id === resolvedVirtualModuleId) {
        try {
          // Path to the generated browser config
          const configPath = path.resolve(process.cwd(), '.rizom/config.browser.txt');
          
          if (fs.existsSync(configPath)) {
            // Read and return the content of the browser config
            return fs.readFileSync(configPath, 'utf-8');
          } else {
            console.warn('Browser config file not found at:', configPath);
            return 'export default {}';
          }
        } catch (error) {
          console.error('Error loading browser config:', error);
          return 'export default {}';
        }
      }
    }
  };
}
