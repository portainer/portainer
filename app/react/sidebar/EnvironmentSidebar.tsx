import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import { useEffect } from 'react';
import { X, Slash } from 'react-feather';
import clsx from 'clsx';
import angular from 'angular';

import {
  PlatformType,
  EnvironmentId,
  Environment,
} from '@/react/portainer/environments/types';
import { getPlatformType } from '@/react/portainer/environments/utils';
import { useEnvironment } from '@/react/portainer/environments/queries/useEnvironment';
import { useLocalStorage } from '@/portainer/hooks/useLocalStorage';
import { EndpointProvider } from '@/portainer/services/types';

import { getPlatformIcon } from '../portainer/environments/utils/get-platform-icon';

import styles from './EnvironmentSidebar.module.css';
import { AzureSidebar } from './AzureSidebar';
import { DockerSidebar } from './DockerSidebar';
import { KubernetesSidebar } from './KubernetesSidebar';
import { SidebarSection, SidebarSectionTitle } from './SidebarSection';
import { useSidebarState } from './useSidebarState';

export function EnvironmentSidebar() {
  const { query: currentEnvironmentQuery, clearEnvironment } =
    useCurrentEnvironment();
  const environment = currentEnvironmentQuery.data;

  const { isOpen } = useSidebarState();

  if (!isOpen && !environment) {
    return null;
  }

  return (
    <div className={clsx(styles.root, 'rounded border border-dotted py-2')}>
      {environment ? (
        <Content environment={environment} onClear={clearEnvironment} />
      ) : (
        <SidebarSectionTitle>
          <div className="flex items-center gap-1">
            <span>Environment:</span>
            <Slash size="1em" className="text-xl text-gray-6" />
            <span className="text-gray-6 text-sm">None selected</span>
          </div>
        </SidebarSectionTitle>
      )}
    </div>
  );
}

interface ContentProps {
  environment: Environment;
  onClear: () => void;
}

function Content({ environment, onClear }: ContentProps) {
  const platform = getPlatformType(environment.Type);
  const Sidebar = getSidebar(platform);

  return (
    <SidebarSection
      title={<Title environment={environment} onClear={onClear} />}
      aria-label={environment.Name}
      showTitleWhenOpen
    >
      <div className="mt-2">
        <Sidebar environmentId={environment.Id} environment={environment} />
      </div>
    </SidebarSection>
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
  const [environmentId, setEnvironmentId] = useLocalStorage<
    EnvironmentId | undefined
  >('environmentId', undefined, sessionStorage);

  useEffect(() => {
    const environmentId = parseInt(params.endpointId, 10);
    if (params.endpointId && !Number.isNaN(environmentId)) {
      setEnvironmentId(environmentId);
    }
  }, [params.endpointId, setEnvironmentId]);

  return { query: useEnvironment(environmentId), clearEnvironment };

  function clearEnvironment() {
    const $injector = angular.element(document).injector();
    $injector.invoke(
      /* @ngInject */ (EndpointProvider: EndpointProvider) => {
        EndpointProvider.setCurrentEndpoint(undefined);
        if (!params.endpointId) {
          document.title = 'Portainer';
        }
      }
    );

    if (params.endpointId) {
      router.stateService.go('portainer.home');
    }

    setEnvironmentId(undefined);
  }
}

interface TitleProps {
  environment: Environment;
  onClear(): void;
}

function Title({ environment, onClear }: TitleProps) {
  const { isOpen } = useSidebarState();

  const EnvironmentIcon = getPlatformIcon(environment.Type);

  if (!isOpen) {
    return (
      <div className="w-8 flex justify-center -ml-3" title={environment.Name}>
        <EnvironmentIcon className="text-2xl" />
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <EnvironmentIcon className="text-2xl mr-3" />
      <span className="text-white text-ellipsis overflow-hidden whitespace-nowrap">
        {environment.Name}
      </span>

      <button
        title="Clear environment"
        type="button"
        onClick={onClear}
        className={clsx(
          styles.closeBtn,
          'flex items-center justify-center transition-colors duration-200 rounded border-0 text-sm h-5 w-5 p-1 ml-auto mr-2 text-gray-5 be:text-gray-6 hover:text-white be:hover:text-white'
        )}
      >
        <X />
      </button>
    </div>
  );
}
