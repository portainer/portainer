import toastr from 'toastr';

import { error, success, warning } from './notifications';

jest.mock('toastr');

afterEach(() => {
  jest.resetAllMocks();
});

it('calling success should show success message', () => {
  const title = 'title';
  const text = 'text';

  success(title, text);

  expect(toastr.success).toHaveBeenCalledWith(text, title);
});

it('calling error with Error should show error message', () => {
  const consoleErrorFn = jest
    .spyOn(console, 'error')
    .mockImplementation(() => jest.fn());
  const title = 'title';
  const errorMessage = 'message';
  const fallback = 'fallback';

  error(title, new Error(errorMessage), fallback);

  expect(toastr.error).toHaveBeenCalledWith(
    errorMessage,
    title,
    expect.anything()
  );

  consoleErrorFn.mockRestore();
});

it('calling error without Error should show fallback message', () => {
  const consoleErrorFn = jest
    .spyOn(console, 'error')
    .mockImplementation(() => jest.fn());
  const title = 'title';

  const fallback = 'fallback';

  error(title, undefined, fallback);

  expect(toastr.error).toHaveBeenCalledWith(fallback, title, expect.anything());
  consoleErrorFn.mockRestore();
});

it('calling warning should show warning message', () => {
  const title = 'title';
  const text = 'text';

  warning(title, text);

  expect(toastr.warning).toHaveBeenCalledWith(text, title, expect.anything());
});
