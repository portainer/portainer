import { useMemo } from 'react';
import { SchemaOf, object, string } from 'yup';

import { imageConfigValidation } from '@@/ImageConfigFieldset';

import { FormValues } from './PullImageFormWidget.types';

export function useValidation(
  isDockerhubRateLimited: boolean,
  isNodeVisible: boolean
): SchemaOf<FormValues> {
  return useMemo(
    () =>
      object({
        config: imageConfigValidation().test(
          'rate-limits',
          'Rate limit exceeded',
          () => !isDockerhubRateLimited
        ),
        node: isNodeVisible
          ? string().required('Node is required')
          : string().default(''),
      }),
    [isDockerhubRateLimited, isNodeVisible]
  );
}
