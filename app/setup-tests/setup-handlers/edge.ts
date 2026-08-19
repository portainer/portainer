import { http, HttpResponse } from 'msw';

export const edgeHandlers = [
  http.get('/api/edge_configurations', () => HttpResponse.json([])),
  http.get('/api/edge_configurations/:id', () => HttpResponse.json({})),
  http.get('/api/edge_update_schedules', () => HttpResponse.json([])),
  http.get('/api/edge_update_schedules/:id', () => HttpResponse.json({})),
  http.get('/api/edge_groups', () => HttpResponse.json([])),
  http.get('/api/edge_jobs', () => HttpResponse.json([])),
  http.get('/api/edge_jobs/:id', () => HttpResponse.json({})),
  http.get('/api/edge_jobs/:id/file', () =>
    HttpResponse.json({ FileContent: '' })
  ),
  http.get('/api/edge_stacks', () => HttpResponse.json([])),
  http.get('/api/edge_stacks/:id', () => HttpResponse.json({})),
  http.get('/api/edge_stacks/:id/stagger/status', () =>
    HttpResponse.json({
      status: 'idle',
    })
  ),
  http.get('/api/edge_stacks/:id/file', () =>
    HttpResponse.json({ StackFileContent: '' })
  ),
];
