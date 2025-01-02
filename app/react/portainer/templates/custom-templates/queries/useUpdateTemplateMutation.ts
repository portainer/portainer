import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import {
  mutationOptions,
  withGlobalError,
  withInvalidate,
} from '@/react-tools/react-query';
import { StackType } from '@/react/common/stacks/types';
import { VariableDefinition } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField/CustomTemplatesVariablesDefinitionField';
import { AccessControlFormData } from '@/react/portainer/access-control/types';
import { applyResourceControl } from '@/react/portainer/access-control/access-control.service';

import { CustomTemplate, EdgeTemplateSettings } from '../types';
import { Platform } from '../../types';

import { buildUrl } from './build-url';

export function useUpdateTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    async (
      payload: CustomTemplateUpdatePayload & {
        AccessControl?: AccessControlFormData;
        resourceControlId?: number;
      }
    ) => {
      await updateTemplate(payload);

      if (payload.resourceControlId && payload.AccessControl) {
        await applyResourceControl(
          payload.AccessControl,
          payload.resourceControlId
        );
      }
    },
    mutationOptions(
      withInvalidate(queryClient, [['custom-templates']]),
      withGlobalError('Failed to update template')
    )
  );
}

/**
 * Payload for updating a custom template
 */
interface CustomTemplateUpdatePayload {
  id: CustomTemplate['Id'];
  /** URL of the template's logo */
  Logo?: string;
  /** Title of the template */
  Title: string;
  /** Description of the template */
  Description: string;
  /** A note that will be displayed in the UI. Supports HTML content */
  Note?: string;
  /**
   * Platform associated to the template.
   * Required for Docker stacks
   */
  Platform?: Platform;
  /**
   * Type of created stack
   * Required
   */
  Type: StackType;
  /** URL of a Git repository hosting the Stack file */
  RepositoryURL?: string;
  /** Reference name of a Git repository hosting the Stack file */
  RepositoryReferenceName?: string;
  /** Use basic authentication to clone the Git repository */
  RepositoryAuthentication?: boolean;
  /** Username used in basic authentication. Required when RepositoryAuthentication is true */
  RepositoryUsername?: string;
  /** Password used in basic authentication. Required when RepositoryAuthentication is true */
  RepositoryPassword?: string;
  /**
   * GitCredentialID used to identify the bound git credential.
   * Required when RepositoryAuthentication is true and RepositoryUsername/RepositoryPassword are not provided
   */
  RepositoryGitCredentialID?: number;
  /** Path to the Stack file inside the Git repository */
  ComposeFilePathInRepository?: string;
  /** Content of stack file */
  FileContent?: string;
  /** Definitions of variables in the stack file */
  Variables?: VariableDefinition[];
  /** TLSSkipVerify skips SSL verification when cloning the Git repository */
  TLSSkipVerify?: boolean;
  /** IsComposeFormat indicates if the Kubernetes template is created from a Docker Compose file */
  IsComposeFormat?: boolean;
  /** EdgeTemplate indicates if this template purpose for Edge Stack */
  EdgeTemplate?: boolean;
  EdgeSettings?: EdgeTemplateSettings;
}

async function updateTemplate(values: CustomTemplateUpdatePayload) {
  try {
    const { data } = await axios.put<CustomTemplate>(
      buildUrl({ id: values.id }),
      values
    );
    return data;
  } catch (error) {
    throw parseAxiosError(error);
  }
}
