import {
  AutoUpdateModel,
  AutoUpdateResponse,
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

export interface UpdateKubeGitStackPayload extends GitCredentialsModel {
  AutoUpdate: AutoUpdateResponse | null;
  RepositoryReferenceName: string;
  TLSSkipVerify: boolean;
}

export interface RedeployGitStackPayload extends GitCredentialsModel {
  RepositoryReferenceName: string;
  Namespace: string;
}
