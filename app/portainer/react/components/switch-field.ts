import { r2a } from '@/react-tools/react2angular';

import { SwitchField } from '@@/form-components/SwitchField';

export const switchField = r2a(SwitchField, [
  'tooltip',
  'checked',
  'label',
  'name',
  'labelClass',
  'dataCy',
  'disabled',
  'onChange',
  'featureId',
]);
