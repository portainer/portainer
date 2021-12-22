export default class PortainerError extends Error {
  err: Error;

  constructor(msg: string, err: Error) {
    super(msg);
    this.err = err;
  }
}
