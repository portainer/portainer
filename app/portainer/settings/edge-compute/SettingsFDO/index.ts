import { react2angular } from '@/react-tools/react2angular';
import { withReactQuery } from '@/react-tools/withReactQuery';

import { SettingsFDO } from './SettingsFDO';

const SettingsFDOAngular = react2angular(withReactQuery(SettingsFDO), [
  'settings',
  'onSubmit',
]);
export { SettingsFDO, SettingsFDOAngular };
