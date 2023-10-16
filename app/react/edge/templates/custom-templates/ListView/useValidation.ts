import _ from 'lodash';
import { useMemo } from 'react';
import { object, array, number, lazy } from 'yup';

import { EdgeGroup } from '@/react/edge/edge-groups/types';
import { nameValidation } from '@/react/edge/edge-stacks/CreateView/NameField';
import { EdgeStack } from '@/react/edge/edge-stacks/types';
import { VariableDefinition } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField';
import { variablesFieldValidation } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';
import { EnvironmentType } from '@/react/portainer/environments/types';
import { useEdgeGroups } from '@/react/edge/edge-groups/queries/useEdgeGroups';
import { useEdgeStacks } from '@/react/edge/edge-stacks/queries/useEdgeStacks';

import { FormValues } from './types';

export function useValidation(variableDefinitions: VariableDefinition[]) {
  const edgeStacksQuery = useEdgeStacks();
  const edgeGroupsQuery = useEdgeGroups({
    select: (groups) =>
      Object.fromEntries(groups.map((g) => [g.Id, g.EndpointTypes])),
  });

  return useMemo(
    () =>
      validation(
        edgeStacksQuery.data ?? [],
        edgeGroupsQuery.data ?? {},
        variableDefinitions
      ),
    [edgeGroupsQuery.data, edgeStacksQuery.data, variableDefinitions]
  );
}

function validation(
  stacks: EdgeStack[],
  edgeGroupsType: Record<EdgeGroup['Id'], Array<EnvironmentType>>,
  variableDefinitions: VariableDefinition[]
) {
  return lazy((values: FormValues) => {
    const types = getTypes(values.edgeGroupIds);

    return object({
      name: nameValidation(
        stacks,
        types?.includes(EnvironmentType.EdgeAgentOnDocker)
      ),
      edgeGroupIds: array(number().required().default(0))
        .min(1, 'At least one group is required')
        .test(
          'same-type',
          'Groups should be of the same type',
          (value) => _.uniq(getTypes(value)).length === 1
        ),
      variables: variablesFieldValidation(variableDefinitions),
    });
  });

  function getTypes(value: number[] | undefined) {
    return value?.flatMap((g) => edgeGroupsType[g]);
  }
}
