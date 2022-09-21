import { useQuery } from 'react-query';
import semverCompare from 'semver-compare';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { queryKeys } from './query-keys';
import { buildUrl } from './urls';

export function useSupportedAgentVersions(
  minVersion?: string,
  { onSuccess }: { onSuccess?(data: string[]): void } = {}
) {
  return useQuery(
    [...queryKeys.supportedAgentVersions(), { minVersion }],
    getSupportedAgentVersions,
    {
      select(versions) {
        if (!minVersion) {
          return versions;
        }

        return versions.filter(
          (version) => semverCompare(version, minVersion) > 0
        );
      },
      onSuccess,
      ...withError('failed fetching available agent versions'),
    }
  );
}

async function getSupportedAgentVersions() {
  try {
    const { data } = await axios.get<string[]>(
      buildUrl(undefined, 'agent_versions')
    );
    return data;
  } catch (err) {
    throw parseAxiosError(
      err as Error,
      'Failed to get list of edge update schedules'
    );
  }
}
