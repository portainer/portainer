import { react2angular } from '@/react-tools/react2angular';

import { CreateAccessToken } from './CreateAccessToken';

const CreateAccessTokenAngular = react2angular(CreateAccessToken, [
  'onSubmit',
  'onError',
]);
export { CreateAccessToken, CreateAccessTokenAngular };
