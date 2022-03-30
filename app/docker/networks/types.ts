export type NetworkId = string;

export type IPConfig = {
  Subnet: string;
  Gateway: string;
  IPRange?: string;
  AuxiliaryAddresses?: string[];
};

export interface DockerNetwork {
  Name: string;
  Id: string;
  Driver: string;
  Scope: string;
  Attachable: boolean;
  Internal: boolean;
  IPAM?: {
    Config: IPConfig[];
  };
}
