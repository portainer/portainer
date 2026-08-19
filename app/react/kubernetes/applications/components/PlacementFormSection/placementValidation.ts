import { SchemaOf, array, boolean, mixed, object, string } from 'yup';

import { PlacementsFormValues } from './types';

export function placementsValidation(): SchemaOf<PlacementsFormValues> {
  return object({
    placementType: mixed().oneOf(['mandatory', 'preferred']).required(),
    placements: array(
      object({
        label: string().required('Node label is required.'),
        value: string().required('Node value is required.'),
        needsDeletion: boolean(),
      }).required()
    ),
  });
}
