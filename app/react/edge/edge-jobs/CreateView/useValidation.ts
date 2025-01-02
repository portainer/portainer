import {
  SchemaOf,
  array,
  boolean,
  date,
  mixed,
  number,
  object,
  string,
} from 'yup';
import { useMemo } from 'react';

import { file } from '@@/form-components/yup-file-validation';

import { useNameValidation } from '../components/EdgeJobForm/NameField';
import { cronValidation } from '../components/EdgeJobForm/AdvancedCronFieldset';
import { timeOptions } from '../components/EdgeJobForm/RecurringFieldset';

import { FormValues } from './types';

export function useValidation(): SchemaOf<FormValues> {
  const nameValidation = useNameValidation();
  return useMemo(
    () =>
      object({
        name: nameValidation,
        recurring: boolean().default(false),
        cronExpression: string().default('').when('cronMethod', {
          is: 'advanced',
          then: cronValidation().required(),
        }),
        edgeGroupIds: array(number().required()),
        environmentIds: array(number().required()),

        method: mixed<'editor' | 'upload'>()
          .oneOf(['editor', 'upload'])
          .default('editor'),
        file: file().when('method', {
          is: 'upload',
          then: object().required('This field is required.'),
        }),
        fileContent: string()
          .default('')
          .when('method', {
            is: 'editor',
            then: (schema) => schema.required('This field is required.'),
          }),

        cronMethod: mixed<'basic' | 'advanced'>()
          .oneOf(['basic', 'advanced'])
          .default('basic'),
        dateTime: date()
          .default(new Date())
          .when(['recurring', 'cronMethod'], {
            is: (recurring: boolean, cronMethod: 'basic' | 'advanced') =>
              !recurring && cronMethod === 'basic',
            then: (schema) => schema.required('This field is required.'),
          }),
        recurringOption: mixed()
          .oneOf(timeOptions.map((o) => o.value))
          .when(['recurring', 'cronMethod'], {
            is: (recurring: boolean, cronMethod: 'basic' | 'advanced') =>
              recurring && cronMethod === 'basic',
            then: (schema) => schema.required('This field is required.'),
          }),
      }),
    [nameValidation]
  );
}
