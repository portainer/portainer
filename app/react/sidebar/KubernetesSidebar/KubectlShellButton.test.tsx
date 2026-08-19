import { render, fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { PropsWithChildren, useMemo } from 'react';

import { Context } from '../useSidebarState';

import { KubectlShellButton } from './KubectlShellButton';

vi.mock('@/portainer/helpers/pathHelper', () => ({
  baseHref: vi.fn().mockReturnValue('/portainer'),
}));

const mockWindowOpen = vi.fn();
const originalWindowOpen = window.open;

beforeEach(() => {
  window.open = mockWindowOpen;
  mockWindowOpen.mockClear();
});

afterEach(() => {
  window.open = originalWindowOpen;
});

function MockSidebarProvider({
  children,
  isOpen = true,
}: PropsWithChildren<{ isOpen?: boolean }>) {
  const state = useMemo(() => ({ isOpen, toggle: vi.fn() }), [isOpen]);

  return <Context.Provider value={state}>{children}</Context.Provider>;
}

function renderComponent(environmentId = 1, isSidebarOpen = true) {
  return render(
    <MockSidebarProvider isOpen={isSidebarOpen}>
      <KubectlShellButton environmentId={environmentId} />
    </MockSidebarProvider>
  );
}

describe('KubectlShellButton', () => {
  test('should render button with text when sidebar is open', () => {
    renderComponent();

    const button = screen.getByTestId('k8sSidebar-shellButton');
    expect(button).toBeVisible();
    expect(button).toHaveTextContent('kubectl shell');
  });

  test('should render button without text when sidebar is closed', () => {
    renderComponent(1, false);

    const button = screen.getByTestId('k8sSidebar-shellButton');
    expect(button).toBeVisible();
    expect(button).not.toHaveTextContent('kubectl shell');
    expect(button).toHaveClass('!p-1');
  });

  test('should wrap button in tooltip when sidebar is closed', () => {
    renderComponent(1, false);

    // When sidebar is closed, the button is wrapped in a span with flex classes
    const button = screen.getByTestId('k8sSidebar-shellButton');
    const wrapperSpan = button.parentElement;
    expect(wrapperSpan).toHaveClass('flex', 'w-full', 'justify-center');

    // The button should have the !p-1 class when sidebar is closed
    expect(button).toHaveClass('!p-1');
  });

  test('should open new window with correct URL when button is clicked', () => {
    const environmentId = 5;
    renderComponent(environmentId);

    const button = screen.getByTestId('k8sSidebar-shellButton');
    fireEvent.click(button);

    expect(mockWindowOpen).toHaveBeenCalledTimes(1);
    const [url, windowName, windowFeatures] = mockWindowOpen.mock.calls[0];

    expect(url).toBe(
      `${window.location.origin}/portainer#!/${environmentId}/kubernetes/kubectl-shell`
    );
    expect(windowName).toMatch(/^kubectl-shell-5-[a-f0-9-]+$/);
    expect(windowFeatures).toBe('width=800,height=600');
  });

  test('should generate unique window names for multiple clicks', () => {
    renderComponent();

    const button = screen.getByRole('button');

    // Click multiple times
    fireEvent.click(button);
    fireEvent.click(button);

    expect(mockWindowOpen).toHaveBeenCalledTimes(2);

    const windowName1 = mockWindowOpen.mock.calls[0][1];
    const windowName2 = mockWindowOpen.mock.calls[1][1];

    expect(windowName1).not.toBe(windowName2);
  });
});
