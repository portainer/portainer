import { useEffect } from 'react';
import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { useCurrentUser } from '@/react/hooks/useUser';
import { buildUrl } from '@/react/portainer/environments/environment.service/utils';
import {
  Environment,
  EnvironmentType,
} from '@/react/portainer/environments/types';
import {
  isAgentEnvironment,
  isLocalEnvironment,
} from '@/react/portainer/environments/utils';
import { RegistryId } from '@/react/portainer/registries/types/registry';
import { useRegistry } from '@/react/portainer/registries/queries/useRegistry';

import { Link } from '@@/Link';
import { TextTip } from '@@/Tip/TextTip';

import { getIsDockerHubRegistry } from './utils';

export function RateLimits({
  registryId,
  setValidity,
}: {
  registryId?: RegistryId;
  setValidity: (error?: string) => void;
}) {
  const registryQuery = useRegistry(registryId);

  const registry = registryQuery.data;

  const isDockerHubRegistry = getIsDockerHubRegistry(registry);

  const environmentQuery = useCurrentEnvironment();

  if (
    !environmentQuery.data ||
    registryQuery.isLoading ||
    !isDockerHubRegistry
  ) {
    return null;
  }

  return (
    <RateLimitsInner
      isAuthenticated={registry?.Authentication}
      registryId={registryId}
      setValidity={setValidity}
      environment={environmentQuery.data}
    />
  );
}

function RateLimitsInner({
  isAuthenticated = false,
  registryId = 0,
  setValidity,
  environment,
}: {
  isAuthenticated?: boolean;
  registryId?: RegistryId;
  setValidity: (error?: string) => void;
  environment: Environment;
}) {
  const pullRateLimits = useRateLimits(registryId, environment, setValidity);
  const { isAdmin } = useCurrentUser();

  if (!pullRateLimits) {
    return null;
  }

  return (
    <div className="form-group">
      <div className="col-sm-12">
        {pullRateLimits.remaining > 0 ? (
          <TextTip color="blue">
            {isAuthenticated ? (
              <>
                You are currently using a free account to pull images from
                DockerHub and will be limited to 200 pulls every 6 hours.
                Remaining pulls:
                <span className="font-bold">
                  {pullRateLimits.remaining}/{pullRateLimits.limit}
                </span>
              </>
            ) : (
              <>
                {isAdmin ? (
                  <>
                    You are currently using an anonymous account to pull images
                    from DockerHub and will be limited to 100 pulls every 6
                    hours. You can configure DockerHub authentication in the{' '}
                    <Link to="portainer.registries">Registries View</Link>.
                    Remaining pulls:{' '}
                    <span className="font-bold">
                      {pullRateLimits.remaining}/{pullRateLimits.limit}
                    </span>
                  </>
                ) : (
                  <>
                    You are currently using an anonymous account to pull images
                    from DockerHub and will be limited to 100 pulls every 6
                    hours. Contact your administrator to configure DockerHub
                    authentication. Remaining pulls:{' '}
                    <span className="font-bold">
                      {pullRateLimits.remaining}/{pullRateLimits.limit}
                    </span>
                  </>
                )}
              </>
            )}
          </TextTip>
        ) : (
          <TextTip>
            {isAuthenticated ? (
              <>
                Your authorized pull count quota as a free user is now exceeded.
                You will not be able to pull any image from the DockerHub
                registry.
              </>
            ) : (
              <>
                Your authorized pull count quota as an anonymous user is now
                exceeded. You will not be able to pull any image from the
                DockerHub registry.
              </>
            )}
          </TextTip>
        )}
      </div>
    </div>
  );
}

interface PullRateLimits {
  remaining: number;
  limit: number;
}

function useRateLimits(
  registryId: RegistryId,
  environment: Environment,
  setValidity: (error?: string) => void
) {
  const isValidForPull =
    isAgentEnvironment(environment.Type) || isLocalEnvironment(environment);

  const query = useQuery(
    ['dockerhub', environment.Id, registryId],
    () => getRateLimits(environment, registryId),
    {
      enabled: isValidForPull,
      onError(e) {
        // eslint-disable-next-line no-console
        console.error('Failed loading DockerHub pull rate limits', e);
        setValidity();
      },
      onSuccess(data) {
        setValidity(
          data.limit === 0 || data.remaining >= 0
            ? undefined
            : 'Rate limit exceeded'
        );
      },
    }
  );

  useEffect(() => {
    if (!isValidForPull) {
      setValidity();
    }
  });

  if (!isValidForPull) {
    return null;
  }

  return query.data;
}

function getRateLimits(environment: Environment, registryId: RegistryId) {
  if (isLocalEnvironment(environment)) {
    return getLocalEnvironmentRateLimits(environment.Id, registryId);
  }

  const envType = getEnvType(environment.Type);

  return getAgentEnvironmentRateLimits(environment.Id, envType, registryId);
}

async function getLocalEnvironmentRateLimits(
  environmentId: Environment['Id'],
  registryId: RegistryId
) {
  try {
    const { data } = await axios.get<PullRateLimits>(
      buildUrl(environmentId, `dockerhub/${registryId}`)
    );
    return data;
  } catch (e) {
    throw parseAxiosError(
      e as Error,
      'Unable to retrieve DockerHub pull rate limits'
    );
  }
}

function getEnvType(type: Environment['Type']) {
  switch (type) {
    case EnvironmentType.AgentOnKubernetes:
    case EnvironmentType.EdgeAgentOnKubernetes:
      return 'kubernetes';

    case EnvironmentType.AgentOnDocker:
    case EnvironmentType.EdgeAgentOnDocker:
    default:
      return 'docker';
  }
}

async function getAgentEnvironmentRateLimits(
  environmentId: Environment['Id'],
  envType: 'kubernetes' | 'docker',
  registryId: RegistryId
) {
  try {
    const { data } = await axios.get<PullRateLimits>(
      buildUrl(environmentId, `${envType}/v2/dockerhub/${registryId}`)
    );
    return data;
  } catch (e) {
    throw parseAxiosError(
      e as Error,
      'Unable to retrieve DockerHub pull rate limits'
    );
  }
}
