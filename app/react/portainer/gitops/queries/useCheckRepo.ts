import { AxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';

import axios, {
  isDefaultResponse,
  parseAxiosError,
} from '@/portainer/services/axios';

interface Creds {
  username?: string;
  password?: string;
  gitCredentialId?: number;
}
interface CheckRepoOptions {
  creds?: Creds;
  force?: boolean;
  tlsSkipVerify?: boolean;
  createdFromCustomTemplateId?: number;
}

export function useCheckRepo(
  url: string,
  options: CheckRepoOptions,
  {
    enabled,
    onSettled,
  }: { enabled?: boolean; onSettled?(isValid?: boolean): void } = {}
) {
  return useQuery(
    ['git_repo_valid', url, options],
    () => checkRepo(url, options),
    {
      enabled: !!url && enabled,
      onSettled,
      retry: false,
    }
  );
}

export async function checkRepo(
  repository: string,
  { force, ...options }: CheckRepoOptions
): Promise<boolean> {
  try {
    await axios.post<string[]>(
      '/gitops/repo/refs',
      {
        repository,
        tlsSkipVerify: options.tlsSkipVerify,
        createdFromCustomTemplateId: options.createdFromCustomTemplateId,
        ...options.creds,
      },
      force ? { params: { force } } : {}
    );
    return true;
  } catch (error) {
    throw parseAxiosError(error, '', (axiosError: AxiosError) => {
      let details = isDefaultResponse(axiosError.response?.data)
        ? axiosError.response?.data.details || ''
        : '';

      const { creds = {} } = options;
      // If no credentials were provided alter error from git to indicate repository is not found or is private
      if (
        (!(creds.username && creds.password) || !creds.gitCredentialId) &&
        details ===
          'authentication failed, please ensure that the git credentials are correct'
      ) {
        details =
          'Git repository could not be found or is private, please ensure that the URL is correct or credentials are provided.';
      }

      const error = new Error(details);
      return { error, details };
    });
  }
}
