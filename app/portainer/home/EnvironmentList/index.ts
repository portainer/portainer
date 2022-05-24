import { react2angular } from '@/react-tools/react2angular';

import { EnvironmentList } from './EnvironmentList';

export { EnvironmentList };

export const EnvironmentListAngular = react2angular(EnvironmentList, [
  'onClickItem',
  'onRefresh',
]);
