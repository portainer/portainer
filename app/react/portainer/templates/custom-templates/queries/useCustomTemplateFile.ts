import { useMutation, useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withGlobalError } from '@/react-tools/react-query';

import { CustomTemplate } from '../types';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

type CustomTemplateFileContent = {
  FileContent: string;
};

export function useCustomTemplateFile(
  id?: CustomTemplate['Id'],
  git = false,
  { enabled }: { enabled?: boolean } = {}
) {
  return useQuery(
    queryKeys.file(id!, { git }),
    () => getCustomTemplateFile({ id: id!, git }),
    {
      ...withGlobalError('Failed to get custom template file'),
      enabled: !!id && enabled,
      // there's nothing to do with a new file content, so we're disabling refetch
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );
}

export function useCustomTemplateFileMutation() {
  return useMutation({
    mutationFn: getCustomTemplateFile,
    ...withGlobalError('Failed to get custom template file'),
  });
}

export function getCustomTemplateFile({
  git,
  id,
}: {
  id: CustomTemplate['Id'];
  git: boolean;
}) {
  return git ? getCustomTemplateGitFetch(id) : getCustomTemplateFileContent(id);
}

async function getCustomTemplateFileContent(id: number) {
  try {
    const {
      data: { FileContent },
    } = await axios.get<CustomTemplateFileContent>(
      buildUrl({ id, action: 'file' })
    );
    return FileContent;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get custom template file content');
  }
}

async function getCustomTemplateGitFetch(id: number) {
  try {
    const {
      data: { FileContent },
    } = await axios.put<CustomTemplateFileContent>(
      buildUrl({ id, action: 'git_fetch' })
    );
    return FileContent;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get custom template file content');
  }
}
