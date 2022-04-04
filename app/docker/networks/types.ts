import { ResourceControlViewModel } from '@/portainer/access-control/models/ResourceControlViewModel';

import { ContainerId } from '../containers/types';

export type IPConfig = {
  Subnet: string;
  Gateway: string;
  IPRange?: string;
  AuxiliaryAddresses?: object;
};

export type NetworkId = string;

export type NetworkOptions = Record<string, string>;

export type NetworkContainer = {
  Id?: ContainerId;
  EndpointID: string;
  IPv4Address: string;
  IPv6Address: string;
  MacAddress: string;
  Name: string;
};

export type NetworkContainers = Record<ContainerId, NetworkContainer>;

export interface DockerNetwork {
  Name: string;
  Id: NetworkId;
  Driver: string;
  Scope: string;
  Attachable: boolean;
  Internal: boolean;
  IPAM?: {
    Config: IPConfig[];
    Driver?: string;
    Options?: string | null;
  };
  Portainer: { ResourceControl?: ResourceControlViewModel };
  Options?: NetworkOptions;
  Containers?: NetworkContainers;
}
