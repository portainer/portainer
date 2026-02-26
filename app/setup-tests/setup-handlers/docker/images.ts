import { http, HttpResponse } from 'msw';

export const dockerImagesHandlers = [
  http.get('/api/docker/:envId/images', () => HttpResponse.json([])),
  http.get('/api/endpoints/:id/docker/images/json', () =>
    HttpResponse.json([])
  ),
];
