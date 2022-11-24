export type Platform = 'standalone' | 'swarm' | 'k8s' | 'nomad';
export type OS = 'win' | 'linux';

export interface ScriptFormValues {
  nomadToken: string;
  authEnabled: boolean;
  tlsEnabled: boolean;

  allowSelfSignedCertificates: boolean;
  envVars: string;

  os: OS;
  platform: Platform;

  edgeIdGenerator?: string;
}

export interface EdgeInfo {
  id?: string;
  key: string;
}
