import { react2angular } from '@/react-tools/react2angular';

import { TemplateListFilter } from './TemplateListFilter';

const TemplateListFilterAngular = react2angular(TemplateListFilter, [
  'options',
  'onChange',
  'placeholder',
  'value',
]);
export { TemplateListFilter, TemplateListFilterAngular };
