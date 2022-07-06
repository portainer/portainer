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
      {isOpen && (
        <div className="mb-3">
          <KubectlShellButton environmentId={environmentId} />
        </div>
      )}

      <DashboardLink
        environmentId={environmentId}
        platformPath="kubernetes"
        data-cy="k8sSidebar-dashboard"
      />

      <SidebarItem
        to="kubernetes.templates.custom"
        params={{ endpointId: environmentId }}
        icon={Edit}
        label="Custom Templates"
        data-cy="k8sSidebar-customTemplates"
      />

      <SidebarItem
        to="kubernetes.resourcePools"
        params={{ endpointId: environmentId }}
        icon={Layers}
        label="Namespaces"
        data-cy="k8sSidebar-namespaces"
      />

      <Authorized authorizations="HelmInstallChart">
        <SidebarItem
          to="kubernetes.templates.helm"
          params={{ endpointId: environmentId }}
          icon={Loader}
          label="Helm"
          data-cy="k8sSidebar-helm"
        />
      </Authorized>

      <SidebarItem
        to="kubernetes.applications"
        params={{ endpointId: environmentId }}
        icon={Box}
        label="Applications"
        data-cy="k8sSidebar-applications"
      />

      <SidebarItem
        to="kubernetes.configurations"
        params={{ endpointId: environmentId }}
        icon={Lock}
        label="ConfigMaps & Secrets"
        data-cy="k8sSidebar-configurations"
      />

      <VolumesLink
        environmentId={environmentId}
        platformPath="kubernetes"
        data-cy="k8sSidebar-volumes"
      />

      <SidebarItem
        label="Cluster"
        to="kubernetes.cluster"
        icon={Server}
        params={{ endpointId: environmentId }}
        data-cy="k8sSidebar-cluster"
      >
        <Authorized authorizations="K8sClusterSetupRW" adminOnlyCE>
          <SidebarItem
            to="portainer.k8sendpoint.kubernetesConfig"
            params={{ id: environmentId }}
            label="Setup"
            data-cy="k8sSidebar-setup"
          />
        </Authorized>

        <Authorized authorizations="K8sClusterSetupRW" adminOnlyCE>
          <SidebarItem
            to="portainer.k8sendpoint.securityConstraint"
            params={{ id: environmentId }}
            label="Security constraints"
            data-cy="k8sSidebar-securityConstraints"
          />
        </Authorized>

        <SidebarItem
          to="kubernetes.registries"
          params={{ endpointId: environmentId }}
          label="Registries"
          data-cy="k8sSidebar-registries"
        />
      </SidebarItem>
    </>
  );
}
