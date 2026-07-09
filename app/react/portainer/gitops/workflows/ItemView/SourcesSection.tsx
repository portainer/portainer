import { GitBranchIcon } from 'lucide-react';

import { Card } from '@@/primitives/Card';
import { Badge } from '@@/Badge';
import { Link } from '@@/Link';

import { StatusBadge } from '../../components/StatusBadge';
import {
  WorkflowSourcesResult,
  WorkflowSourceQuery,
} from '../queries/useWorkflowSources';
import { Dot } from '../ListView/WorkflowSubRow/Block';

interface Props {
  sources: WorkflowSourcesResult;
}

export function SourcesSection({ sources }: Props) {
  return (
    <Card.Container aria-label="Sources">
      <Card.Header
        icon={GitBranchIcon}
        title="Sources"
        actions={<Badge type="muted">{sources.length}</Badge>}
      />
      <ul className="m-0 list-none divide-y divide-solid divide-gray-3 p-0 th-dark:divide-gray-9">
        {sources.map(({ sourceId, query }) => (
          <SourceRow key={sourceId} query={query} />
        ))}
      </ul>
    </Card.Container>
  );
}

function SourceRow({ query }: { query: WorkflowSourceQuery['query'] }) {
  if (query.isLoading) {
    return (
      <li className="animate-pulse px-4 py-3">
        <div className="h-4 w-48 rounded bg-gray-3 th-dark:bg-gray-8" />
      </li>
    );
  }

  const source = query.data;
  if (!source || query.isError) {
    return (
      <li className="flex items-center gap-2 px-4 py-3 text-gray-6">
        <Dot status="unknown" />
        Unknown source
      </li>
    );
  }

  return (
    <li>
      <Link
        to="portainer.gitops.sources.item"
        params={{ sourceId: source.id }}
        data-cy={`workflow-source-link-${source.id}`}
        className="flex items-center gap-4 px-4 py-3 no-underline hover:bg-gray-1 hover:no-underline th-dark:hover:bg-gray-10"
      >
        <StatusBadge status={source.status} />
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate font-semibold text-gray-9 th-highcontrast:text-white th-dark:text-white">
            {source.name}
          </p>
          <p className="m-0 mt-0.5 truncate text-xs text-gray-7 th-highcontrast:text-gray-3 th-dark:text-gray-4">
            {source.url}
          </p>
        </div>
      </Link>
    </li>
  );
}
