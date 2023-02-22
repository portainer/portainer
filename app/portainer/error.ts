export default class PortainerError extends Error {
  err?: Error;

  isPortainerError = true;

  constructor(msg: string, err?: Error) {
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
