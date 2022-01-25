import { react2angular } from '@/react-tools/react2angular';

import { SettingsEdgeCompute } from './SettingsEdgeCompute';

const SettingsEdgeComputeAngular = react2angular(SettingsEdgeCompute, [
  'settings',
  'onSubmit',
]);
export { SettingsEdgeCompute, SettingsEdgeComputeAngular };
