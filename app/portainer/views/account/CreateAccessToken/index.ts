import { react2angular } from '@/react-tools/react2angular';

import { CreateAccessToken } from './CreateAccessToken';

const CreateAccessTokenAngular = react2angular(CreateAccessToken, [
  'userId',
  'onSubmit',
  'onSuccess',
  'onError',
]);
export { CreateAccessToken, CreateAccessTokenAngular };
