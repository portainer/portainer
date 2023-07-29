import { DockerImageResponse } from './types/response';

type Status = 'outdated' | 'updated' | 'inprocess' | string;

export enum ResourceType {
  CONTAINER,
  SERVICE,
}

export interface ImageStatus {
  Status: Status;
  Message: string;
}

export type ResourceID = string;

type DecoratedDockerImage = {
  Used: boolean;
};

export type DockerImage = DecoratedDockerImage &
  Omit<DockerImageResponse, keyof DecoratedDockerImage>;
