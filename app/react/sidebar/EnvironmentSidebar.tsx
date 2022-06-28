import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import { useEffect, useState } from 'react';
import { X } from 'react-feather';

import {
  PlatformType,
  EnvironmentId,
  Environment,
} from '@/portainer/environments/types';
import { getPlatformType } from '@/portainer/environments/utils';
import { useEnvironment } from '@/portainer/environments/queries/useEnvironment';

import { getPlatformIcon } from '../portainer/environments/utils/get-platform-icon';

import { AzureSidebar } from './AzureSidebar';
import { DockerSidebar } from './DockerSidebar';
import { KubernetesSidebar } from './KubernetesSidebar';
import { SidebarSection } from './SidebarSection';
import { useSidebarState } from './useSidebarState';

export function EnvironmentSidebar() {
  const { query: currentEnvironmentQuery, clearEnvironment } =
    useCurrentEnvironment();
  const environment = currentEnvironmentQuery.data;
  if (!environment) {
    return null;
  }

  const platform = getPlatformType(environment.Type);
  const Sidebar = getSidebar(platform);

  return (
    <div className="rounded border border-dotted py-2 be:bg-gray-10 bg-blue-11 be:border-gray-8 border-blue-9">
      <SidebarSection
        title={PlatformType[platform]}
        renderTitle={(className) => (
          <Title
            className={className}
            environment={environment}
            onClear={clearEnvironment}
          />
        )}
      >
        <Sidebar environmentId={environment.Id} environment={environment} />
      </SidebarSection>
    </div>
  );

  function getSidebar(platform: PlatformType) {
    const sidebar: {
      [key in PlatformType]: React.ComponentType<{
        environmentId: EnvironmentId;
        environment: Environment;
      }>;
    } = {
      [PlatformType.Azure]: AzureSidebar,
      [PlatformType.Docker]: DockerSidebar,
      [PlatformType.Kubernetes]: KubernetesSidebar,
    };

    return sidebar[platform];
  }
}

function useCurrentEnvironment() {
  const { params } = useCurrentStateAndParams();
  const router = useRouter();
  const [environmentId, setEnvironmentId] = useState<EnvironmentId>();

  useEffect(() => {
    const environmentId = parseInt(params.endpointId, 10);
    if (params.endpointId && !Number.isNaN(environmentId)) {
      setEnvironmentId(environmentId);
    }
  }, [params.endpointId]);

  return { query: useEnvironment(environmentId), clearEnvironment };

  function clearEnvironment() {
    if (params.endpointId) {
      router.stateService.go('portainer.home');
    }

    setEnvironmentId(undefined);
  }
}

interface TitleProps {
  className: string;
  environment: Environment;
  onClear(): void;
}

function Title({ className, environment, onClear }: TitleProps) {
  const { isOpen } = useSidebarState();
  const EnvironmentIcon = getPlatformIcon(environment.Type);

  if (!isOpen) {
    return (
      <li className="w-full flex justify-center" title={environment.Name}>
        <EnvironmentIcon className="text-2xl" />
      </li>
    );
  }

  return (
    <li className={className}>
      <div className="flex items-center gap-2">
        <span>Environment</span>
        <EnvironmentIcon className="text-2xl" />
        <span className="text-white">{environment.Name}</span>

        <button
          type="button"
          onClick={onClear}
          className="flex items-center justify-center be:bg-gray-9 bg-blue-10 rounded border-0 text-sm h-5 w-5 p-1 ml-auto mr-2 text-gray-5 be:text-gray-6 hover:text-white"
        >
          <X />
        </button>
      </div>
    </li>
  );
}
