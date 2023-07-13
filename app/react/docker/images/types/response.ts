import { PortainerMetadata } from '../../types';

export type DockerImageResponse = {
  Containers: number;
  Created: number;
  Id: string;
  Labels: { [key: string]: string };
  ParentId: string;
  RepoDigests: string[];
  RepoTags: string[];
  SharedSize: number;
  Size: number;
  VirtualSize: number;
  Portainer?: PortainerMetadata;
};
