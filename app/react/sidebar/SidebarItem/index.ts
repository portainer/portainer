import { SidebarItem as MainComponent } from './SidebarItem';
import { Icon } from './Icon';
import { Link } from './Link';
import { Menu } from './Menu';
import { Wrapper } from './Wrapper';

interface SubComponents {
  Icon: typeof Icon;
  Link: typeof Link;
  Menu: typeof Menu;
  Wrapper: typeof Wrapper;
}

export const SidebarItem: typeof MainComponent & SubComponents =
  MainComponent as typeof MainComponent & SubComponents;

SidebarItem.Link = Link;
SidebarItem.Icon = Icon;
SidebarItem.Menu = Menu;
SidebarItem.Wrapper = Wrapper;
