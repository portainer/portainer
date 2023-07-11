import clsx from 'clsx';

import { Link } from '@@/Link';

import { EdgeStack, StatusType } from '../../types';

import styles from './DeploymentCounter.module.css';

export function DeploymentCounterLink({
  count,
  type,
  stackId,
}: {
  count: number;
  type: StatusType;
  stackId: EdgeStack['Id'];
}) {
  return (
    <div className="text-center">
      <Link
        className="hover:no-underline"
        to="edge.stacks.edit"
        params={{ stackId, tab: 1, status: type }}
      >
        <DeploymentCounter count={count} type={type} />
      </Link>
    </div>
  );
}

export function DeploymentCounter({
  count,
  type,
}: {
  count: number;
  type?: StatusType;
}) {
  return (
    <span
      className={clsx(styles.root, {
        [styles.statusOk]: type === 'Ok',
        [styles.statusError]: type === 'Error',
        [styles.statusAcknowledged]: type === 'Acknowledged',
        [styles.statusImagesPulled]: type === 'ImagesPulled',
        [styles.statusTotal]: type === undefined,
      })}
    >
      &bull; {count}
    </span>
  );
}
