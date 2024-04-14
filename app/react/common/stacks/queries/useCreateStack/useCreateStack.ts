import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { Pair } from '@/react/portainer/settings/types';
import {
  GitFormModel,
  RelativePathModel,
} from '@/react/portainer/gitops/types';
import { applyResourceControl } from '@/react/portainer/access-control/access-control.service';
import { AccessControlFormData } from '@/react/portainer/access-control/types';
import PortainerError from '@/portainer/error';
import { withError, withInvalidate } from '@/react-tools/react-query';

import { queryKeys } from '../query-keys';

import { createSwarmStackFromFile } from './createSwarmStackFromFile';
import { createSwarmStackFromGit } from './createSwarmStackFromGit';
import { createSwarmStackFromFileContent } from './createSwarmStackFromFileContent';
import { createStandaloneStackFromFile } from './createStandaloneStackFromFile';
import { createStandaloneStackFromGit } from './createStandaloneStackFromGit';
import { createStandaloneStackFromFileContent } from './createStandaloneStackFromFileContent';
import { createKubernetesStackFromUrl } from './createKubernetesStackFromUrl';
import { createKubernetesStackFromGit } from './createKubernetesStackFromGit';
import { createKubernetesStackFromFileContent } from './createKubernetesStackFromFileContent';

export function useCreateStack() {
  const queryClient = useQueryClient();
  return useMutation(createStack, {
    ...withError('Failed to create stack'),
    ...withInvalidate(queryClient, [queryKeys.base()]),
  });
}

type BasePayload = {
  name: string;
  environmentId: EnvironmentId;
};

type DockerBasePayload = BasePayload & {
  env?: Array<Pair>;
  accessControl: AccessControlFormData;
};

type SwarmBasePayload = DockerBasePayload & {
  swarmId: string;
};

type KubernetesBasePayload = BasePayload & {
  namespace: string;
  composeFormat: boolean;
};

export type SwarmCreatePayload =
  | {
      method: 'file';
      payload: SwarmBasePayload & {
        /** File to upload */
        file: File;
        /** Optional webhook configuration */
        webhook?: string;
      };
    }
  | {
      method: 'string';
      payload: SwarmBasePayload & {
        /** Content of the Stack file */
        fileContent: string;
        /** Optional webhook configuration */
        webhook?: string;
        fromAppTemplate?: boolean;
      };
    }
  | {
      method: 'git';
      payload: SwarmBasePayload & {
        git: GitFormModel;
        relativePathSettings?: RelativePathModel;
        fromAppTemplate?: boolean;
      };
    };

type StandaloneCreatePayload =
  | {
      method: 'file';
      payload: DockerBasePayload & {
        /** File to upload */
        file: File;
        /** Optional webhook configuration */
        webhook?: string;
      };
    }
  | {
      method: 'string';
      payload: DockerBasePayload & {
        /** Content of the Stack file */
        fileContent: string;
        /** Optional webhook configuration */
        webhook?: string;
        fromAppTemplate?: boolean;
      };
    }
  | {
      method: 'git';
      payload: DockerBasePayload & {
        git: GitFormModel;
        relativePathSettings?: RelativePathModel;
        fromAppTemplate?: boolean;
      };
    };

type KubernetesCreatePayload =
  | {
      method: 'string';
      payload: KubernetesBasePayload & {
        /** Content of the Stack file */
        fileContent: string;
        /** Optional webhook configuration */
        webhook?: string;
      };
    }
  | {
      method: 'git';
      payload: KubernetesBasePayload & {
        git: GitFormModel;
        relativePathSettings?: RelativePathModel;
      };
    }
  | {
      method: 'url';
      payload: KubernetesBasePayload & {
        manifestUrl: string;
      };
    };

export type CreateStackPayload =
  | ({ type: 'swarm' } & SwarmCreatePayload)
  | ({ type: 'standalone' } & StandaloneCreatePayload)
  | ({ type: 'kubernetes' } & KubernetesCreatePayload);

async function createStack(payload: CreateStackPayload) {
  const stack = await createActualStack(payload);

  if (payload.type === 'standalone' || payload.type === 'swarm') {
    const resourceControl = stack.ResourceControl;

    // Portainer will always return a resource control, but since types mark it as optional, we need to check it.
    // Ignoring the missing value will result with bugs, hence it's better to throw an error
    if (!resourceControl) {
      throw new PortainerError('resource control expected after creation');
    }

    await applyResourceControl(
      payload.payload.accessControl,
      resourceControl.Id
    );
  }
}

function createActualStack(payload: CreateStackPayload) {
  switch (payload.type) {
    case 'swarm':
      return createSwarmStack(payload);
    case 'standalone':
      return createStandaloneStack(payload);
    case 'kubernetes':
      return createKubernetesStack(payload);
    default:
      throw new Error('Invalid type');
  }
}

