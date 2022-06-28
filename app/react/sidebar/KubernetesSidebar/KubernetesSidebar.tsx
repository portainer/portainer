import { Box, Edit, Layers, Loader, Lock, Server } from 'react-feather';

import { EnvironmentId } from '@/portainer/environments/types';
import { Authorized } from '@/portainer/hooks/useUser';

import { DashboardLink } from '../items/DashboardLink';
import { SidebarItem } from '../SidebarItem';
import { VolumesLink } from '../items/VolumesLink';
import { useSidebarState } from '../useSidebarState';

import { KubectlShellButton } from './KubectlShell';

interface Props {
  environmentId: EnvironmentId;
}

export function KubernetesSidebar({ environmentId }: Props) {
  const { isOpen } = useSidebarState();

  return (
    <>
      {isOpen && <KubectlShellButton environmentId={environmentId} />}

      <DashboardLink environmentId={environmentId} platformPath="kubernetes" />

      <SidebarItem
        to="kubernetes.templates.custom"
        params={{ endpointId: environmentId }}
        icon={Edit}
        label="Custom Templates"
      />

      <SidebarItem
        to="kubernetes.resourcePools"
        params={{ endpointId: environmentId }}
        icon={Layers}
        label="Namespaces"
      />

      <Authorized authorizations="HelmInstallChart">
        <SidebarItem
          to="kubernetes.templates.helm"
          params={{ endpointId: environmentId }}
          icon={Loader}
          label="Helm"
        />
      </Authorized>

      <SidebarItem
        to="kubernetes.applications"
        params={{ endpointId: environmentId }}
        icon={Box}
        label="Applications"
      />

      <SidebarItem
        to="kubernetes.configurations"
        params={{ endpointId: environmentId }}
        icon={Lock}
        label="ConfigMaps & Secrets"
      />

      <VolumesLink environmentId={environmentId} platformPath="kubernetes" />

      <SidebarItem
        label="Cluster"
        to="kubernetes.cluster"
        icon={Server}
        params={{ endpointId: environmentId }}
      >
        <Authorized authorizations="K8sClusterSetupRW" adminOnlyCE>
          <SidebarItem
            to="portainer.k8sendpoint.kubernetesConfig"
            params={{ id: environmentId }}
            label="Setup"
          />
        </Authorized>

        <Authorized authorizations="K8sClusterSetupRW" adminOnlyCE>
          <SidebarItem
            to="portainer.k8sendpoint.securityConstraint"
            params={{ id: environmentId }}
            label="Security constraints"
          />
        </Authorized>

        <SidebarItem
          to="kubernetes.registries"
          params={{ endpointId: environmentId }}
          label="Registries"
        />
      </SidebarItem>
    </>
  );
}
