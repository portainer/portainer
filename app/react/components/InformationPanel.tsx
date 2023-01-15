import { PropsWithChildren } from 'react';
import { X } from 'lucide-react';

import { Widget, WidgetBody } from './Widget';
import { Button } from './buttons';

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
                <div className="form-section-title">
                  <span>{title}</span>
                  {!!onDismiss && (
                    <span className="small" style={{ float: 'right' }}>
                      <Button color="link" icon={X} onClick={() => onDismiss()}>
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
