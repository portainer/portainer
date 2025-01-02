import { Config } from 'docker-types/generated/1.41';

import { IResource } from '@/react/docker/components/datatable/createOwnershipColumn';
import { PortainerResponse } from '@/react/docker/types';
import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';

export class ConfigViewModel implements IResource {
  Id: string;

  CreatedAt: string;

  UpdatedAt: string;

  Version: number;

  Name: string;

  Labels: Record<string, string>;

  Data: string;

  ResourceControl?: ResourceControlViewModel;

  constructor(data: PortainerResponse<Config>) {
    this.Id = data.ID || '';
    this.CreatedAt = data.CreatedAt || '';
    this.UpdatedAt = data.UpdatedAt || '';
    this.Version = data.Version?.Index || 0;
    this.Name = data.Spec?.Name || '';
    this.Labels = data.Spec?.Labels || {};
    this.Data = b64DecodeUnicode(data.Spec?.Data || '');

    if (data.Portainer && data.Portainer.ResourceControl) {
      this.ResourceControl = new ResourceControlViewModel(
        data.Portainer.ResourceControl
      );
    }
  }
}

function b64DecodeUnicode(str: string) {
  try {
    return decodeURIComponent(
      window
        .atob(str)
        .toString()
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
  } catch (err) {
    return window.atob(str);
  }
}
