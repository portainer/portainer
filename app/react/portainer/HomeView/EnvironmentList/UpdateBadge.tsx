import _ from 'lodash';
import clsx from 'clsx';

import { useSupportedAgentVersions } from '@/react/portainer/environments/update-schedules/queries/useSupportedAgentVersions';

import { Link } from '@@/Link';

export function UpdateBadge() {
  const version = useAgentLatestVersion();

  return (
    <span
      className={clsx(
        'inline-flex h-fit items-center gap-2 rounded-3xl border border-solid border-transparent p-1 font-normal',
        'bg-blue-3 text-blue-8',
        'th-dark:bg-blue-8 th-dark:text-white',
        'th-highcontrast:border-white th-highcontrast:bg-transparent th-highcontrast:text-white'
      )}
    >
      <span className="hidden text-sm 2xl:!inline">
        Update Available: Edge Agent {version}
      </span>
      <Link
        to="portainer.endpoints.updateSchedules.create"
        className={clsx(
          'badge border border-solid border-transparent font-normal',
          'bg-blue-8 text-blue-3',
          'th-dark:bg-blue-3 th-dark:text-blue-8 th-dark:hover:bg-blue-5 th-dark:hover:text-blue-8',
          'th-highcontrast:border-white th-highcontrast:bg-transparent th-highcontrast:text-white th-highcontrast:hover:bg-gray-warm-7 th-highcontrast:hover:text-white'
        )}
      >
        Schedule Update
      </Link>
    </span>
  );
}

function useAgentLatestVersion() {
  const supportedAgentVersionsQuery = useSupportedAgentVersions();

  return _.last(supportedAgentVersionsQuery.data) || '';
}
