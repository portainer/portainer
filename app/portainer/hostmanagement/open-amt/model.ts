export interface AMTConfiguration {
  enableOpenAMT: boolean;
  mpsServer: string;
  mpsUser: string;
  mpsPassword: string;
  certFileText: string;
  certPassword: string;
  domainName: string;
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
  IDER: boolean;
  KVM: boolean;
  SOL: boolean;
  redirection: boolean;
  userConsent: string;
}

export interface Device {
  guid: string;
  hostname: string;
  powerState: number;
  connectionStatus: boolean;
  features: DeviceFeatures;
}
