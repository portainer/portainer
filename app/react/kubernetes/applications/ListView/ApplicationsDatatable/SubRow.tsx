import clsx from 'clsx';

import { useCurrentUser } from '@/react/hooks/useUser';

import { ConfigurationDetails } from './ConfigurationDetails';
import { InnerTable } from './InnerTable';
import { PublishedPorts } from './PublishedPorts';
import { ApplicationRowData } from './types';

export function SubRow({
  item,
  hideStacks,
  areSecretsRestricted,
}: {
  item: ApplicationRowData;
  hideStacks: boolean;
  areSecretsRestricted: boolean;
}) {
  const {
    user: { Username: username },
  } = useCurrentUser();
  const colSpan = hideStacks ? 8 : 9;

  return (
    <tr className={clsx({ 'secondary-body': !item.KubernetesApplications })}>
      <td />
      <td colSpan={colSpan} className="datatable-padding-vertical">
        {item.KubernetesApplications ? (
          <InnerTable
            dataset={item.KubernetesApplications}
            hideStacks={hideStacks}
          />
        ) : (
          <>
            <PublishedPorts item={item} />
            <ConfigurationDetails
              item={item}
              areSecretsRestricted={areSecretsRestricted}
              username={username}
            />
          </>
        )}
      </td>
    </tr>
  );
}
