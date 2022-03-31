import { ResourceControlViewModel } from '@/portainer/access-control/models/ResourceControlViewModel';
import { EnvironmentId } from '@/portainer/environments/types';

import { ContainerId } from '../containers/types';

export type IPConfig = {
  Subnet: string;
  Gateway: string;
  IPRange?: string;
  AuxiliaryAddresses?: object;
};

export type NetworkId = string;

export type NetworkOptions = Record<string, string>;

type NetworkContainer = {
  EndpointID: EnvironmentId;
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
  };
  Portainer: { ResourceControl?: ResourceControlViewModel };
  Options?: NetworkOptions;
  Containers?: NetworkContainers;
}
