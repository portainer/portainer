import { useMemo } from 'react';
import { object, string } from 'yup';

import { accessControlFormValidation } from '@/react/portainer/access-control/AccessControlForm';
import { useNameValidation } from '@/react/common/stacks/CreateView/NameField';
import { variablesFieldValidation } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';
import { VariableDefinition } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField';
import { EnvironmentId } from '@/react/portainer/environments/types';

export function useValidation({
  environmentId,
  isAdmin,
  variableDefs,
  isDeployable,
}: {
  variableDefs: Array<VariableDefinition>;
  isAdmin: boolean;
  environmentId: EnvironmentId;
  isDeployable: boolean;
}) {
  const name = useNameValidation(environmentId);

  return useMemo(
    () =>
      object({
        name: name.test({
          name: 'is-deployable',
          message: 'This template cannot be deployed on this environment',
          test: () => isDeployable,
        }),
        accessControl: accessControlFormValidation(isAdmin),
        fileContent: string().required('Required'),
        variables: variablesFieldValidation(variableDefs),
      }),
    [isAdmin, isDeployable, name, variableDefs]
  );
}
