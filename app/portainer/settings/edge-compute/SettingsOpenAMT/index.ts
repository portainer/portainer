import { react2angular } from '@/react-tools/react2angular';

import { SettingsOpenAMT } from './SettingsOpenAMT';

const SettingsOpenAMTAngular = react2angular(SettingsOpenAMT, [
  'settings',
  'onSubmit',
]);
export { SettingsOpenAMT, SettingsOpenAMTAngular };
