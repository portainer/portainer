import { IResource } from '@/react/docker/components/datatable/createOwnershipColumn';
import { ContainerDetailsResponse } from '@/react/docker/containers/queries/useContainer';
import { PortainerResponse } from '@/react/docker/types';
import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';

export class ContainerDetailsViewModel
  implements IResource, Pick<PortainerResponse<unknown>, 'IsPortainer'>
{
  Model: ContainerDetailsResponse;

  Id: ContainerDetailsResponse['Id'];

  State: ContainerDetailsResponse['State'];

  Created: ContainerDetailsResponse['Created'];

  Name: ContainerDetailsResponse['Name'];

  NetworkSettings: ContainerDetailsResponse['NetworkSettings'];

  Args: ContainerDetailsResponse['Args'];

  Image: ContainerDetailsResponse['Image'];

  Config: ContainerDetailsResponse['Config'];

  HostConfig: ContainerDetailsResponse['HostConfig'];

  Mounts: ContainerDetailsResponse['Mounts'];

  // IResource
  ResourceControl?: ResourceControlViewModel;

  // PortainerResponse
  IsPortainer?: ContainerDetailsResponse['IsPortainer'];

  constructor(data: ContainerDetailsResponse) {
    this.Model = data;
    this.Id = data.Id;
    this.State = data.State;
    this.Created = data.Created;
    this.Name = data.Name;
    this.NetworkSettings = data.NetworkSettings;
    this.Args = data.Args;
    this.Image = data.Image;
    this.Config = data.Config;
    this.HostConfig = data.HostConfig;
    this.Mounts = data.Mounts;
    if (data.Portainer && data.Portainer.ResourceControl) {
      this.ResourceControl = new ResourceControlViewModel(
        data.Portainer.ResourceControl
      );
    }
    this.IsPortainer = data.IsPortainer;
  }
}
