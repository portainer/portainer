import { CreateClientConfig } from '@api/client.gen';

import axios from './axios';

export function createClientConfig(config: Parameters<CreateClientConfig>[0]) {
  return {
    ...config,
    axios,
  };
}
