import { OS, Platform } from '@/edge/components/EdgeScriptForm/types';

export interface ScriptFormValues {
  nomadToken: string;
  authEnabled: boolean;

  allowSelfSignedCertificates: boolean;
  envVars: string;

  os: OS;
  platform: Platform;
}
