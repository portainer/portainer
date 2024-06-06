import { useAuthorizations } from '@/react/hooks/useUser';

import { SensitiveDetails } from './SensitiveDetails';
import { Application, ConfigKind } from './types';

export function ConfigurationDetails({
  item,
  areSecretsRestricted,
  username,
}: {
  item: Application;
  areSecretsRestricted: boolean;
  username: string;
}) {
  const isEnvironmentAdminQuery = useAuthorizations(['K8sResourcePoolsW']);

  const secrets = item.Configurations?.filter(
    (config) => config.Data && config.Kind === ConfigKind.Secret
  );

  if (isEnvironmentAdminQuery.isLoading || !secrets || secrets.length === 0) {
    return null;
  }

  return (
    <>
      <div className="col-xs-12 !px-0 !py-1 text-[13px]"> Secrets </div>
      <table className="w-1/2">
        <tbody>
          <tr>
            <td>
              {secrets.map((secret) =>
                Object.entries(secret.Data || {}).map(([key, value]) => (
                  <SensitiveDetails
                    key={key}
                    name={key}
                    value={value}
                    canSeeValue={canSeeValue(secret)}
                  />
                ))
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );

  function canSeeValue(secret: { ConfigurationOwner: string }) {
    return (
      !areSecretsRestricted ||
      isEnvironmentAdminQuery.authorized ||
      secret.ConfigurationOwner === username
    );
  }
}
