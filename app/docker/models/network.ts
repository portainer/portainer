import { IPAM, Network, NetworkContainer } from 'docker-types/generated/1.41';

import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';
import { IResource } from '@/react/docker/components/datatable/createOwnershipColumn';
import { PortainerResponse } from '@/react/docker/types';

// TODO later: aggregate NetworkViewModel and DockerNetwork types
//
// type MacvlanNetwork = {
//   ConfigFrom?: { Network: string };
//   ConfigOnly?: boolean;
// };
//
// type NetworkViewModel = Network & {
//   StackName?: string;
//   NodeName?: string;
//   ResourceControl?: ResourceControlViewModel;
// } & MacvlanNetwork;

export class NetworkViewModel implements IResource {
  Id: string;

  Name: string;

  Scope: string;

  Driver: string;

  Attachable: boolean;

  Internal: boolean;

  IPAM?: IPAM;

  Containers?: Record<string, NetworkContainer>;

  Options?: Record<string, string>;

  Ingress: boolean;

  Labels: Record<string, string>;

  StackName?: string;

  NodeName?: string;

  ConfigFrom?: { Network: string };

  ConfigOnly?: boolean;

  ResourceControl?: ResourceControlViewModel;

  constructor(
    data: PortainerResponse<Network> & {
      ConfigFrom?: { Network: string };
      ConfigOnly?: boolean;
    }
  ) {
    this.Id = data.Id || '';
    this.Name = data.Name || '';
    this.Scope = data.Scope || '';
    this.Driver = data.Driver || '';
    this.Attachable = data.Attachable || false;
    this.Internal = data.Internal || false;
    this.IPAM = data.IPAM;
    this.Containers = data.Containers;
    this.Options = data.Options;
    this.Ingress = data.Ingress || false;

    this.Labels = data.Labels || {};
    if (this.Labels && this.Labels['com.docker.compose.project']) {
      this.StackName = this.Labels['com.docker.compose.project'];
    } else if (this.Labels && this.Labels['com.docker.stack.namespace']) {
      this.StackName = this.Labels['com.docker.stack.namespace'];
    }

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

    this.ConfigFrom = data.ConfigFrom;
    this.ConfigOnly = data.ConfigOnly;
  }
}
