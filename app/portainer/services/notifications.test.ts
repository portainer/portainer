import toastr from 'toastr';

import { suppressConsoleLogs } from '@/setup-tests/suppress-console';

import { notifyError, notifySuccess, notifyWarning } from './notifications';

let restoreConsole: () => void;
beforeEach(() => {
  restoreConsole = suppressConsoleLogs();
});
afterEach(() => {
  restoreConsole();
  vi.resetAllMocks();
});

it('calling success should show success message', () => {
  const title = 'title';
  const text = 'text';

  notifySuccess(title, text);

  expect(toastr.success).toHaveBeenCalledWith(text, title);
});

it('calling error with Error should show error message', () => {
  const title = 'title';
  const errorMessage = 'message';
  const fallback = 'fallback';

  notifyError(title, new Error(errorMessage), fallback);

  expect(toastr.error).toHaveBeenCalledWith(
    errorMessage,
    title,
    expect.anything()
  );
});

it('calling error without Error should show fallback message', () => {
  const title = 'title';

  const fallback = 'fallback';

  notifyError(title, undefined, fallback);

  expect(toastr.error).toHaveBeenCalledWith(fallback, title, expect.anything());
});

it('calling warning should show warning message', () => {
  const title = 'title';
  const text = 'text';

  notifyWarning(title, text);

  expect(toastr.warning).toHaveBeenCalledWith(text, title, expect.anything());
});
