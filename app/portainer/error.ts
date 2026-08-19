export default class PortainerError extends Error {
  err?: unknown;

  isPortainerError = true;

  constructor(msg: string, err?: unknown) {
    super(msg);
    this.err = err;
  }
}

export function isPortainerError(error: unknown): error is PortainerError {
  return (
    !!error &&
    typeof error === 'object' &&
    'isPortainerError' in error &&
    (error as PortainerError).isPortainerError
  );
}
