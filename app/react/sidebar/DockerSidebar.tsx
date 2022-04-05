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
        iconClass: 'fa-object-group fa-fw',
        to: 'docker.swarm',
      }
    : {
        label: 'Host',
        iconClass: 'fa-th fa-fw',
        to: 'docker.host',
      };

  return (
    <>
      <SidebarItem
        to="docker.dashboard"
        params={{ endpointId: environmentId }}
        iconClass="fa-tachometer-alt fa-fw"
        label="Dashboard"
      />

      {!offlineMode && (
        <SidebarItem
          label="App Templates"
          iconClass="fa-rocket fa-fw"
          to="docker.templates"
          params={{ endpointId: environmentId }}
        >
          <SidebarItem
            label="Custom Templates"
            to="docker.templates.custom"
            params={{ endpointId: environmentId }}
          />
        </SidebarItem>
      )}

      {areStacksVisible && (
        <SidebarItem
          to="docker.stacks"
          params={{ endpointId: environmentId }}
          iconClass="fa-th-list fa-fw"
          label="Stacks"
        />
      )}

      {isSwarmManager && (
        <SidebarItem
          to="docker.services"
          params={{ endpointId: environmentId }}
          iconClass="fa-list-alt fa-fw"
          label="Services"
        />
      )}

      <SidebarItem
        to="docker.containers"
        params={{ endpointId: environmentId }}
        iconClass="fa-cubes fa-fw"
        label="Containers"
      />

      <SidebarItem
        to="docker.images"
        params={{ endpointId: environmentId }}
        iconClass="fa-clone fa-fw"
        label="Images"
      />

      <SidebarItem
        to="docker.networks"
        params={{ endpointId: environmentId }}
        iconClass="fa-sitemap fa-fw"
        label="Networks"
      />

      <SidebarItem
        to="docker.volumes"
        params={{ endpointId: environmentId }}
        iconClass="fa-hdd fa-fw"
        label="Volumes"
      />

      {apiVersion >= 1.3 && isSwarmManager && (
        <SidebarItem
          to="docker.configs"
          params={{ endpointId: environmentId }}
          iconClass="fa-file-code fa-fw"
          label="Configs"
        />
      )}

      {apiVersion >= 1.25 && isSwarmManager && (
        <SidebarItem
          to="docker.secrets"
          params={{ endpointId: environmentId }}
          iconClass="fa-user-secret fa-fw"
          label="Secrets"
        />
      )}

      {!isSwarmManager && isAdmin && !offlineMode && (
        <SidebarItem
          to="docker.events"
          params={{ endpointId: environmentId }}
          iconClass="fa-history fa-fw"
          label="Events"
        />
      )}

      <SidebarItem
        label={setupSubMenuProps.label}
        iconClass={setupSubMenuProps.iconClass}
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
