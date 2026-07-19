import { http, HttpResponse } from 'msw';

import { server } from '@/setup-tests/server';

import { containerStats } from './useContainerStats';

describe('containerStats', () => {
  it('returns stats data on a successful request', async () => {
    const statsData = { read: '2024-01-01T00:00:00Z' };
    server.use(
      http.get('/api/endpoints/1/docker/containers/abc/stats', () =>
        HttpResponse.json(statsData)
      )
    );

    const result = await containerStats(1, 'abc');

    expect(result).toEqual(statsData);
  });

  it('sends X-PortainerAgent-Target header when nodeName is provided', async () => {
    let capturedRequest: Request | undefined;
    server.use(
      http.get(
        '/api/endpoints/1/docker/containers/abc/stats',
        ({ request }) => {
          capturedRequest = request;
          return HttpResponse.json({});
        }
      )
    );

    await containerStats(1, 'abc', 'node1');

    expect(capturedRequest?.headers.get('x-portaineragent-target')).toBe(
      'node1'
    );
  });

  it('does not send X-PortainerAgent-Target header when nodeName is undefined', async () => {
    let capturedRequest: Request | undefined;
    server.use(
      http.get(
        '/api/endpoints/1/docker/containers/abc/stats',
        ({ request }) => {
          capturedRequest = request;
          return HttpResponse.json({});
        }
      )
    );

    await containerStats(1, 'abc', undefined);

    expect(capturedRequest?.headers.get('x-portaineragent-target')).toBeNull();
  });

  it('throws when the request fails', async () => {
    server.use(
      http.get('/api/endpoints/1/docker/containers/abc/stats', () =>
        HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
      )
    );

    await expect(containerStats(1, 'abc')).rejects.toThrow();
  });
});
