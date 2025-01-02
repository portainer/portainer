import { Secret } from 'docker-types/generated/1.41';

import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';
import { PortainerResponse } from '@/react/docker/types';
import { IResource } from '@/react/docker/components/datatable/createOwnershipColumn';

export class SecretViewModel implements IResource {
  Id: string;

  CreatedAt: string;

  UpdatedAt: string;

  Version: number;

  Name: string;

  Labels: Record<string, string>;

  ResourceControl?: ResourceControlViewModel;

  constructor(data: PortainerResponse<Secret>) {
    this.Id = data.ID || '';
    this.CreatedAt = data.CreatedAt || '';
    this.UpdatedAt = data.UpdatedAt || '';
    this.Version = data.Version?.Index || 0;
    this.Name = data.Spec?.Name || '';
    this.Labels = data.Spec?.Labels || {};

    if (data.Portainer?.ResourceControl) {
      this.ResourceControl = new ResourceControlViewModel(
        data.Portainer.ResourceControl
      );
    }
  }
}
