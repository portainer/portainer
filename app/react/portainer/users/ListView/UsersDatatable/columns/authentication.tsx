import { helper } from './helper';

export const authentication = helper.accessor('authMethod', {
  header: 'Authentication',
});
