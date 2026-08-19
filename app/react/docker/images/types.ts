import { DockerImageResponse } from './types/response';

type DecoratedDockerImage = {
  Used: boolean;
};

export type DockerImage = DecoratedDockerImage &
  Omit<DockerImageResponse, keyof DecoratedDockerImage>;
