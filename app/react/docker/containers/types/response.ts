import { PortainerMetadata } from '@/react/docker/types';

interface EndpointIPAMConfig {
  IPv4Address?: string;
  IPv6Address?: string;
  LinkLocalIPs?: string[];
}

interface EndpointSettings {
  IPAMConfig?: EndpointIPAMConfig;
  Links: string[];
  Aliases: string[];
  NetworkID: string;
  EndpointID: string;
  Gateway: string;
  IPAddress: string;
  IPPrefixLen: number;
  IPv6Gateway: string;
  GlobalIPv6Address: string;
  GlobalIPv6PrefixLen: number;
  MacAddress: string;
  DriverOpts: { [key: string]: string };
}

export interface SummaryNetworkSettings {
  Networks: { [key: string]: EndpointSettings | undefined };
}

interface PortResponse {
  IP?: string;
  PrivatePort: number;
  PublicPort?: number;
  Type: string;
}

enum MountPropagation {
  // PropagationRPrivate RPRIVATE
  RPrivate = 'rprivate',
  // PropagationPrivate PRIVATE
  Private = 'private',
  // PropagationRShared RSHARED
  RShared = 'rshared',
  // PropagationShared SHARED
  Shared = 'shared',
  // PropagationRSlave RSLAVE
  RSlave = 'rslave',
  // PropagationSlave SLAVE
  Slave = 'slave',
}

enum MountType {
  // TypeBind is the type for mounting host dir
  Bind = 'bind',
  // TypeVolume is the type for remote storage volumes
  Volume = 'volume',
  // TypeTmpfs is the type for mounting tmpfs
  Tmpfs = 'tmpfs',
  // TypeNamedPipe is the type for mounting Windows named pipes
  NamedPipe = 'npipe',
}

interface MountPoint {
  Type?: MountType;
  Name?: string;
  Source: string;
  Destination: string;
  Driver?: string;
  Mode: string;
  RW: boolean;
  Propagation: MountPropagation;
}

export interface DockerContainerResponse {
  Id: string;
  Names: string[];
  Image: string;
  ImageID: string;
  Command: string;
  Created: number;
  Ports: PortResponse[];
  SizeRw?: number;
  SizeRootFs?: number;
  Labels: { [key: string]: string };
  State: string;
  Status: string;
  HostConfig: {
    NetworkMode?: string;
  };
  NetworkSettings?: SummaryNetworkSettings;
  Mounts: MountPoint[];

  Portainer: PortainerMetadata;
  IsPortainer: boolean;
}
