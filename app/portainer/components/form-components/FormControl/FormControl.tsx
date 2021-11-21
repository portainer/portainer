import { PropsWithChildren, ReactNode } from 'react';

import { Tooltip } from '@/portainer/components/Tip/Tooltip';

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
      <div className="form-group">
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
          <div className="small text-warning">{errors}</div>
        </div>
      )}
    </div>
  );
}
