import { http, HttpResponse } from 'msw';
import { SystemInfo, SystemVersion } from 'docker-types/generated/1.41';

export const dockerHandlers = [
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
];
