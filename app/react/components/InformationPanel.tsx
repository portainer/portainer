import { PropsWithChildren } from 'react';

import { Widget, WidgetBody } from './Widget';
import { Button } from './buttons';
import { Icon } from './Icon';

interface Props {
  title?: string;
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
              {title && (
                <div className="col-sm-12 form-section-title">
                  <span style={{ float: 'left' }}>{title}</span>
                  {!!onDismiss && (
                    <span
                      className="small"
                      style={{ float: 'right' }}
                      ng-if="dismissAction"
                    >
                      <Button color="link" onClick={() => onDismiss()}>
                        <Icon icon="x" />
                        dismiss
                      </Button>
                    </span>
                  )}
                </div>
              )}
              <div>{children}</div>
            </div>
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
