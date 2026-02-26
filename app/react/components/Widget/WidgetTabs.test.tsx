import { render, screen } from '@testing-library/react';
import { Layers } from 'lucide-react';
import { ReactNode } from 'react';
import { vi } from 'vitest';

import { findSelectedTabIndex, Tab, WidgetTabs } from './WidgetTabs';

// Mock Link component to avoid ui-router relative state resolution in tests
vi.mock('@@/Link', () => ({
  Link: ({
    children,
    'data-cy': dataCy,
    'aria-current': ariaCurrent,
    className,
  }: {
    children: ReactNode;
    'data-cy'?: string;
    'aria-current'?: 'page' | undefined;
    className?: string;
  }) => (
    <a
      data-cy={dataCy}
      aria-current={ariaCurrent}
      className={className}
      href="/"
    >
      {children}
    </a>
  ),
}));

const mockTabs: Tab[] = [
  {
    name: 'Overview',
    widget: <div>Overview content</div>,
    selectedTabParam: 'overview',
  },
  {
    name: 'Details',
    widget: <div>Details content</div>,
    selectedTabParam: 'details',
  },
  {
    name: 'Settings',
    widget: <div>Settings content</div>,
    selectedTabParam: 'settings',
  },
];

function renderWidgetTabs(
  props: Partial<React.ComponentProps<typeof WidgetTabs>> = {}
) {
  const defaultProps = {
    currentTabIndex: 0,
    tabs: mockTabs,
  };

  return render(<WidgetTabs {...defaultProps} {...props} />);
}

describe('WidgetTabs', () => {
  describe('rendering', () => {
    it('renders all tabs and highlights the current tab', () => {
      renderWidgetTabs({ currentTabIndex: 1 });

      // All tabs should be visible
      expect(screen.getByRole('link', { name: 'Overview' })).toBeVisible();
      expect(screen.getByRole('link', { name: 'Details' })).toBeVisible();
      expect(screen.getByRole('link', { name: 'Settings' })).toBeVisible();

      // Only the selected tab should have aria-current="page"
      expect(screen.getByRole('link', { name: 'Details' })).toHaveAttribute(
        'aria-current',
        'page'
      );
      expect(
        screen.getByRole('link', { name: 'Overview' })
      ).not.toHaveAttribute('aria-current');
      expect(
        screen.getByRole('link', { name: 'Settings' })
      ).not.toHaveAttribute('aria-current');
    });

    it('renders tab icons when provided', () => {
      const tabsWithIcons: Tab[] = [
        {
          name: 'Tab 1',
          icon: Layers,
          widget: <div />,
          selectedTabParam: 'tab1',
        },
        { name: 'Tab 2', widget: <div />, selectedTabParam: 'tab2' },
      ];

      renderWidgetTabs({ tabs: tabsWithIcons, currentTabIndex: 0 });

      // Tab with icon should contain an svg (lucide icon)
      const tab1 = screen.getByRole('link', { name: 'Tab 1' });
      expect(tab1.querySelector('svg')).toBeVisible();

      // Tab without icon should not contain an svg
      const tab2 = screen.getByRole('link', { name: 'Tab 2' });
      expect(tab2.querySelector('svg')).toBeNull();
    });

    it('renders without container when useContainer is false', () => {
      const { container } = renderWidgetTabs({ useContainer: false });

      // Should not have the bootstrap row/col wrapper
      expect(container.querySelector('.row')).toBeNull();
      expect(container.querySelector('.col-sm-12')).toBeNull();
    });

    it('renders with container wrapper by default', () => {
      const { container } = renderWidgetTabs();

      // Should have the bootstrap row/col wrapper
      expect(container.querySelector('.row')).toBeVisible();
      expect(container.querySelector('.col-sm-12')).toBeVisible();
    });
  });

  describe('error handling', () => {
    it('throws an error when any tab has an invalid URL-encodable param value', () => {
      // Tabs with characters that change when URL-encoded
      const invalidTabs: Tab[] = [
        {
          name: 'Tab A',
          widget: <div />,
          selectedTabParam: 'param with spaces',
        },
        { name: 'Tab B', widget: <div />, selectedTabParam: 'good-param' },
      ];

      expect(() =>
        renderWidgetTabs({ tabs: invalidTabs, currentTabIndex: 1 })
      ).toThrow('Invalid query param value for tab');
    });
  });

  describe('accessibility', () => {
    it('has accessible navigation landmark with label', () => {
      renderWidgetTabs();

      const nav = screen.getByRole('navigation', {
        name: 'Section navigation',
      });
      expect(nav).toBeVisible();
    });
  });
});

describe('findSelectedTabIndex', () => {
  it('returns the correct index when tab param matches', () => {
    const result = findSelectedTabIndex({ tab: 'details' }, mockTabs);
    expect(result).toBe(1);
  });

  it('returns 0 when tab param does not match any tab', () => {
    const result = findSelectedTabIndex({ tab: 'nonexistent' }, mockTabs);
    expect(result).toBe(0);
  });

  it('returns 0 when params.tab is undefined', () => {
    const result = findSelectedTabIndex({}, mockTabs);
    expect(result).toBe(0);
  });

  it('returns the index of the first tab when params.tab matches first tab', () => {
    const result = findSelectedTabIndex({ tab: 'overview' }, mockTabs);
    expect(result).toBe(0);
  });
});
