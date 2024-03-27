import { Edit2, Settings } from 'lucide-react';
import { ReactNode } from 'react';
import clsx from 'clsx';

import { useCurrentUser } from '@/react/hooks/useUser';
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
  const { isPureAdmin } = useCurrentUser();

  const isEdgeAsync = checkEdgeAsync(environment);

  const configRoute = getConfigRoute(environment);

  const buttonsClasses = clsx(
    'w-full h-full !ml-0 !rounded-none',
    'hover:bg-gray-3',
    'th-dark:hover:bg-gray-9',
    'th-highcontrast:hover:bg-white th-highcontrast:hover:text-black'
  );

  return (
    <ButtonsGrid className="ml-3 w-11">
      <LinkButton
        disabled={!isPureAdmin}
        to="portainer.endpoints.endpoint"
        params={{ id: environment.Id, redirectTo: 'portainer.home' }}
        color="none"
        icon={Edit2}
        size="medium"
        className={buttonsClasses}
        title="Edit"
        data-cy={`edit-environment-link-${environment.Name}`}
      />

      <LinkButton
        disabled={!configRoute || isEdgeAsync || !isPureAdmin}
        to={configRoute}
        params={{ endpointId: environment.Id }}
        color="none"
        icon={Settings}
        size="medium"
        className={buttonsClasses}
        title="Configuration"
        data-cy={`configure-environment-link-${environment.Name}`}
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
      return 'kubernetes.cluster.setup';
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
        'grid',
        // trace borders but make them transparent so
        // * hovering the env item won't make env box borders clip with the grid borders
        // * hovering the buttons won't make the button's icon flicker
        'rounded-r-lg border border-solid',
        'border-y-transparent border-r-transparent',
        'border-l-gray-5 th-highcontrast:border-l-white th-dark:border-l-gray-9',
        'overflow-hidden',
        className
      )}
    >
      {children.map((child, index) => (
        <div
          key={index}
          className={clsx({
            'border-0 border-b border-solid border-b-gray-5 th-highcontrast:border-b-white th-dark:border-b-gray-9':
              index < children.length - 1,
          })}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
