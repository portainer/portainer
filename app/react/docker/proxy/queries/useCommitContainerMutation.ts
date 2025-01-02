import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from './buildDockerProxyUrl';

type CommitParams = {
  container?: string; //  The ID or name of the container to commit
  repo?: string; //  Repository name for the created image
  tag?: string; //  Tag name for the create image
  comment?: string; //  Commit message
  author?: string; //  Author of the image (e.g., John Hannibal Smith <hannibal@a-team.com>)
  pause?: boolean; //  Default: true  Whether to pause the container before committing
  changes?: string; //  Dockerfile instructions to apply while committing
};

export async function commitContainer(
  environmentId: EnvironmentId,
  params: CommitParams
) {
  try {
    const { data } = await axios.post<{ Id: string }>(
      buildDockerProxyUrl(environmentId, 'commit'),
      {},
      {
        params,
      }
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to commit container');
  }
}
