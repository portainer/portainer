import { ZapIcon } from 'lucide-react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { Icon } from '@@/Icon';

import { useInfo } from '../proxy/queries/useInfo';

export function DockerInfo({ isAgent }: { isAgent: boolean }) {
  const envId = useEnvironmentId();
  const infoQuery = useInfo(envId);

  if (!infoQuery.data) {
    return null;
  }

  const info = infoQuery.data;

  const isSwarm = info.Swarm && info.Swarm.NodeID !== '';

  return (
    <span className="small text-muted">
      {isSwarm ? 'Swarm' : 'Standalone'} {info.ServerVersion}
      {isAgent && (
        <span className="flex gap-1 items-center">
          <Icon icon={ZapIcon} />
          Agent
        </span>
      )}
    </span>
  );
}
