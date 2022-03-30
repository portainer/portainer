export type NetworkId = string;

export type IPConfig = {
  Subnet: string;
  Gateway: string;
  IPRange?: string;
  AuxiliaryAddresses?: object;
};

export interface DockerNetwork {
  Name: string;
  Id: NetworkId;
  Driver: string;
  Scope: string;
  Attachable: boolean;
  Internal: boolean;
  IPAM?: {
    Config: IPConfig[];
  };
}
