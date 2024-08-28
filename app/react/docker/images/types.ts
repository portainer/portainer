import { Registry } from '@/react/portainer/registries/types/registry';

import { DockerImageResponse } from './types/response';

type DecoratedDockerImage = {
  Used: boolean;
};

export type DockerImage = DecoratedDockerImage &
  Omit<DockerImageResponse, keyof DecoratedDockerImage>;

export type ImageModel = {
  UseRegistry: boolean;
  Registry?: Registry;
  Image: string;
};
