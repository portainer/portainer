import { useMutation, useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withGlobalError } from '@/react-tools/react-query';

import { CustomTemplate } from '../types';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

type CustomTemplateFileContent = {
  FileContent: string;
};

export function useCustomTemplateFile(id?: CustomTemplate['Id'], git = false) {
  return useQuery(
    id ? queryKeys.file(id, { git }) : [],
    () => getCustomTemplateFile({ id: id!, git }),
    {
      ...withGlobalError('Failed to get custom template file'),
      enabled: !!id,
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
