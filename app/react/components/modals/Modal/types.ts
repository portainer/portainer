export type OnSubmit<TResult> = (result?: TResult) => void;

export enum ModalType {
  Warn = 'warning',
  Destructive = 'error',
}
