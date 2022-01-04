import { react2angular } from '@/react-tools/react2angular';

import { SettingsEdgeCompute } from './SettingsEdgeCompute';

const SettingsEdgeComputeAngular = react2angular(SettingsEdgeCompute, ['userId', 'onSubmit', 'onSuccess', 'onError']);
export { SettingsEdgeCompute, SettingsEdgeComputeAngular };
