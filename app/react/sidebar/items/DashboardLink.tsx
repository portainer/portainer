import { Layout } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { AutomationTestingProps } from '@/types';

import { SidebarItem } from '../SidebarItem';

interface Props extends AutomationTestingProps {
  environmentId: EnvironmentId;
  platformPath: string;
}

export function DashboardLink({
  environmentId,
  platformPath,
  'data-cy': dataCy,
}: Props) {
  const { t } = useTranslation();

  return (
    <SidebarItem
      to={`${platformPath}.dashboard`}
      params={{ endpointId: environmentId }}
      icon={Layout}
      label={t('common.dashboard')}
      data-cy={dataCy}
    />
  );
}
