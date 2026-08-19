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
  selectDisabled,
}: {
  item: ApplicationRowData;
  hideStacks: boolean;
  areSecretsRestricted: boolean;
  selectDisabled: boolean;
}) {
  const {
    user: { Username: username },
  } = useCurrentUser();
  const colSpan = hideStacks ? 7 : 8;
  const alignColSpan = selectDisabled ? 1 : 2;

  return (
    <tr className={clsx({ 'secondary-body': !item.KubernetesApplications })}>
      <td colSpan={alignColSpan} />
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