function createSwarmStack({ method, payload }: SwarmCreatePayload) {
  switch (method) {
    case 'file':
      return createSwarmStackFromFile({
        environmentId: payload.environmentId,
        file: payload.file,
        Name: payload.name,
        SwarmID: payload.swarmId,
        Env: payload.env,
        Webhook: payload.webhook,
      });
    case 'git':
      return createSwarmStackFromGit({
        name: payload.name,
        env: payload.env,
        repositoryUrl: payload.git.RepositoryURL,
        repositoryReferenceName: payload.git.RepositoryReferenceName,
        composeFile: payload.git.ComposeFilePathInRepository,
        repositoryAuthentication: payload.git.RepositoryAuthentication,
        repositoryUsername: payload.git.RepositoryUsername,
        repositoryPassword: payload.git.RepositoryPassword,
        repositoryGitCredentialId: payload.git.RepositoryGitCredentialID,
        filesystemPath: payload.relativePathSettings?.FilesystemPath,
        supportRelativePath: payload.relativePathSettings?.SupportRelativePath,
        tlsSkipVerify: payload.git.TLSSkipVerify,
        autoUpdate: payload.git.AutoUpdate,
        environmentId: payload.environmentId,
        swarmID: payload.swarmId,
        additionalFiles: payload.git.AdditionalFiles,
        fromAppTemplate: payload.fromAppTemplate,
      });
    case 'string':
      return createSwarmStackFromFileContent({
        name: payload.name,
        env: payload.env,
        environmentId: payload.environmentId,
        stackFileContent: payload.fileContent,
        webhook: payload.webhook,
        swarmID: payload.swarmId,
        fromAppTemplate: payload.fromAppTemplate,
      });
    default:
      throw new Error('Invalid method');
  }
}

function createStandaloneStack({ method, payload }: StandaloneCreatePayload) {
  switch (method) {
    case 'file':
      return createStandaloneStackFromFile({
        environmentId: payload.environmentId,
        file: payload.file,
        Name: payload.name,
        Env: payload.env,
        Webhook: payload.webhook,
      });
    case 'git':
      return createStandaloneStackFromGit({
        name: payload.name,
        env: payload.env,
        repositoryUrl: payload.git.RepositoryURL,
        repositoryReferenceName: payload.git.RepositoryReferenceName,
        composeFile: payload.git.ComposeFilePathInRepository,
        repositoryAuthentication: payload.git.RepositoryAuthentication,
        repositoryUsername: payload.git.RepositoryUsername,
        repositoryPassword: payload.git.RepositoryPassword,
        repositoryGitCredentialId: payload.git.RepositoryGitCredentialID,
        filesystemPath: payload.relativePathSettings?.FilesystemPath,
        supportRelativePath: payload.relativePathSettings?.SupportRelativePath,
        tlsSkipVerify: payload.git.TLSSkipVerify,
        autoUpdate: payload.git.AutoUpdate,
        environmentId: payload.environmentId,
        additionalFiles: payload.git.AdditionalFiles,
        fromAppTemplate: payload.fromAppTemplate,
      });
    case 'string':
      return createStandaloneStackFromFileContent({
        name: payload.name,
        env: payload.env,
        environmentId: payload.environmentId,
        stackFileContent: payload.fileContent,
        webhook: payload.webhook,
        fromAppTemplate: payload.fromAppTemplate,
      });
    default:
      throw new Error('Invalid method');
  }
}

function createKubernetesStack({ method, payload }: KubernetesCreatePayload) {
  switch (method) {
    case 'string':
      return createKubernetesStackFromFileContent({
        stackName: payload.name,

        environmentId: payload.environmentId,
        stackFileContent: payload.fileContent,
        composeFormat: payload.composeFormat,
        namespace: payload.namespace,
      });
    case 'git':
      return createKubernetesStackFromGit({
        stackName: payload.name,

        repositoryUrl: payload.git.RepositoryURL,
        repositoryReferenceName: payload.git.RepositoryReferenceName,
        manifestFile: payload.git.ComposeFilePathInRepository,
        repositoryAuthentication: payload.git.RepositoryAuthentication,
        repositoryUsername: payload.git.RepositoryUsername,
        repositoryPassword: payload.git.RepositoryPassword,
        repositoryGitCredentialId: payload.git.RepositoryGitCredentialID,

        tlsSkipVerify: payload.git.TLSSkipVerify,
        autoUpdate: payload.git.AutoUpdate,
        environmentId: payload.environmentId,
        additionalFiles: payload.git.AdditionalFiles,
        composeFormat: payload.composeFormat,
        namespace: payload.namespace,
      });
    case 'url':
      return createKubernetesStackFromUrl({
        stackName: payload.name,
        composeFormat: payload.composeFormat,
        environmentId: payload.environmentId,
        manifestURL: payload.manifestUrl,
        namespace: payload.namespace,
      });
    default:
      throw new Error('Invalid method');
  }
}
