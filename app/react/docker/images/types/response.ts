import { PortainerResponse } from '../../types';

export type DockerImageResponse = PortainerResponse<{
  Containers: number;
  Created: number;
  Id: string;
  Labels: { [key: string]: string };
  ParentId: string;
  RepoDigests: string[];
  RepoTags: string[];
  SharedSize: number;
  Size: number;
}>;
