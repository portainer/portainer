export type NetworkId = string;

export interface DockerNetwork {
  Name: string;
  Id: string;
  Driver: string;
  Scope: string;
  Attachable: boolean;
  Internal: boolean;
}

export type NetworkKey =
  | 'Name'
  | 'Id'
  | 'Scope'
  | 'Driver'
  | 'Attachable'
  | 'Internal';

type NetworkValue = string;

export type NetworkRowContent = [NetworkKey, NetworkValue][];
