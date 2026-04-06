import { Box } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EnvironmentId } from '@/react/portainer/environments/types';

import { DashboardLink } from '../items/DashboardLink';
import { SidebarItem } from '../SidebarItem';

interface Props {
  environmentId: EnvironmentId;
}

export function AzureSidebar({ environmentId }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <DashboardLink
        environmentId={environmentId}
        platformPath="azure"
        data-cy="azureSidebar-dashboard"
      />
      <SidebarItem
        to="azure.containerinstances"
        params={{ endpointId: environmentId }}
        icon={Box}
        label={t('azure.container_instances')}
        data-cy="azureSidebar-containerInstances"
      />
    </>
  );
}
