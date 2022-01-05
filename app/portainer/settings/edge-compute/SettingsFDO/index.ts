import { react2angular } from '@/react-tools/react2angular';

import { SettingsFDO } from './SettingsFDO';

const SettingsFDOAngular = react2angular(SettingsFDO, ['settings', 'onSubmit']);
export { SettingsFDO, SettingsFDOAngular };
