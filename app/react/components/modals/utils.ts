import { ComponentProps } from 'react';

import { Button } from '@@/buttons';

import { ButtonOptions } from './types';

export function buildConfirmButton(
  label = 'Confirm',
  color: ComponentProps<typeof Button>['color'] = 'primary',
  timeout = 0,
  dataCy = 'modal-confirm-button'
): ButtonOptions<true> {
  return { label, color, value: true, timeout, dataCy };
}

export function buildCancelButton(
  label = 'Cancel',
  dataCy = 'modal-cancel-button'
): ButtonOptions<false> {
  return {
    label,
    color: 'default',
    value: false,
    dataCy,
  };
}
