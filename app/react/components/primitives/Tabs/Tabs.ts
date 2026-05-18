import { TabsContainer } from './TabsContainer';
import { TabItem } from './TabsItem';

/**
 * Low-level tab group. Compose with `Tabs.Container` for the tab bar and `Tabs.Item` for each
 * tab button. Use `variant="pill"` for a floating pill style or `"contained"` (default) for a
 * segmented control look. Context from `TabsContainer` auto-applies variant and size to items.
 *
 * @example
 * <Tabs.Container variant="contained" aria-label="View mode">
 *   <Tabs.Item isActive={view === 'list'} onClick={() => setView('list')}>List</Tabs.Item>
 *   <Tabs.Item isActive={view === 'grid'} onClick={() => setView('grid')}>Grid</Tabs.Item>
 * </Tabs.Container>
 */
export const Tabs = {
  Container: TabsContainer,
  Item: TabItem,
};
