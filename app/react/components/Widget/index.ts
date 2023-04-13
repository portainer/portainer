import { Widget as MainComponent } from './Widget';
import { WidgetBody } from './WidgetBody';
import { WidgetFooter } from './WidgetFooter';
import { WidgetTitle } from './WidgetTitle';
import { WidgetTaskbar } from './WidgetTaskbar';
import { Loading } from './Loading';
import { WidgetTabs } from './WidgetTabs';

interface WithSubcomponents {
  Body: typeof WidgetBody;
  Footer: typeof WidgetFooter;
  Title: typeof WidgetTitle;
  Tabs: typeof WidgetTabs;
  Taskbar: typeof WidgetTaskbar;
  Loading: typeof Loading;
}

const Widget = MainComponent as typeof MainComponent & WithSubcomponents;

Widget.Body = WidgetBody;
Widget.Footer = WidgetFooter;
Widget.Title = WidgetTitle;
Widget.Tabs = WidgetTabs;
Widget.Taskbar = WidgetTaskbar;
Widget.Loading = Loading;

export {
  Widget,
  WidgetBody,
  WidgetFooter,
  WidgetTitle,
  WidgetTabs,
  WidgetTaskbar,
  Loading,
};
