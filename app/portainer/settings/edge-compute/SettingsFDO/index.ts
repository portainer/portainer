import { react2angular } from '@/react-tools/react2angular';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';

import { SettingsFDO } from './SettingsFDO';

const SettingsFDOAngular = react2angular(
  withUIRouter(withReactQuery(SettingsFDO)),
  ['settings', 'onSubmit']
);
export { SettingsFDO, SettingsFDOAngular };
