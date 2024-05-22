import { Network } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';
import {
  withAgentManagerOperationHeader,
  withAgentTargetHeader,
} from '../../proxy/queries/utils';

type MacvlanConfigOnly = {
  ConfigOnly: true;
  Internal: false;
  Attachable: false;
  Options: {
    parent: string; // parent network card
  };
};

type MacvlanConfigFrom = {
  ConfigFrom: {
    Network: string;
  };
  Scope: 'swarm' | 'local';
};

type NetworkConfigBase = {
  Name: Required<Network>['Name'];
  CheckDuplicate?: boolean;
  Driver?: string;
  Internal?: boolean;
  Attachable?: boolean;
  Ingress?: boolean;
  IPAM?: Network['IPAM'];
  EnableIPv6?: boolean;
  Options?: Network['Options'];
  Labels?: Network['Labels'];
};

/**
 * This type definition of NetworkConfig doesnt enforce the usage of only one type of the union
 * and not a mix of fields of the unionised types.
 * e.g. the following is valid for TS while it is not for the Docker API
 *
 * const config: NetworkConfig = {
 *   Name: 'my-network', // shared
 *   ConfigOnly: true, // MacvlanConfigOnly
 *   Scope: 'swarm', // MacvlanConfigFrom
 * }
 *
 */
type NetworkConfig =
  | NetworkConfigBase
  | (NetworkConfigBase & MacvlanConfigOnly)
  | (NetworkConfigBase & MacvlanConfigFrom);

type CreateOptions = {
  nodeName?: string;
  agentManagerOperation?: boolean;
};

type CreateNetworkResponse = {
  Id: string;
  Warning: string;
};

/**
 * Raw docker API proxy
 */
export async function createNetwork(
  environmentId: EnvironmentId,
  networkConfig: NetworkConfig,
  { nodeName, agentManagerOperation }: CreateOptions = {}
) {
  try {
    const { data } = await axios.post<CreateNetworkResponse>(
      buildDockerProxyUrl(environmentId, 'networks', 'create'),
      networkConfig,
      {
        headers: {
          ...withAgentTargetHeader(nodeName),
          ...withAgentManagerOperationHeader(agentManagerOperation),
        },
      }
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to create network');
  }
}
