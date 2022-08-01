import { react2angular } from '@/react-tools/react2angular';

import { TemplateListDropdown } from './TemplateListDropdown';

const TemplateListDropdownAngular = react2angular(TemplateListDropdown, [
  'options',
  'onChange',
  'placeholder',
  'value',
]);
export { TemplateListDropdown, TemplateListDropdownAngular };
