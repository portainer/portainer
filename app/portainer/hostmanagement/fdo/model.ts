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

export interface Profile {
  name: string;
  url: string;
  created: string;
}

export interface Profiles {
  profiles: Profile[];
}
