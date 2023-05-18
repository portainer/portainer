import { ComponentProps } from 'react';

import { Button } from '@@/buttons';

import { ButtonOptions } from './types';

export function buildConfirmButton(
  label = 'Confirm',
  color: ComponentProps<typeof Button>['color'] = 'primary',
  timeout = 0
): ButtonOptions<true> {
  return { label, color, value: true, timeout };
}

export function buildCancelButton(label = 'Cancel'): ButtonOptions<false> {
  return {
    label,
    color: 'default',
    value: false,
  };
}
