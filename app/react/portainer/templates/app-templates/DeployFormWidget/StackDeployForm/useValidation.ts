import { useMemo } from 'react';
import { object, array, string } from 'yup';

import { accessControlFormValidation } from '@/react/portainer/access-control/AccessControlForm';
import { useNameValidation } from '@/react/common/stacks/CreateView/NameField';
import { EnvironmentId } from '@/react/portainer/environments/types';

export function useValidation({
  environmentId,
  isAdmin,
}: {
  isAdmin: boolean;
  environmentId: EnvironmentId;
}) {
  const name = useNameValidation(environmentId);

  return useMemo(
    () =>
      object({
        name,
        accessControl: accessControlFormValidation(isAdmin),
        envVars: array()
          .transform((_, orig) => Object.values(orig))
          .of(string().required('Required')),
      }),
    [isAdmin, name]
  );
}
