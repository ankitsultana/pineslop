import fs from 'fs';
import path from 'path';

export type DatasourceType = 'cluster' | 'federated';

export interface DatasourceConfig {
  type: DatasourceType;
  url: string;
  headers: Record<string, string>;
  icon: string;
}

export interface DatasourcesConfig {
  datasources: Record<string, DatasourceConfig>;
}

export interface DatasourceInfo {
  id: string;
  type: DatasourceType;
  icon: string;
}

let cachedConfig: DatasourcesConfig | null = null;

/**
 * Reads the datasources configuration from config/datasources.json
 * Caches the result for subsequent calls
 */
export function getDatasourcesConfig(): DatasourcesConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configPath = path.join(process.cwd(), 'config', 'datasources.json');
  const configContent = fs.readFileSync(configPath, 'utf-8');
  cachedConfig = JSON.parse(configContent) as DatasourcesConfig;
  
  return cachedConfig;
}

/**
 * Returns an array of datasource IDs
 */
export function getDatasourceIds(): string[] {
  const config = getDatasourcesConfig();
  return Object.keys(config.datasources);
}

/**
 * Returns basic info (id, type, icon) for all datasources
 * Suitable for sending to client components
 */
export function getDatasourcesInfo(): DatasourceInfo[] {
  const config = getDatasourcesConfig();
  return Object.entries(config.datasources).map(([id, ds]) => ({
    id,
    type: ds.type,
    icon: ds.icon,
  }));
}

/**
 * Returns the configuration for a specific datasource
 */
export function getDatasourceConfig(datasourceId: string): DatasourceConfig | null {
  const config = getDatasourcesConfig();
  return config.datasources[datasourceId] || null;
}

/**
 * Returns the datasource config with environment variables resolved in headers
 */
export function getResolvedDatasourceConfig(datasourceId: string): DatasourceConfig | null {
  const datasourceConfig = getDatasourceConfig(datasourceId);
  if (!datasourceConfig) {
    return null;
  }

  const resolvedHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(datasourceConfig.headers)) {
    // Replace ${ENV_VAR} patterns with actual environment variable values
    resolvedHeaders[key] = value.replace(/\$\{(\w+)\}/g, (_, envVar) => {
      return process.env[envVar] || '';
    });
  }

  return {
    ...datasourceConfig,
    headers: resolvedHeaders,
  };
}

