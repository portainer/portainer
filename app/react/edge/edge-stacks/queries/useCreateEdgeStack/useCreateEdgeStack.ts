import { useMutation } from '@tanstack/react-query';

import { EdgeGroup } from '@/react/edge/edge-groups/types';
import { RegistryId } from '@/react/portainer/registries/types/registry';
import { Pair } from '@/react/portainer/settings/types';
import {
  AutoUpdateResponse,
  GitFormModel,
  RelativePathModel,
} from '@/react/portainer/gitops/types';
import { saveGitCredentialsIfNeeded } from '@/react/portainer/account/git-credentials/queries/useCreateGitCredentialsMutation';
import { UserId } from '@/portainer/users/types';

import { DeploymentType, StaggerConfig } from '../../types';

import { createStackFromFile } from './createStackFromFile';
import { createStackFromFileContent } from './createStackFromFileContent';
import { createStackFromGit } from './createStackFromGit';

export function useCreateEdgeStack() {
  return useMutation(createEdgeStack);
}

export type BasePayload = {
  userId: UserId;
  /** Name of the stack */
  name: string;
  /** Content of the Stack file */
  /** List of identifiers of EdgeGroups */
  edgeGroups: Array<EdgeGroup['Id']>;
  /** Deployment type to deploy this stack */
  deploymentType: DeploymentType;
  /** List of Registries to use for this stack */
  registries?: Array<RegistryId>;
  /** Uses the manifest's namespaces instead of the default one */
  useManifestNamespaces?: boolean;
  /** Pre Pull image */
  prePullImage?: boolean;
  /** Retry deploy */
  retryDeploy?: boolean;
  /** List of environment variables */
  envVars?: Array<Pair>;
  /** Configuration for stagger updates */
  staggerConfig?: StaggerConfig;
};

/**
 * Payload for creating an EdgeStack from a string
 */
export type CreateEdgeStackPayload =
  | {
      method: 'file';
      payload: BasePayload & {
        /** File to upload */
        file: File;
        /** Optional webhook configuration */
        webhook?: string;
      };
    }
  | {
      method: 'string';
      payload: BasePayload & {
        /** Content of the Stack file */
        fileContent: string;
        /** Optional webhook configuration */
        webhook?: string;
      };
    }
  | {
      method: 'git';
      payload: BasePayload & {
        git: GitFormModel;
        relativePathSettings?: RelativePathModel;
        autoUpdate: AutoUpdateResponse | null;
      };
    };

function createEdgeStack({ method, payload }: CreateEdgeStackPayload) {
  switch (method) {
    case 'file':
      return createStackFromFile({
        DeploymentType: payload.deploymentType,
        EdgeGroups: payload.edgeGroups,
        Name: payload.name,
        file: payload.file,
        EnvVars: payload.envVars,
        PrePullImage: payload.prePullImage,
        Registries: payload.registries,
        RetryDeploy: payload.retryDeploy,
        StaggerConfig: payload.staggerConfig,
        UseManifestNamespaces: payload.useManifestNamespaces,
        Webhook: payload.webhook,
      });
    case 'git':
      return createStackAndGitCredential(payload.userId, payload);
    case 'string':
      return createStackFromFileContent({
        deploymentType: payload.deploymentType,
        edgeGroups: payload.edgeGroups,
        name: payload.name,
        envVars: payload.envVars,
        prePullImage: payload.prePullImage,
        registries: payload.registries,
        retryDeploy: payload.retryDeploy,
        staggerConfig: payload.staggerConfig,
        useManifestNamespaces: payload.useManifestNamespaces,
        stackFileContent: payload.fileContent,
        webhook: payload.webhook,
      });
    default:
      throw new Error('Invalid method');
  }
}

async function createStackAndGitCredential(
  userId: UserId,
  payload: BasePayload & {
    git: GitFormModel;
    relativePathSettings?: RelativePathModel;
    autoUpdate: AutoUpdateResponse | null;
  }
) {
  const newGitModel = await saveGitCredentialsIfNeeded(userId, payload.git);

  return createStackFromGit({
    deploymentType: payload.deploymentType,
    edgeGroups: payload.edgeGroups,
    name: payload.name,
    envVars: payload.envVars,
    prePullImage: payload.prePullImage,
    registries: payload.registries,
    retryDeploy: payload.retryDeploy,
    staggerConfig: payload.staggerConfig,
    useManifestNamespaces: payload.useManifestNamespaces,
    repositoryUrl: newGitModel.RepositoryURL,
    repositoryReferenceName: newGitModel.RepositoryReferenceName,
    filePathInRepository: newGitModel.ComposeFilePathInRepository,
    repositoryAuthentication: newGitModel.RepositoryAuthentication,
    repositoryUsername: newGitModel.RepositoryUsername,
    repositoryPassword: newGitModel.RepositoryPassword,
    repositoryGitCredentialId: newGitModel.RepositoryGitCredentialID,
    filesystemPath: payload.relativePathSettings?.FilesystemPath,
    supportRelativePath: payload.relativePathSettings?.SupportRelativePath,
    perDeviceConfigsGroupMatchType:
      payload.relativePathSettings?.PerDeviceConfigsGroupMatchType,
    perDeviceConfigsMatchType:
      payload.relativePathSettings?.PerDeviceConfigsMatchType,
    perDeviceConfigsPath: payload.relativePathSettings?.PerDeviceConfigsPath,
    tlsSkipVerify: newGitModel.TLSSkipVerify,
    autoUpdate: payload.autoUpdate,
  });
}
