import { SidebarItem as MainComponent } from './SidebarItem';
import { Wrapper } from './Wrapper';

interface SubComponents {
  Wrapper: typeof Wrapper;
}

export const SidebarItem: typeof MainComponent & SubComponents =
  MainComponent as typeof MainComponent & SubComponents;

SidebarItem.Wrapper = Wrapper;
