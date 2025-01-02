import { Rocket } from 'lucide-react';
import { PropsWithChildren } from 'react';

import { FallbackImage } from '@@/FallbackImage';
import { Icon } from '@@/Icon';
import { Widget } from '@@/Widget';

import { TemplateNote } from './TemplateNote';

export function DeployWidget({
  logo,
  note,
  title,
  children,
}: PropsWithChildren<{
  logo?: string;
  note?: string;
  title: string;
}>) {
  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <Widget.Title
            icon={
              <FallbackImage src={logo} fallbackIcon={<Icon icon={Rocket} />} />
            }
            title={title}
          />
          <Widget.Body>
            <div className="form-horizontal">
              <TemplateNote note={note} />
              {children}
            </div>
          </Widget.Body>
        </Widget>
      </div>
    </div>
  );
}
