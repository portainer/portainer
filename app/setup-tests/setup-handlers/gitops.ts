import { http, HttpResponse } from 'msw';

import { SourcesSourceDetail } from '@api/types.gen';

export const gitopsHandlers = [
  http.post('/api/gitops/repo/refs', () =>
    HttpResponse.json(['refs/heads/main', 'refs/heads/develop'])
  ),
  http.post('/api/gitops/repo/files/search', () =>
    HttpResponse.json(['docker-compose.yml'])
  ),
  http.get('/api/gitops/sources', () => {
    return HttpResponse.json([], {
      headers: {
        'x-total-count': '0',
        'x-total-available': '0',
      },
    });
  }),
  http.get('/api/gitops/sources/:id', ({ params: { id } }) => {
    return HttpResponse.json<SourcesSourceDetail>({
      id: typeof id === 'string' ? parseInt(id, 10) : 0,
      name: 'source',
      status: 'healthy',
      type: 'git',
      url: 'https://github.com/portainer/portainer',
      connection: {},
    });
  }),
  http.get('/api/gitops/sources/:id/workflows', () => HttpResponse.json([])),
];
