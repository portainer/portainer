import { useIdParam } from '@/react/hooks/useIdParam';

import { PageHeader } from '@@/PageHeader';
import { ResourceDetailHeaderSkeleton } from '@@/ResourceDetailHeader/ResourceDetailHeaderSkeleton';
import { Alert } from '@@/Alert';
import { Tab, WidgetTabs, useCurrentTabIndex } from '@@/Widget/WidgetTabs';

import { useWorkflow } from '../queries/useWorkflow';
import { Workflow } from '../types';

import { WorkflowResourceHeader } from './WorkflowResourceHeader';
import { OverviewTab } from './OverviewTab';

const breadcrumbs = [
  { label: 'GitOps Workflows', link: 'portainer.gitops.workflows' },
  'Workflow',
];

export function ItemView() {
  const workflowId = useIdParam('workflowId');

  const workflowQuery = useWorkflow(workflowId);
  const workflow = workflowQuery.data;

  if (workflowQuery.isLoading) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="mx-4 mb-4 space-y-4">
          <ResourceDetailHeaderSkeleton statBlockCount={1} />
        </div>
      </>
    );
  }

  if (!workflow || workflowQuery.isError) {
    const error = workflowQuery.error;

    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="mx-4 mb-4 space-y-4">
          <Alert color="error">
            Failed loading workflow:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </Alert>
        </div>
      </>
    );
  }

  return <PageContent workflow={workflow} />;
}

function PageContent({ workflow }: { workflow: Workflow }) {
  const workflowTabs: Tab[] = [
    {
      name: 'Overview',
      selectedTabParam: 'overview',
      widget: <OverviewTab workflow={workflow} />,
    },
  ];
  const currentTabIndex = useCurrentTabIndex(workflowTabs);

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'GitOps Workflows', link: 'portainer.gitops.workflows' },
          workflow.name,
        ]}
        reload
      />
      <div className="mx-4 space-y-4 pb-4">
        <WorkflowResourceHeader workflow={workflow} />
        <WidgetTabs tabs={workflowTabs} currentTabIndex={currentTabIndex} />
        {workflowTabs[currentTabIndex].widget}
      </div>
    </>
  );
}
