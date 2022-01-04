export interface OpenAMTConfiguration {
  Enabled: boolean,
  MPSServer: string,
  MPSUser: string,
  MPSPassword: string,
  DomainName: string
  CertFileName: string,
  CertFileContent: string,
  CertFilePassword: string,
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
