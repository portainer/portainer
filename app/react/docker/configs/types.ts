import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';

export type DockerConfig = {
  Id: string;
  Name: string;
  CreatedAt: string;
  ResourceControl?: ResourceControlViewModel;
};
