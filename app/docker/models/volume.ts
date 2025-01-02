import { Volume } from 'docker-types/generated/1.41';

import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';
import { IResource } from '@/react/docker/components/datatable/createOwnershipColumn';
import { PortainerResponse } from '@/react/docker/types';

export class VolumeViewModel implements IResource {
  Id: string;

  Name: Volume['Name'];

  CreatedAt?: Volume['CreatedAt'];

  Driver: Volume['Driver'];

  Options: Volume['Options'];

  Labels: Volume['Labels'];

  Mountpoint: Volume['Mountpoint'];

  // Portainer properties

  ResourceId?: string;

  NodeName?: string;

  StackName?: string;

  ResourceControl?: ResourceControlViewModel;

  constructor(data: PortainerResponse<Volume> & { ResourceID?: string }) {
    this.Name = data.Name;
    this.CreatedAt = data.CreatedAt;
    this.Driver = data.Driver;
    this.Options = data.Options;
    this.Labels = data.Labels;
    if (this.Labels && this.Labels['com.docker.compose.project']) {
      this.StackName = this.Labels['com.docker.compose.project'];
    } else if (this.Labels && this.Labels['com.docker.stack.namespace']) {
      this.StackName = this.Labels['com.docker.stack.namespace'];
    }
    this.Mountpoint = data.Mountpoint;

    this.ResourceId = data.ResourceID;

    if (data.Portainer) {
      if (data.Portainer.ResourceControl) {
        this.ResourceControl = new ResourceControlViewModel(
          data.Portainer.ResourceControl
        );
      }
      if (data.Portainer.Agent && data.Portainer.Agent.NodeName) {
        this.NodeName = data.Portainer.Agent.NodeName;
      }
    }

    this.Id = data.Name;
    if (this.NodeName) {
      this.Id = `${data.Name}-${this.NodeName}`;
    }
  }
}
