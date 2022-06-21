import {
  Box,
  Clock,
  Layers,
  List,
  Lock,
  Share2,
  Shuffle,
  Trello,
  Clipboard,
  Edit,
} from 'react-feather';

import {
  type Environment,
  type EnvironmentId,
  EnvironmentStatus,
} from '@/portainer/environments/types';
import {
  Authorized,
  useUser,
  isEnvironmentAdmin,
} from '@/portainer/hooks/useUser';
import { useInfo, useVersion } from '@/docker/services/system.service';

import { SidebarItem } from './SidebarItem';
import { DashboardLink } from './items/DashboardLink';
import { VolumesLink } from './items/VolumesLink';

interface Props {
  environmentId: EnvironmentId;
  environment: Environment;
}

export function DockerSidebar({ environmentId, environment }: Props) {
  const { user } = useUser();
  const isAdmin = isEnvironmentAdmin(user, environmentId);

  const areStacksVisible =
    isAdmin || environment.SecuritySettings.allowStackManagementForRegularUsers;

  const envInfoQuery = useInfo(
    environmentId,
    (info) => !!info.Swarm?.NodeID && !!info.Swarm?.ControlAvailable
  );

  const envVersionQuery = useVersion(environmentId, (version) =>
    parseFloat(version.ApiVersion)
  );

  const isSwarmManager = envInfoQuery.data;
  const apiVersion = envVersionQuery.data || 0;

  const offlineMode = environment.Status === EnvironmentStatus.Down;

  const setupSubMenuProps = isSwarmManager
    ? {
        label: 'Swarm',
        icon: Trello,
        to: 'docker.swarm',
      }
    : {
        label: 'Host',
        icon: Trello,
        to: 'docker.host',
      };

  return (
    <>
      <DashboardLink environmentId={environmentId} platformPath="docker" />

      <SidebarItem
        label="App Templates"
        icon={Edit}
        to="docker.templates"
        params={{ endpointId: environmentId }}
      >
        <SidebarItem
          label="Custom Templates"
          to="docker.templates.custom"
          params={{ endpointId: environmentId }}
        />
      </SidebarItem>

      {areStacksVisible && (
        <SidebarItem
          to="docker.stacks"
          params={{ endpointId: environmentId }}
          icon={Layers}
          label="Stacks"
        />
      )}

      {isSwarmManager && (
        <SidebarItem
          to="docker.services"
          params={{ endpointId: environmentId }}
          icon={Shuffle}
          label="Services"
        />
      )}

      <SidebarItem
        to="docker.containers"
        params={{ endpointId: environmentId }}
        icon={Box}
        label="Containers"
      />

      <SidebarItem
        to="docker.images"
        params={{ endpointId: environmentId }}
        icon={List}
        label="Images"
      />

      <SidebarItem
        to="docker.networks"
        params={{ endpointId: environmentId }}
        icon={Share2}
        label="Networks"
      />

      <VolumesLink environmentId={environmentId} platformPath="docker" />

      {apiVersion >= 1.3 && isSwarmManager && (
        <SidebarItem
          to="docker.configs"
          params={{ endpointId: environmentId }}
          icon={Clipboard}
          label="Configs"
        />
      )}

      {apiVersion >= 1.25 && isSwarmManager && (
        <SidebarItem
          to="docker.secrets"
          params={{ endpointId: environmentId }}
          icon={Lock}
          label="Secrets"
        />
      )}

      {!isSwarmManager && isAdmin && !offlineMode && (
        <SidebarItem
          to="docker.events"
          params={{ endpointId: environmentId }}
          icon={Clock}
          label="Events"
        />
      )}

      <SidebarItem
        label={setupSubMenuProps.label}
        icon={setupSubMenuProps.icon}
        to={setupSubMenuProps.to}
        params={{ endpointId: environmentId }}
      >
        <Authorized
          authorizations="PortainerEndpointUpdateSettings"
          adminOnlyCE
        >
          <SidebarItem
            to="docker.featuresConfiguration"
            params={{ endpointId: environmentId }}
            label="Setup"
          />
        </Authorized>

        <SidebarItem
          to="docker.registries"
          params={{ endpointId: environmentId }}
          label="Registries"
        />
      </SidebarItem>
    </>
  );
}
