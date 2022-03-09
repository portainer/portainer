import { PropsWithChildren } from 'react';

import { Button } from '../Button';
import { Widget, WidgetBody } from '../widget';

interface Props {
  title: string;
  onDismiss?(): void;
  bodyClassName?: string;
  wrapperStyle?: Record<string, string>;
}

export function InformationPanel({
  title,
  onDismiss,
  wrapperStyle,
  bodyClassName,
  children,
}: PropsWithChildren<Props>) {
  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <WidgetBody className={bodyClassName}>
            <div style={wrapperStyle}>
              <div className="col-sm-12 form-section-title">
                <span style={{ float: 'left' }}>{title}</span>
                {!!onDismiss && (
                  <span
                    className="small"
                    style={{ float: 'right' }}
                    ng-if="dismissAction"
                  >
                    <Button color="link" onClick={() => onDismiss()}>
                      <i className="fa fa-times" /> dismiss
                    </Button>
                  </span>
                )}
              </div>
              <div className="form-group">{children}</div>
            </div>
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
