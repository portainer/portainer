import { r2a } from '@/react-tools/react2angular';
import { SwitchField } from '@/react/components/form-components/SwitchField';

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
