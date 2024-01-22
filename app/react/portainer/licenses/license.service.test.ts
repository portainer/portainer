import { http, HttpResponse } from 'msw';

import { server } from '@/setup-tests/server';

import { getLicenses } from './license.service';
import type { License } from './types';

describe('getLicenses', () => {
  it('on success should return the server body', async () => {
    const catchFn = vi.fn();
    const thenFn = vi.fn();

    const data: License[] = [];
    server.use(http.get('/api/licenses', () => HttpResponse.json(data)));

    const promise = getLicenses();

    await promise.then(thenFn).catch(catchFn);

    expect(catchFn).not.toHaveBeenCalled();
    expect(thenFn).toHaveBeenCalledWith(data);
  });

  it('on failure should return the server message', async () => {
    const catchFn = vi.fn();
    const thenFn = vi.fn();

    const message = 'message';
    const details = 'details';

    server.use(
      http.get('/api/licenses', () =>
        HttpResponse.json({ message, details }, { status: 400 })
      )
    );

    const promise = getLicenses();
    await promise.then(thenFn, catchFn);

    expect(catchFn).toHaveBeenCalledWith(new Error(details));
    expect(thenFn).not.toHaveBeenCalled();
  });
});
