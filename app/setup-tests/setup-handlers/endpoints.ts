import { http, HttpResponse } from 'msw';

import { createMockEnvironment } from '@/react-tools/test-mocks';

export const endpointsHandlers = [
  http.get('/api/endpoints', () => HttpResponse.json([])),
  http.get('/api/endpoints/agent_versions', () => HttpResponse.json([])),
  http.get('/api/endpoints/:endpointId', ({ params }) =>
    HttpResponse.json(
      createMockEnvironment({ Id: parseInt(params.endpointId as string, 10) })
    )
  ),
  http.get('/api/endpoints/:endpointId/registries', () =>
    HttpResponse.json([])
  ),
  http.get('/api/endpoints/:endpointId/registries/:id', () =>
    HttpResponse.json({})
  ),
];
