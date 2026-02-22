import { http, HttpResponse } from 'msw';
import { SystemInfo, SystemVersion } from 'docker-types';

import { dockerImagesHandlers } from './docker/images';

export const dockerHandlers = [
  ...dockerImagesHandlers,
  http.get<never, never, SystemInfo>(
    '/api/endpoints/:endpointId/docker/info',
    () =>
      HttpResponse.json({
        Plugins: { Authorization: [], Log: [], Network: [], Volume: [] },
        MemTotal: 0,
        NCPU: 0,
        Runtimes: { runc: { path: 'runc' } },
      })
  ),
  http.get<never, never, SystemVersion>(
    '/api/endpoints/:endpointId/docker/version',
    () => HttpResponse.json({ ApiVersion: '1.24' })
  ),
  http.get('/api/endpoints/:endpointId/docker/containers/json', () =>
    HttpResponse.json([])
  ),
  http.get('/api/endpoints/:endpointId/docker/networks', () =>
    HttpResponse.json([])
  ),
];
