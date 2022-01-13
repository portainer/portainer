export interface FDOConfiguration {
  enabled: boolean;
  ownerURL: string;
  ownerUsername: string;
  ownerPassword: string;
  profilesURL: string;
}

export interface DeviceConfiguration {
  edgeKey: string;
  name: string;
  profile: string;
}

export type Profile = {
  id: number;
  name: string;
  url: string;
  created: string;
}

export interface Profiles {
  profiles: Profile[];
}
