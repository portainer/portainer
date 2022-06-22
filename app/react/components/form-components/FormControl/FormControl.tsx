import { PropsWithChildren, ReactNode } from 'react';
import clsx from 'clsx';

import { Tooltip } from '@@/Tip/Tooltip';

import { FormError } from '../FormError';

import styles from './FormControl.module.css';

type Size = 'small' | 'medium' | 'large';

export interface Props {
  inputId?: string;
  label: string | ReactNode;
  size?: Size;
  tooltip?: string;
  children: ReactNode;
  errors?: string | ReactNode;
  required?: boolean;
}

export function FormControl({
  inputId,
  label,
  size = 'small',
  tooltip = '',
  children,
  errors,
  required,
}: PropsWithChildren<Props>) {
  return (
    <>
      <div className={clsx('form-group', styles.container)}>
        <label
          htmlFor={inputId}
          className={clsx(sizeClassLabel(size), 'control-label', 'text-left')}
        >
          {label}

          {required && <span className="text-danger">*</span>}

          {tooltip && <Tooltip message={tooltip} />}
        </label>

        <div className={sizeClassChildren(size)}>{children}</div>
      </div>
      {errors && (
        <div className="form-group">
          <div className="col-md-12">
            <FormError>{errors}</FormError>
          </div>
        </div>
      )}
    </>
  );
}

function sizeClassLabel(size?: Size) {
  switch (size) {
    case 'large':
      return 'col-sm-5 col-lg-4';
    case 'medium':
      return 'col-sm-4 col-lg-3';
    default:
      return 'col-sm-3 col-lg-2';
  }
}

function sizeClassChildren(size?: Size) {
  switch (size) {
    case 'large':
      return 'col-sm-7 col-lg-8';
    case 'medium':
      return 'col-sm-8 col-lg-9';
    default:
      return 'col-sm-9 col-lg-10';
  }
}
