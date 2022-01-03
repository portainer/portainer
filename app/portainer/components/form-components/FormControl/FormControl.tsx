import { PropsWithChildren, ReactNode } from 'react';
import clsx from 'clsx';

import { Tooltip } from '@/portainer/components/Tip/Tooltip';

import styles from './FormControl.module.css';

export interface Props {
  inputId: string;
  label: string | ReactNode;
  tooltip?: string;
  children: ReactNode;
  errors?: string | ReactNode;
}

export function FormControl({
  inputId,
  label,
  tooltip = '',
  children,
  errors,
}: PropsWithChildren<Props>) {
  return (
    <div>
      <div className={clsx('form-group', styles.container)}>
        <label
          htmlFor={inputId}
          className="col-sm-4 col-lg-3 control-label text-left"
        >
          {label}
          {tooltip && <Tooltip message={tooltip} />}
        </label>

        <div className="col-sm-8 col-lg-9">{children}</div>
      </div>

      {errors && (
        <div className="form-group col-md-12">
          <div className="small text-warning">
            <i
              className="fa fa-exclamation-triangle space-right"
              aria-hidden="true"
            />
            {errors}
          </div>
        </div>
      )}
    </div>
  );
}
