import { react2angular } from '@/react-tools/react2angular';

import { TemplateListSort } from './TemplateListSort';

const TemplateListSortAngular = react2angular(TemplateListSort, [
  'options',
  'onChange',
  'onDescending',
  'placeholder',
  'sortByDescending',
  'sortByButton',
  'value',
]);
export { TemplateListSort, TemplateListSortAngular };
