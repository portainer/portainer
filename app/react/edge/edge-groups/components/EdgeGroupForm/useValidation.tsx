import { SchemaOf, array, boolean, number, object, string } from 'yup';
import { useMemo } from 'react';

import { useEdgeGroups } from '../../queries/useEdgeGroups';

import { FormValues } from './types';

export function useValidation(): SchemaOf<FormValues> {
  const edgeGroupsQuery = useEdgeGroups();

  return useMemo(
    () =>
      object({
        name: string()
          .required('Name is required')
          .test({
            name: 'is-unique',
            test: (value) =>
              !edgeGroupsQuery.data?.find((group) => group.Name === value),
            message: 'Name must be unique',
          }),
        dynamic: boolean().default(false),
        environmentIds: array(number().required()),
        partialMatch: boolean().default(false),
        tagIds: array(number().required()).when('dynamic', {
          is: true,
          then: (schema) => schema.min(1, 'Tags are required'),
        }),
      }),
    [edgeGroupsQuery.data]
  );
}
