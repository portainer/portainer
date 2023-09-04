import { DefaultBodyType, PathParams, rest } from 'msw';
import { SystemInfo } from 'docker-types/generated/1.41';

import { VersionResponse } from '@/react/docker/proxy/queries/useVersion';

export const dockerHandlers = [
  rest.get<DefaultBodyType, PathParams, SystemInfo>(
    '/api/endpoints/:endpointId/docker/info',
    (req, res, ctx) =>
      res(
        ctx.json({
          Plugins: { Authorization: [], Log: [], Network: [], Volume: [] },
          MemTotal: 0,
          NCPU: 0,
          Runtimes: { runc: { path: 'runc' } },
        })
      )
  ),
  rest.get<DefaultBodyType, PathParams, VersionResponse>(
    '/api/endpoints/:endpointId/docker/version',
    (req, res, ctx) => res(ctx.json({ ApiVersion: '1.24' }))
  ),
];
