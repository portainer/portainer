import { r2a } from '@/react-tools/react2angular';

import { CreateTeamForm } from './CreateTeamForm';

export { CreateTeamForm };

export const CreateTeamFormAngular = r2a(CreateTeamForm, [
  'users',
  'actionInProgress',
  'onSubmit',
  'teams',
]);
