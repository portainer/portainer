import { ZapIcon } from 'lucide-react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { getDockerEnvironmentType } from '@/react/portainer/environments/utils/getDockerEnvironmentType';
import { useIsPodman } from '@/react/portainer/environments/queries/useIsPodman';

import { Icon } from '@@/Icon';

import { useInfo } from '../proxy/queries/useInfo';

export function DockerInfo({ isAgent }: { isAgent: boolean }) {
  const envId = useEnvironmentId();
  const infoQuery = useInfo(envId);
  const isPodman = useIsPodman(envId);

  if (!infoQuery.data) {
    return null;
  }

  const info = infoQuery.data;

  const isSwarm = info.Swarm !== undefined && info.Swarm?.NodeID !== '';
  const type = getDockerEnvironmentType(isSwarm, isPodman);

  return (
    <span className="inline-flex gap-x-2 small text-muted">
      <span>
        {type} {info.ServerVersion}
      </span>
      {isAgent && (
        <>
          <span>-</span>
          <span className="inline-flex items-center">
            <Icon icon={ZapIcon} />
            Agent
          </span>
        </>
      )}
    </span>
  );
}
