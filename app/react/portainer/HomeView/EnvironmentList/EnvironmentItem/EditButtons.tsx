import { Edit2, Settings } from 'lucide-react';
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
    <ButtonsGrid className="w-11 ml-3">
      <LinkButton
        disabled={!isAdmin}
        to="portainer.endpoints.endpoint"
        params={{ id: environment.Id, redirectTo: 'portainer.home' }}
        color="none"
        icon={Edit2}
        size="medium"
        className="w-full h-full !ml-0 hover:bg-gray-3 !rounded-none"
        title="Edit"
      />

      <LinkButton
        disabled={!configRoute || isEdgeAsync || !isAdmin}
        to={configRoute}
        params={{ endpointId: environment.Id }}
        color="none"
        icon={Settings}
        size="medium"
        className="w-full h-full !ml-0 hover:bg-gray-3 !rounded-none"
        title="Configuration"
      />
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
        'grid border border-solid border-gray-5 rounded-r-lg',
        className
      )}
    >
      {children.map((child, index) => (
        <div
          key={index}
          className={clsx({
            'border-0 border-b border-solid border-b-gray-5':
              index < children.length - 1,
          })}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
