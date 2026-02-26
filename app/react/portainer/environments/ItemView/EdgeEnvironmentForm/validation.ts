import { object, string, SchemaOf } from 'yup';

import { useNameValidation } from '../../common/NameField/NameField';
import { edgeIntervalsValidation } from '../../common/EdgeIntervalsFieldset/validation';
import { EnvironmentId } from '../../types';
import { metadataValidation } from '../../common/MetadataFieldset/validation';

import { EdgeEnvironmentFormValues } from './types';

/**
 * Create validation schema for Edge environment form.
 * Accepts the original environment name to allow keeping the same name.
 */
export function useEdgeValidation(
  envId: EnvironmentId
): SchemaOf<EdgeEnvironmentFormValues> {
  return object({
    name: useNameValidation(envId),
    publicUrl: string().default(''),
    edge: edgeIntervalsValidation(),
    meta: metadataValidation(),
  });
}
