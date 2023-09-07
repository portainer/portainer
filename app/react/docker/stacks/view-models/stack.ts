import { Stack, StackStatus } from '@/react/common/stacks/types';
import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';
import { EnvironmentId } from '@/react/portainer/environments/types';
import {
  AutoUpdateResponse,
  RepoConfigResponse,
} from '@/react/portainer/gitops/types';

export class StackViewModel {
  Id: number;

  Type: number;

  Name: string;

  EndpointId: EnvironmentId;

  SwarmId: string;

  Env: { name: string; value: string }[];

  Option: { Prune: boolean; Force: boolean } | undefined;

  IsComposeFormat: boolean;

  ResourceControl?: ResourceControlViewModel;

  Status: StackStatus;

  CreationDate: number;

  CreatedBy: string;

  UpdateDate: number;

  UpdatedBy: string;

  Regular: boolean;

  External: boolean;

  Orphaned: boolean;

  OrphanedRunning: boolean;

  GitConfig: RepoConfigResponse | undefined;

  FromAppTemplate: boolean;

  AdditionalFiles: string[] | undefined;

  AutoUpdate: AutoUpdateResponse | undefined;

  Webhook: string | undefined;

  StackFileVersion: string;

  PreviousDeploymentInfo: unknown;

  constructor(stack: Stack, orphaned = false) {
    this.Id = stack.Id;
    this.Type = stack.Type;
    this.Name = stack.Name;
    this.EndpointId = stack.EndpointID;
    this.SwarmId = stack.SwarmID;
    this.Env = stack.Env ? stack.Env : [];
    this.Option = stack.Option;
    this.IsComposeFormat = stack.IsComposeFormat;

    if (stack.ResourceControl && stack.ResourceControl.Id !== 0) {
      this.ResourceControl = new ResourceControlViewModel(
        stack.ResourceControl
      );
    }

    this.Status = stack.Status;

    this.CreationDate = stack.CreationDate;
    this.CreatedBy = stack.CreatedBy;

    this.UpdateDate = stack.UpdateDate;
    this.UpdatedBy = stack.UpdatedBy;

    this.GitConfig = stack.GitConfig;
    this.FromAppTemplate = stack.FromAppTemplate;
    this.AdditionalFiles = stack.AdditionalFiles;
    this.AutoUpdate = stack.AutoUpdate;
    this.Webhook = stack.Webhook;
    this.StackFileVersion = stack.StackFileVersion;
    this.PreviousDeploymentInfo = stack.PreviousDeploymentInfo;

    this.Regular = !orphaned;
    this.External = false;
    this.Orphaned = orphaned;
    this.OrphanedRunning = false;
  }
}
