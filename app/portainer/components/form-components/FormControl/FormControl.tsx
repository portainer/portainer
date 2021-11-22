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
          className="col-sm-3 col-lg-2 control-label text-left"
        >
          {label}
          {tooltip && <Tooltip message={tooltip} />}
        </label>

        <div className="col-sm-9 col-lg-10">{children}</div>
      </div>

      {errors && (
        <div className="form-group col-md-12">
          <div className="small text-warning">
            <i
              className={clsx('fa fa-exclamation-triangle', styles.spaceRight)}
              aria-hidden="true"
            />
            {errors}
          </div>
        </div>
      )}
    </div>
  );
}
