import { useMutation, useQueryClient } from 'react-query';

import axios, {
  json2formData,
  parseAxiosError,
} from '@/portainer/services/axios';
import {
  mutationOptions,
  withGlobalError,
  withInvalidate,
} from '@/react-tools/react-query';
import { StackType } from '@/react/common/stacks/types';
import { FormValues } from '@/react/edge/templates/custom-templates/CreateView/types';
import { VariableDefinition } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField/CustomTemplatesVariablesDefinitionField';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';

import { Platform } from '../../types';

import { buildUrl } from './build-url';

export function useCreateTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    createTemplate,
    mutationOptions(
      withInvalidate(queryClient, [['custom-templates']]),
      withGlobalError('Failed to create template')
    )
  );
}

function createTemplate({
  Method,
  Git,
  ...values
}: FormValues & { EdgeTemplate?: boolean }) {
  switch (Method) {
    case 'editor':
      return createTemplateFromText(values);
    case 'upload':
      return createTemplateFromFile(values);
    case 'repository':
      return createTemplateFromGit({ ...values, ...Git });
    default:
      throw new Error('Unknown method');
  }
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
}

async function createTemplateFromFile(values: CustomTemplateFromFilePayload) {
  try {
    if (!values.File) {
      throw new Error('No file provided');
    }

    const { data } = await axios.post<CustomTemplate>(
      buildUrl({ action: 'create/file' }),
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        data: json2formData({
          Platform: values.Platform,
          Type: values.Type,
          Title: values.Title,
          Description: values.Description,
          Note: values.Note,
          Logo: values.Logo,
          File: values.File,
          Variables: values.Variables,
        }),
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
  /** URL of a Git repository hosting the Stack file. Required. */
  RepositoryURL: string;
  /** Reference name of a Git repository hosting the Stack file. */
  RepositoryReferenceName?: string;
  /** Use basic authentication to clone the Git repository. */
  RepositoryAuthentication: boolean;
  /** Username used in basic authentication when RepositoryAuthentication is true. */
  RepositoryUsername?: string;
  /** Password used in basic authentication when RepositoryAuthentication is true. */
  RepositoryPassword?: string;
  /** Path to the Stack file inside the Git repository. */
  ComposeFilePathInRepository: string;
  /** Definitions of variables in the stack file. */
  Variables: VariableDefinition[];
  /** Indicates whether to skip SSL verification when cloning the Git repository. */
  TLSSkipVerify: boolean;
  /** Indicates if the Kubernetes template is created from a Docker Compose file. */
  IsComposeFormat?: boolean;
  /** Indicates if this template is for Edge Stack. */
  EdgeTemplate?: boolean;
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
