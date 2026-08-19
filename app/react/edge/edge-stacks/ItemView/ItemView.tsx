import { HardDriveIcon, LayersIcon } from 'lucide-react';

import { EditEdgeStackForm } from '@/react/edge/edge-stacks/ItemView/EditEdgeStackForm/EditEdgeStackForm';
import { useIdParam } from '@/react/hooks/useIdParam';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';
import { Alert } from '@@/Alert';
import { Tab, useCurrentTabIndex, WidgetTabs } from '@@/Widget/WidgetTabs';

import { useEdgeStack } from '../queries/useEdgeStack';

import { EnvironmentsDatatable } from './EnvironmentsDatatable';

export function ItemView() {
  const idParam = useIdParam('stackId');
  const edgeStackQuery = useEdgeStack(idParam);

  const stack = edgeStackQuery.data;

  const tabs: Tab[] = [
    {
      name: 'Stack',
      icon: LayersIcon,
      widget: (
        <div className="row">
          <div className="col-sm-12">
            <Widget>
              <Widget.Body loading={edgeStackQuery.isLoading}>
                {edgeStackQuery.isError && (
                  <Alert color="error" title="Error loading edge stack" />
                )}
                {!!stack && <EditEdgeStackForm edgeStack={stack} />}
              </Widget.Body>
            </Widget>
          </div>
        </div>
      ),
      selectedTabParam: 'stack',
    },
    {
      name: 'Environments',
      icon: HardDriveIcon,
      widget: <EnvironmentsDatatable />,
      selectedTabParam: 'environments',
    },
  ];

  const currentTabIndex = useCurrentTabIndex(tabs);

  if (!edgeStackQuery.data) {
    return null;
  }

  return (
    <>
      <PageHeader
        title="Edit Edge stack"
        breadcrumbs={[
          { label: 'Edge Stacks', link: 'edge.stacks' },
          stack?.Name ?? '',
        ]}
        reload
      />

      <WidgetTabs tabs={tabs} currentTabIndex={currentTabIndex} />
      {tabs[currentTabIndex].widget}
    </>
  );
}
