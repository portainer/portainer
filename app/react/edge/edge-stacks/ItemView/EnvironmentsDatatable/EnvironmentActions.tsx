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
    <div className="space-x-2">
      {environment.Snapshots.length > 0 && (
        <Link
          to="edge.browse.containers"
          params={{ environmentId: environment.Id, edgeStackId }}
          className="!text-inherit hover:!no-underline"
        >
          <Button color="none" title="Browse Snapshot">
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
