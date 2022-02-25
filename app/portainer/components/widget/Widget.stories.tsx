import type { Meta } from '@storybook/react';

import { Widget } from './Widget';
import { WidgetBody } from './WidgetBody';
import { WidgetTitle } from './WidgetTitle';
import { WidgetFooter } from './WidgetFooter';
import { WidgetTaskbar } from './WidgetTaskbar';

interface WidgetProps {
  loading: boolean;
  title: string;
  icon: string;
  bodyText: string;
  footerText: string;
}

const meta: Meta<WidgetProps> = {
  title: 'Widget',
  component: Widget,
  args: {
    loading: false,
    title: 'Title',
    icon: 'fa-rocket',
    bodyText: 'Body',
    footerText: 'Footer',
  },
};

export default meta;

export { Default, WidgetWithCustomImage, WidgetWithTaskBar };

function Default({ loading, bodyText, footerText, icon, title }: WidgetProps) {
  return (
    <Widget>
      <WidgetTitle title={title} icon={icon} />
      <WidgetBody loading={loading}>{bodyText}</WidgetBody>
      <WidgetFooter>{footerText}</WidgetFooter>
    </Widget>
  );
}

function WidgetWithCustomImage({
  loading,
  bodyText,
  footerText,
  icon,
  title,
}: WidgetProps) {
  return (
    <Widget>
      <WidgetTitle
        title={title}
        icon={
          <img
            className="custom-header-ico space-right"
            src={icon}
            alt="header-icon"
          />
        }
      />
      <WidgetBody loading={loading}>{bodyText}</WidgetBody>
      <WidgetFooter>{footerText}</WidgetFooter>
    </Widget>
  );
}

WidgetWithCustomImage.args = {
  icon: 'https://via.placeholder.com/150',
};

function WidgetWithTaskBar({
  loading,
  bodyText,
  footerText,
  icon,
  title,
}: WidgetProps) {
  return (
    <Widget>
      <WidgetTitle title={title} icon={icon} />
      <WidgetTaskbar>
        <button type="button" className="btn btn-primary">
          Button
        </button>
      </WidgetTaskbar>
      <WidgetBody loading={loading}>{bodyText}</WidgetBody>
      <WidgetFooter>{footerText}</WidgetFooter>
    </Widget>
  );
}
