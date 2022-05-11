import { server, rest } from '@/setup-tests/server';

import { getLicenses } from './license.service';
import type { License } from './types';

describe('getLicenses', () => {
  it('on success should return the server body', async () => {
    const catchFn = jest.fn();
    const thenFn = jest.fn();

    const data: License[] = [];
    server.use(
      rest.get('/api/licenses', (req, res, ctx) => res(ctx.json(data)))
    );

    const promise = getLicenses();

    await promise.then(thenFn).catch(catchFn);

    expect(catchFn).not.toHaveBeenCalled();
    expect(thenFn).toHaveBeenCalledWith(data);
  });

  it('on failure should return the server message', async () => {
    const catchFn = jest.fn();
    const thenFn = jest.fn();

    const message = 'message';
    const details = 'details';

    server.use(
      rest.get('/api/licenses', (req, res, ctx) =>
        res(ctx.status(400), ctx.json({ message, details }))
      )
    );

    const promise = getLicenses();
    await promise.then(thenFn, catchFn);

    expect(catchFn).toHaveBeenCalledWith(new Error(message));
    expect(thenFn).not.toHaveBeenCalled();
  });
});
