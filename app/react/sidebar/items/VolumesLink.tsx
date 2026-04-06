import { Database } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { AutomationTestingProps } from '@/types';

import { SidebarItem } from '../SidebarItem';

interface Props extends AutomationTestingProps {
  environmentId: EnvironmentId;
  platformPath: string;
}

export function VolumesLink({
  environmentId,
  platformPath,
  'data-cy': dataCy,
}: Props) {
  const { t } = useTranslation();

  return (
    <SidebarItem
      to={`${platformPath}.volumes`}
      params={{ endpointId: environmentId }}
      icon={Database}
      label={t('common.volumes')}
      data-cy={dataCy}
    />
  );
}
