import { Search } from 'lucide-react';
import { useCurrentStateAndParams } from '@uirouter/react';

import { Environment } from '@/react/portainer/environments/types';

import { Button } from '@@/buttons';
import { Link } from '@@/Link';
import { Icon } from '@@/Icon';

import { LogsActions } from './LogsActions';

interface Props {
  environment: Environment;
}

export function EnvironmentActions({ environment }: Props) {
  const {
    params: { stackId: edgeStackId },
  } = useCurrentStateAndParams();

  return (
    <div>
      {environment.Snapshots.length > 0 && environment.Edge.AsyncMode && (
        <Link
          to="edge.browse.containers"
          params={{ environmentId: environment.Id, edgeStackId }}
          className="hover:!no-underline"
          data-cy="browse-snapshot-link"
        >
          <Button
            color="none"
            title="Browse Snapshot"
            data-cy="browse-snapshot-button"
          >
            <Icon icon={Search} className="searchIcon" />
          </Button>
        </Link>
      )}
      {environment.Edge.AsyncMode && (
        <LogsActions environmentId={environment.Id} edgeStackId={edgeStackId} />
      )}
    </div>
  );
}
