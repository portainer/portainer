import { SidebarItem as MainComponent } from './SidebarItem';
import { Menu } from './Menu';
import { Wrapper } from './Wrapper';

interface SubComponents {
  Menu: typeof Menu;
  Wrapper: typeof Wrapper;
}

export const SidebarItem: typeof MainComponent & SubComponents =
  MainComponent as typeof MainComponent & SubComponents;

SidebarItem.Menu = Menu;
SidebarItem.Wrapper = Wrapper;
