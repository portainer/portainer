import { http, HttpResponse } from 'msw';

import { server } from '@/setup-tests/server';

import { getPod } from './getPod';

describe('getPod', () => {
  it('returns pod data when the request succeeds', async () => {
    const podData = {
      metadata: { name: 'my-pod' },
      spec: { nodeName: 'node1' },
    };
    server.use(
      http.get(
        '/api/endpoints/1/kubernetes/api/v1/namespaces/default/pods/my-pod',
        () => HttpResponse.json(podData)
      )
    );

    const result = await getPod(1, 'default', 'my-pod');

    expect(result).toEqual(podData);
  });

  it('throws when the request fails', async () => {
    server.use(
      http.get(
        '/api/endpoints/1/kubernetes/api/v1/namespaces/default/pods/my-pod',
        () =>
          HttpResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
          )
      )
    );

    await expect(getPod(1, 'default', 'my-pod')).rejects.toThrow();
  });
});
