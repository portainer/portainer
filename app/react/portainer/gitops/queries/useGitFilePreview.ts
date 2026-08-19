import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';

export interface GitFilePreviewParams {
  targetFile: string;
  reference?: string;
  /** When set, resolves URL and auth from the stored Source record */
  sourceId?: number;
}

async function getFilePreview(params: GitFilePreviewParams): Promise<string> {
  try {
    const { data } = await axios.post<{ FileContent: string }>(
      '/gitops/repo/file/preview',
      params
    );
    return data.FileContent;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to fetch file from git');
  }
}

export function useGitFilePreview<TData = string>(
  params: GitFilePreviewParams,
  options: { enabled?: boolean; select?: (data: string) => TData } = {}
) {
  const { enabled = true, select } = options;
  return useQuery({
    queryKey: ['gitops', 'file-preview', params],
    queryFn: () => getFilePreview(params),
    enabled: enabled && !!params.sourceId && !!params.targetFile,
    select,
    retry: false,
  });
}
