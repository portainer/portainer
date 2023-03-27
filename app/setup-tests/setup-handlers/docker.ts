import { DefaultBodyType, PathParams, rest } from 'msw';

import { InfoResponse } from '@/react/docker/proxy/queries/useInfo';
import { VersionResponse } from '@/react/docker/proxy/queries/useVersion';

export const dockerHandlers = [
  rest.get<DefaultBodyType, PathParams, InfoResponse>(
    '/api/endpoints/:endpointId/docker/info',
    (req, res, ctx) =>
      res(
        ctx.json({
          Plugins: { Authorization: [], Log: [], Network: [], Volume: [] },
        })
      )
  ),
  rest.get<DefaultBodyType, PathParams, VersionResponse>(
    '/api/endpoints/:endpointId/docker/version',
    (req, res, ctx) => res(ctx.json({ ApiVersion: '1.24' }))
  ),
];
