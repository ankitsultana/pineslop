import fs from 'fs';
import path from 'path';

export interface ClusterConfig {
  url: string;
  headers: Record<string, string>;
}

export interface ClustersConfig {
  clusters: Record<string, ClusterConfig>;
}

let cachedConfig: ClustersConfig | null = null;

/**
 * Reads the clusters configuration from config/clusters.json
 * Caches the result for subsequent calls
 */
export function getClustersConfig(): ClustersConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configPath = path.join(process.cwd(), 'config', 'clusters.json');
  const configContent = fs.readFileSync(configPath, 'utf-8');
  cachedConfig = JSON.parse(configContent) as ClustersConfig;
  
  return cachedConfig;
}

/**
 * Returns an array of cluster IDs
 */
export function getClusterIds(): string[] {
  const config = getClustersConfig();
  return Object.keys(config.clusters);
}

/**
 * Returns the configuration for a specific cluster
 */
export function getClusterConfig(clusterId: string): ClusterConfig | null {
  const config = getClustersConfig();
  return config.clusters[clusterId] || null;
}

/**
 * Returns the cluster config with environment variables resolved in headers
 */
export function getResolvedClusterConfig(clusterId: string): ClusterConfig | null {
  const clusterConfig = getClusterConfig(clusterId);
  if (!clusterConfig) {
    return null;
  }

  const resolvedHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(clusterConfig.headers)) {
    // Replace ${ENV_VAR} patterns with actual environment variable values
    resolvedHeaders[key] = value.replace(/\$\{(\w+)\}/g, (_, envVar) => {
      return process.env[envVar] || '';
    });
  }

  return {
    ...clusterConfig,
    headers: resolvedHeaders,
  };
}

