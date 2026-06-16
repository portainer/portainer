import { useMutation } from '@tanstack/react-query';

import { EdgeGroup } from '@/react/edge/edge-groups/types';
import { RegistryId } from '@/react/portainer/registries/types/registry';
import { Pair } from '@/react/portainer/settings/types';
import {
  AutoUpdateResponse,
  GitFormModel,
  RelativePathModel,
} from '@/react/portainer/gitops/types';
import { withError } from '@/react-tools/react-query';

import { DeploymentType, StaggerConfig } from '../../types';

import { createStackFromFile } from './createStackFromFile';
import { createStackFromFileContent } from './createStackFromFileContent';
import { createStackFromGit } from './createStackFromGit';

export function useCreateEdgeStack() {
  return useMutation({
    mutationFn: createEdgeStack,
    ...withError('unable to create edge stack'),
  });
}

export type BasePayload = {
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
      return createEdgeStackFromGit(payload);
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

function createEdgeStackFromGit(
  payload: BasePayload & {
    git: GitFormModel;
    relativePathSettings?: RelativePathModel;
    autoUpdate: AutoUpdateResponse | null;
  }
) {
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
    sourceId: payload.git.SourceId,
    repositoryUrl: payload.git.RepositoryURL,
    repositoryReferenceName: payload.git.RepositoryReferenceName,
    filePathInRepository: payload.git.ComposeFilePathInRepository,
    repositoryAuthentication: payload.git.RepositoryAuthentication,
    repositoryUsername: payload.git.RepositoryUsername,
    repositoryPassword: payload.git.RepositoryPassword,
    filesystemPath: payload.relativePathSettings?.FilesystemPath,
    supportRelativePath: payload.relativePathSettings?.SupportRelativePath,
    perDeviceConfigsGroupMatchType:
      payload.relativePathSettings?.PerDeviceConfigsGroupMatchType,
    perDeviceConfigsMatchType:
      payload.relativePathSettings?.PerDeviceConfigsMatchType,
    perDeviceConfigsPath: payload.relativePathSettings?.PerDeviceConfigsPath,
    tlsSkipVerify: payload.git.TLSSkipVerify,
    autoUpdate: payload.autoUpdate,
  });
}
