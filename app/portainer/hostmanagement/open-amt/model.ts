export interface OpenAMTConfiguration {
  enabled: boolean;
  mpsServer: string;
  mpsUser: string;
  mpsPassword: string;
  domainName: string;
  certFileName: string;
  certFileContent: string;
  certFilePassword: string;
}

export interface AMTInformation {
  uuid: string;
  amt: string;
  buildNumber: string;
  controlMode: string;
  dnsSuffix: string;
  rawOutput: string;
}

export interface AuthorizationResponse {
  server: string;
  token: string;
}

export interface DeviceFeatures {
  ider: boolean;
  kvm: boolean;
  sol: boolean;
  redirection: boolean;
  userConsent: string;
}

export type Device = {
  guid: string;
  hostname: string;
  powerState: number;
  connectionStatus: boolean;
  features?: DeviceFeatures;
};
