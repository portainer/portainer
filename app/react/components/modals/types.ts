import { ComponentProps } from 'react';

import { Button } from '@@/buttons';

export interface ButtonOptions<TValue = undefined> {
  label: string;
  className?: string;
  color?: ComponentProps<typeof Button>['color'];
  value?: TValue;
  timeout?: number;
}

export interface ButtonsOptions<T> {
  confirm: ButtonOptions<T>;
  cancel?: ButtonOptions<T>;
}

export enum ModalType {
  Warn = 'warning',
  Destructive = 'error',
}
