import {
  AutoUpdateModel,
  GitAuthModel,
  GitCredentialsModel,
} from '@/react/portainer/gitops/types';

export interface KubeAppGitFormValues {
  authentication: GitAuthModel;
  repositoryReferenceName: string;
  repositoryURL: string;
  tlsSkipVerify: boolean;
  autoUpdate: AutoUpdateModel;
}

export interface RedeployGitStackPayload extends GitCredentialsModel {
  RepositoryReferenceName: string;
  Namespace: string;
}
