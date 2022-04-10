export type Platform = 'standalone' | 'swarm' | 'k8s';
export type OS = 'win' | 'linux';

export interface EdgeProperties {
  os: OS;
  allowSelfSignedCertificates: boolean;
  envVars: string;
  edgeIdGenerator: string;
  platform: Platform;
}
