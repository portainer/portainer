import { useCurrentStateAndParams } from '@uirouter/react';
import { AlertTriangle, Code, Layers, History } from 'lucide-react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { PageHeader } from '@@/PageHeader';
import { findSelectedTabIndex, Tab, WidgetTabs } from '@@/Widget/WidgetTabs';
import { Badge } from '@@/Badge';
import { Icon } from '@@/Icon';

import { useEventWarningsCount } from '../../queries/useEvents';
import { NamespaceYAMLEditor } from '../components/NamespaceYamlEditor';
import { ResourceEventsDatatable } from '../../components/EventsDatatable/ResourceEventsDatatable';

import { UpdateNamespaceForm } from './UpdateNamespaceForm';
import { NamespaceAppsDatatable } from './NamespaceAppsDatatable';

export function NamespaceView() {
  const stateAndParams = useCurrentStateAndParams();
  const {
    params: { id: namespace },
  } = stateAndParams;

  const environmentId = useEnvironmentId();
  const eventWarningCount = useEventWarningsCount(environmentId, namespace);

  const tabs: Tab[] = [
    {
      name: 'Namespace',
      icon: Layers,
      widget: <UpdateNamespaceForm />,
      selectedTabParam: 'namespace',
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
          storageKey="kubernetes.namespace.events"
          noWidget={false}
        />
      ),
      selectedTabParam: 'events',
    },
    {
      name: 'YAML',
      icon: Code,
      widget: <NamespaceYAMLEditor />,
      selectedTabParam: 'YAML',
    },
  ];
  const currentTabIndex = findSelectedTabIndex(stateAndParams, tabs);

  return (
    <>
      <PageHeader
        title="Namespace details"
        breadcrumbs={[
          { label: 'Namespaces', link: 'kubernetes.resourcePools' },
          namespace,
        ]}
        reload
      />
      <>
        <WidgetTabs tabs={tabs} currentTabIndex={currentTabIndex} />
        {tabs[currentTabIndex].widget}
        <NamespaceAppsDatatable namespace={namespace} />
      </>
    </>
  );
}
