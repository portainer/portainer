import { GitBranch, GitCommitIcon, ClockIcon } from 'lucide-react';
import moment from 'moment';
import { useRouter } from '@uirouter/react';

import { notifySuccess } from '@/portainer/services/notifications';

import { Icon } from '@@/Icon';
import { ResourceDetailHeader } from '@@/ResourceDetailHeader/ResourceDetailHeader';
import { HeaderStats } from '@@/ResourceDetailHeader/HeaderStats';
import { ResourceStatBlock } from '@@/ResourceDetailHeader/ResourceStatBlock';
import { DeleteButton } from '@@/buttons/DeleteButton';
import { ActionBarShell } from '@@/ResourceDetailHeader/ActionBarShell';

import { StatusBadge } from '../../components/StatusBadge';
import { SOURCE_TYPES } from '../types';
import { SourceDetail } from '../queries/useSource';
import { useDeleteSourceMutation } from '../queries/useDeleteSourceMutation';

import { TestConnectionButton } from './TestConnectionButton';

interface Props {
  source: SourceDetail;
}

export function SourceResourceHeader({ source }: Props) {
  const typeConfig = source.type ? SOURCE_TYPES[source.type] : undefined;
  const typeIcon = typeConfig?.icon;
  const lastSyncLabel = source.lastSync
    ? moment.unix(source.lastSync).fromNow()
    : '-';

  return (
    <ResourceDetailHeader
      icon={<Icon icon={typeIcon ?? GitBranch} size="xl" />}
      subtitleLabel={typeConfig?.label ?? 'Git'}
      title={source.name}
      badge={<StatusBadge status={source.status} />}
      description={
        !!source.url && (
          <code className="bg-transparent p-0 tracking-widest th-dark:text-gray-6">
            {source.url}
          </code>
        )
      }
      rightInfo={
        <HeaderStats>
          <ResourceStatBlock>
            <ResourceStatBlock.Label icon={<Icon icon={GitCommitIcon} />}>
              Workflows
            </ResourceStatBlock.Label>
            <ResourceStatBlock.Value align="center" size="base">
              {source.usedBy ?? '-'}
            </ResourceStatBlock.Value>
          </ResourceStatBlock>
          <ResourceStatBlock>
            <ResourceStatBlock.Label icon={<Icon icon={ClockIcon} />}>
              Last sync
            </ResourceStatBlock.Label>
            <ResourceStatBlock.Value align="center" size="base">
              {lastSyncLabel}
            </ResourceStatBlock.Value>
          </ResourceStatBlock>
        </HeaderStats>
      }
      actionBar={
        <ActionBarShell>
          <TestConnectionButton
            sourceId={source.id}
            data-cy="source-test-connection-btn"
          />

          <div className="ml-auto">
            <SourceDeleteButton
              sourceId={source.id}
              hasWorkflows={source.usedBy > 0}
            />
          </div>
        </ActionBarShell>
      }
    />
  );
}

function SourceDeleteButton({
  sourceId,
  hasWorkflows,
}: {
  sourceId: SourceDetail['id'];
  hasWorkflows: boolean;
}) {
  const mutation = useDeleteSourceMutation();
  const router = useRouter();

  return (
    <DeleteButton
      confirmMessage="Are you sure you want to delete this Source?"
      data-cy="delete-btn"
      disabled={hasWorkflows}
      onConfirmed={() =>
        mutation.mutate(sourceId, {
          onSuccess() {
            notifySuccess('Success', 'Source deleted');
            router.stateService.go('^');
          },
        })
      }
      isLoading={mutation.isLoading}
    />
  );
}
