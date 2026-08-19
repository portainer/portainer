import { r2a } from '@/react-tools/react2angular';

import { SwitchField } from '@@/form-components/SwitchField';

export const switchField = r2a(SwitchField, [
  'tooltip',
  'checked',
  'index',
  'label',
  'name',
  'labelClass',
  'fieldClass',
  'data-cy',
  'disabled',
  'onChange',
  'featureId',
  'switchClass',
  'setTooltipHtmlMessage',
  'valueExplanation',
]);
