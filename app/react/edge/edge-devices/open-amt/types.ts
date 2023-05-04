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

export enum PowerStateCode {
  On = 2,
  SleepLight = 3,
  SleepDeep = 4,
  OffHard = 6,
  Hibernate = 7,
  OffSoft = 8,
  PowerCycle = 9,
  OffHardGraceful = 13,
}

export type Device = {
  guid: string;
  hostname: string;
  powerState: PowerStateCode;
  connectionStatus: boolean;
  features?: DeviceFeatures;
};
