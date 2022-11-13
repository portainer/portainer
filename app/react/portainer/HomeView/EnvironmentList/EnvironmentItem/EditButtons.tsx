import { Edit2, Settings } from 'react-feather';
import { ReactNode } from 'react';
import clsx from 'clsx';

import { useUser } from '@/react/hooks/useUser';
import {
  Environment,
  PlatformType,
} from '@/react/portainer/environments/types';
import {
  isEdgeAsync as checkEdgeAsync,
  getPlatformType,
} from '@/react/portainer/environments/utils';

import { LinkButton } from '@@/LinkButton';

export function EditButtons({ environment }: { environment: Environment }) {
  const { isAdmin } = useUser();

  const isEdgeAsync = checkEdgeAsync(environment);

  const configRoute = getConfigRoute(environment);
  return (
    <ButtonsGrid className="w-11 -m-[11px] ml-3">
      <LinkButton
        disabled={!isAdmin}
        to="portainer.endpoints.endpoint"
        params={{ id: environment.Id }}
        color="none"
        icon={Edit2}
        size="medium"
        className="w-full h-full !ml-0 hover:bg-gray-3 !rounded-none"
      />
      {configRoute && !isEdgeAsync && (
        <LinkButton
          disabled={!isAdmin}
          to={configRoute}
          params={{ endpointId: environment.Id }}
          color="none"
          icon={Settings}
          size="medium"
          className="w-full h-full !ml-0 hover:bg-gray-3 !rounded-none"
        />
      )}
    </ButtonsGrid>
  );
}

function getConfigRoute(environment: Environment) {
  const platform = getPlatformType(environment.Type);

  switch (platform) {
    case PlatformType.Docker:
      return getDockerConfigRoute(environment);
    case PlatformType.Kubernetes:
      return 'kubernetes.cluster';
    default:
      return '';
  }
}

function getDockerConfigRoute(environment: Environment) {
  const snapshot = environment.Snapshots?.[0];
  if (!snapshot) {
    return '';
  }

  return snapshot.Swarm ? 'docker.swarm' : 'docker.host';
}

function ButtonsGrid({
  children,
  className,
}: {
  children: ReactNode[];
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'grid grid-rows-3 border border-solid border-gray-5 rounded-r-lg',
        className
      )}
    >
      <div>{children[0] || null}</div>
      <div className="border-x-0 border-y border-gray-5 border-solid">
        {children[1] || null}
      </div>
      <div>{children[2] || null}</div>
    </div>
  );
}
