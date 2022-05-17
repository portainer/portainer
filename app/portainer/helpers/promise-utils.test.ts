import { promiseSequence } from './promise-utils';

describe('promiseSequence', () => {
  it('should run successfully for an empty list', async () => {
    await expect(promiseSequence([])).resolves.toBeUndefined();
  });

  it('provided two promise functions, the second should run after the first', async () => {
    const callback = jest.fn();

    function first() {
      return Promise.resolve(callback(1));
    }

    function second() {
      return Promise.resolve(callback(2));
    }

    await promiseSequence([first, second]);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenNthCalledWith(1, 1);
    expect(callback).toHaveBeenNthCalledWith(2, 2);
  });
});
