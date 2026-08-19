import { AlertTriangle, Code, History, Lock } from 'lucide-react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useEventWarningsCount } from '@/react/kubernetes/queries/useEvents';

import { Badge } from '@@/Badge';
import { Icon } from '@@/Icon';
import { WidgetTabs, useCurrentTabIndex, Tab } from '@@/Widget/WidgetTabs';

import { ResourceEventsDatatable } from '../../../components/EventsDatatable/ResourceEventsDatatable';

import { SecretDetailsWidget } from './SecretDetailsWidget';
import { SecretYAMLWidget } from './SecretYAMLWidget';

type Props = {
  name: string;
  namespace: string;
  secretTypeLabel: string;
  isSystem: boolean;
  registryId?: number | string;
  resourceId?: string;
};

export function SecretItemTabsWidget({
  name,
  namespace,
  secretTypeLabel,
  isSystem,
  registryId,
  resourceId,
}: Props) {
  const environmentId = useEnvironmentId();
  const eventWarningCount = useEventWarningsCount(environmentId, {
    namespace,
    params: { resourceId },
  });

  const tabs: Tab[] = [
    {
      name: 'Secret',
      icon: Lock,
      widget: (
        <SecretDetailsWidget
          name={name}
          namespace={namespace}
          secretTypeLabel={secretTypeLabel}
          isSystem={isSystem}
          registryId={registryId}
        />
      ),
      selectedTabParam: 'secret',
    },
    {
      name: (
        <div className="flex items-center gap-x-2">
          Events
          {eventWarningCount >= 1 && (
            <Badge type="warnSecondary">
              <Icon icon={AlertTriangle} className="!mr-1" />
              {eventWarningCount}
            </Badge>
          )}
        </div>
      ),
      icon: History,
      widget: (
        <ResourceEventsDatatable
          namespace={namespace}
          resourceId={resourceId}
          storageKey="kubernetes.secret.events"
          noWidget={false}
        />
      ),
      selectedTabParam: 'events',
    },
    {
      name: 'YAML',
      icon: Code,
      widget: <SecretYAMLWidget name={name} namespace={namespace} />,
      selectedTabParam: 'YAML',
    },
  ];

  const currentTabIndex = useCurrentTabIndex(tabs);

  return (
    <>
      <WidgetTabs tabs={tabs} currentTabIndex={currentTabIndex} />
      {tabs[currentTabIndex].widget}
    </>
  );
}
