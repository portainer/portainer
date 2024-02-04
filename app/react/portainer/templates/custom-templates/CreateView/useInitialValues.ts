import { useCurrentStateAndParams } from '@uirouter/react';

import { parseAccessControlFormData } from '@/react/portainer/access-control/utils';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';
import { StackType } from '@/react/common/stacks/types';

import { Platform } from '../../types';
import { useFetchTemplateFile } from '../../app-templates/queries/useFetchTemplateFile';
import { getDefaultEdgeTemplateSettings } from '../types';

import { FormValues, Method } from './types';

export function useInitialValues({
  defaultType,
  isEdge = false,
  buildMethods,
}: {
  defaultType: StackType;
  isEdge?: boolean;
  buildMethods: Array<Method>;
}): FormValues | undefined {
  const { user } = useCurrentUser();
  const isAdminQuery = useIsEdgeAdmin();

  const { appTemplateId, type = defaultType } = useAppTemplateParams();

  const fileContentQuery = useFetchTemplateFile(appTemplateId);
  if (fileContentQuery.isLoading || isAdminQuery.isLoading) {
    return undefined;
  }

  return {
    Title: '',
    FileContent: fileContentQuery.data ?? '',
    Type: type,
    Platform: Platform.LINUX,
    File: undefined,
    Method: buildMethods[0],
    Description: '',
    Note: '',
    Logo: '',
    Variables: [],
    Git: {
      RepositoryURL: '',
      RepositoryReferenceName: '',
      RepositoryAuthentication: false,
      RepositoryUsername: '',
      RepositoryPassword: '',
      ComposeFilePathInRepository: 'docker-compose.yml',
      AdditionalFiles: [],
      RepositoryURLValid: true,
      TLSSkipVerify: false,
    },
    AccessControl: isEdge
      ? undefined
      : parseAccessControlFormData(isAdminQuery.isAdmin, user.Id),
    EdgeSettings: isEdge ? getDefaultEdgeTemplateSettings() : undefined,
  };
}

function useAppTemplateParams() {
  const {
    params: { type, appTemplateId },
  } = useCurrentStateAndParams();

  return {
    type: getStackType(type),
    appTemplateId: getTemplateId(appTemplateId),
  };

  function getStackType(type: string): StackType | undefined {
    if (!type) {
      return undefined;
    }

    const typeNum = parseInt(type, 10);

    if (
      [
        StackType.DockerSwarm,
        StackType.DockerCompose,
        StackType.Kubernetes,
      ].includes(typeNum)
    ) {
      return typeNum;
    }

    return undefined;
  }

  function getTemplateId(appTemplateId: string): number | undefined {
    const id = parseInt(appTemplateId, 10);

    return Number.isNaN(id) ? undefined : id;
  }
}
