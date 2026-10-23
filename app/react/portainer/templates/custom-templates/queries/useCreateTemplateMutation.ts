import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';
import { StackType } from '@/react/common/stacks/types';
import { VariableDefinition } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField/CustomTemplatesVariablesDefinitionField';
import {
  CustomTemplate,
  EdgeTemplateSettings,
} from '@/react/portainer/templates/custom-templates/types';
import { GitFormModel } from '@/react/portainer/gitops/types';
import { DefinitionFieldValues } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField';
import { AccessControlFormData } from '@/react/portainer/access-control/types';
import { applyResourceControl } from '@/react/portainer/access-control/access-control.service';
import { json2formData } from '@/portainer/helpers/json';

import { Platform } from '../../types';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

interface CreateTemplatePayload {
  EdgeTemplate?: boolean;
  Platform: Platform;
  Type: StackType;
  Method: 'editor' | 'upload' | 'repository';
  FileContent: string;
  File: File | undefined;
  Git: GitFormModel;
  Variables: DefinitionFieldValues;
  EdgeSettings?: EdgeTemplateSettings;
  Title: string;
  Description: string;
  Note: string;
  Logo: string;
}

export function useCreateTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    async (
      payload: CreateTemplatePayload & { AccessControl?: AccessControlFormData }
    ) => {
      const template = await createTemplate(payload);
      const resourceControl = template.ResourceControl;

      if (resourceControl && payload.AccessControl) {
        await applyResourceControl(payload.AccessControl, resourceControl.Id);
      }

      return template;
    },
    mutationOptions(
      withInvalidate(queryClient, [queryKeys.base()]),
      withError('Failed to create template')
    )
  );
}

function createTemplate(payload: CreateTemplatePayload) {
  switch (payload.Method) {
    case 'editor':
      return createTemplateFromText(payload);
    case 'upload':
      return createTemplateFromFile(payload);
    case 'repository':
      return createTemplateFromGitPayload(payload);
    default:
      throw new Error('Unknown method');
  }
}

function createTemplateFromGitPayload({
  Git: gitModel,
  ...values
}: CreateTemplatePayload) {
  return createTemplateFromGit({
    ...values,
    ...gitModel,
    ...(values.EdgeSettings
      ? {
          EdgeSettings: {
            ...values.EdgeSettings,
            ...values.EdgeSettings.RelativePathSettings,
          },
        }
      : {}),
  });
}

/**
 * Payload for creating a custom template from file content.
 */
interface CustomTemplateFromFileContentPayload {
  /** URL of the template's logo. */
  Logo: string;
  /** Title of the template. Required. */
  Title: string;
  /** Description of the template. Required. */
  Description: string;
  /** A note that will be displayed in the UI. Supports HTML content. */
  Note: string;
  /** Platform associated with the template. */
  Platform: Platform;
  /** Type of created stack. Required. */
  Type: StackType;
  /** Content of the stack file. Required. */
  FileContent: string;
  /** Definitions of variables in the stack file. */
  Variables: VariableDefinition[];
  /** Indicates if this template is for Edge Stack. */
  EdgeTemplate?: boolean;
  EdgeSettings?: EdgeTemplateSettings;
}
async function createTemplateFromText(
  values: CustomTemplateFromFileContentPayload
) {
  try {
    const { data } = await axios.post<CustomTemplate>(
      buildUrl({ action: 'create/string' }),
      values
    );
    return data;
  } catch (error) {
    throw parseAxiosError(error);
  }
}

interface CustomTemplateFromFilePayload {
  /** Title of the template */
  Title: string;
  /** Description of the template */
  Description: string;
  /** A note that will be displayed in the UI */
  Note: string;
  /** Platform associated with the template */
  Platform: Platform;
  /** Type of created stack */
  Type: StackType;
  /** File to upload */
  File?: File;
  /** URL of the template's logo */
  Logo?: string;
  /** Definitions of variables in the stack file */
  Variables?: VariableDefinition[];
  /** Indicates if this template is for Edge Stack. */
  EdgeTemplate?: boolean;
  EdgeSettings?: EdgeTemplateSettings;
}

async function createTemplateFromFile(values: CustomTemplateFromFilePayload) {
  try {
    if (!values.File) {
      throw new Error('No file provided');
    }

    const payload = json2formData({
      Platform: values.Platform,
      Type: values.Type,
      Title: values.Title,
      Description: values.Description,
      Note: values.Note,
      Logo: values.Logo,
      File: values.File,
      Variables: values.Variables,
      EdgeTemplate: values.EdgeTemplate,
      EdgeSettings: values.EdgeSettings,
    });

    const { data } = await axios.post<CustomTemplate>(
      buildUrl({ action: 'create/file' }),
      payload,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return data;
  } catch (error) {
    throw parseAxiosError(error);
  }
}

/**
 * Payload for creating a custom template from a Git repository.
 */
interface CustomTemplateFromGitRepositoryPayload {
  /** URL of the template's logo. */
  Logo: string;
  /** Title of the template. Required. */
  Title: string;
  /** Description of the template. Required. */
  Description: string;
  /** A note that will be displayed in the UI. Supports HTML content. */
  Note: string;
  /** Platform associated with the template. */
  Platform: Platform;
  /** Type of created stack. Required. */
  Type: StackType;
  /** References an existing Source for git credentials/URL. */
  SourceId?: number;
  /** Reference name of a Git repository hosting the Stack file. */
  RepositoryReferenceName?: string;
  /** Path to the Stack file inside the Git repository. */
  ComposeFilePathInRepository?: string;
  /** Definitions of variables in the stack file. */
  Variables: VariableDefinition[];
  /** Indicates if the Kubernetes template is created from a Docker Compose file. */
  IsComposeFormat?: boolean;
  /** Indicates if this template is for Edge Stack. */
  EdgeTemplate?: boolean;
  EdgeSettings?: EdgeTemplateSettings;
}
async function createTemplateFromGit(
  values: CustomTemplateFromGitRepositoryPayload
) {
  try {
    const { data } = await axios.post<CustomTemplate>(
      buildUrl({ action: 'create/repository' }),
      values
    );
    return data;
  } catch (error) {
    throw parseAxiosError(error);
  }
}
