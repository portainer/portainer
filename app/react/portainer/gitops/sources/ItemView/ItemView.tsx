import { useMemo, useState } from 'react';
import { GitCommit, PenBoxIcon, Settings, UsersIcon } from 'lucide-react';

import { useIdParam } from '@/react/hooks/useIdParam';
import { useCurrentUser } from '@/react/hooks/useUser';

import { PageHeader } from '@@/PageHeader';
import { Tab, WidgetTabs, useCurrentTabIndex } from '@@/Widget/WidgetTabs';
import { ResourceDetailHeaderSkeleton } from '@@/ResourceDetailHeader/ResourceDetailHeaderSkeleton';
import { Alert } from '@@/Alert';
import { Badge } from '@@/Badge';
import { Button } from '@@/buttons';

import { SourceDetail, useSource } from '../queries/useSource';

import { SettingsTab } from './SettingsTab/SettingsTab';
import { WorkflowsTab } from './WorkflowsTab';
import { SourceResourceHeader } from './SourceResourceHeader';
import { CountDot } from './CountDot';
import { AccessTab } from './AccessTab';

const breadcrumbs = [
  { label: 'GitOps Sources', link: 'portainer.gitops.sources' },
  'Source',
];

export function ItemView() {
  const sourceId = useIdParam('sourceId');

  const sourceQuery = useSource(sourceId);
  const source = sourceQuery.data;

  if (sourceQuery.isLoading) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="mx-4 mb-4 space-y-4">
          <ResourceDetailHeaderSkeleton statBlockCount={2} />
        </div>
      </>
    );
  }

  if (!source || sourceQuery.isError) {
    const error = sourceQuery.error;

    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="mx-4 mb-4 space-y-4">
          <Alert color="error">
            Failed loading source:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </Alert>
        </div>
      </>
    );
  }

  return <PageContent source={source} />;
}

function PageContent({ source }: { source: SourceDetail }) {
  const [isEditing, setIsEditing] = useState(false);
  const { isPureAdmin } = useCurrentUser();

  const tabs: Array<Tab & { isEditable?: boolean }> = useMemo(
    () => [
      {
        name: 'Settings',
        icon: Settings,
        widget: (
          <SettingsTab
            source={source}
            isEditing={isEditing}
            onEditingChange={setIsEditing}
          />
        ),
        selectedTabParam: 'settings',
        isEditable: true,
      },
      {
        name: (
          <>
            Workflows{' '}
            <CountDot value={source.workflows?.length ?? 0} type="workflow" />
          </>
        ),
        icon: GitCommit,
        widget: <WorkflowsTab workflows={source.workflows ?? []} />,
        selectedTabParam: 'workflows',
      },
      {
        name: 'Access',
        icon: UsersIcon,
        widget: (
          <AccessTab
            source={source}
            isEditing={isEditing}
            onEditingChange={setIsEditing}
          />
        ),
        selectedTabParam: 'accessTab',
        isEditable: isPureAdmin,
      },
    ],
    [isEditing, isPureAdmin, source]
  );

  const currentTabIndex = useCurrentTabIndex(tabs);
  const isTabEditable = tabs[currentTabIndex]?.isEditable;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'GitOps Sources', link: 'portainer.gitops.sources' },
          source.name,
        ]}
        reload
      />
      <div className="mx-4 space-y-4 pb-4">
        <SourceResourceHeader source={source} />
        <div className="flex items-center gap-2">
          <WidgetTabs
            tabs={tabs}
            currentTabIndex={currentTabIndex}
            useContainer={false}
          />
          <div className="ml-auto">
            {isTabEditable &&
              (isEditing ? (
                <Badge type="info">Editing</Badge>
              ) : (
                <Button
                  icon={PenBoxIcon}
                  color="light"
                  data-cy="edit-settings-button"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              ))}
          </div>
        </div>
        {tabs[currentTabIndex].widget}
      </div>
    </>
  );
}
