import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import * as featureFlags from '@/react/portainer/feature-flags/feature-flags.service';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';

import { SidebarProvider } from '../useSidebarState';

import { Footer } from './Footer';

vi.mock('./UpdateNotifications', () => ({
  UpdateNotification: () => (
    <div data-cy="update-notification">Update Notification</div>
  ),
}));

vi.mock('./BuildInfoModal', () => ({
  BuildInfoModalButton: () => (
    <button data-cy="build-info-modal-button" type="button">
      Build Info
    </button>
  ),
}));

describe('Footer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CE Footer', () => {
    beforeEach(() => {
      vi.spyOn(featureFlags, 'isBE', 'get').mockReturnValue(false);
    });

    test('should render CE footer with copyright symbol', () => {
      renderComponent();

      expect(screen.getByText('©')).toBeInTheDocument();
    });

    test('should render Portainer Community Edition text', () => {
      renderComponent();

      expect(
        screen.getByText('Portainer Community Edition')
      ).toBeInTheDocument();
    });

    test('should render UpdateNotification component', () => {
      renderComponent();

      expect(screen.getByTestId('update-notification')).toBeInTheDocument();
    });

    test('should render BuildInfoModalButton component', () => {
      renderComponent();

      expect(screen.getByTestId('build-info-modal-button')).toBeInTheDocument();
    });
  });

  describe('BE Footer', () => {
    beforeEach(() => {
      vi.spyOn(featureFlags, 'isBE', 'get').mockReturnValue(true);
    });

    test('should render BE footer with copyright symbol', () => {
      renderComponent();

      expect(screen.getByText('©')).toBeInTheDocument();
    });

    test('should render Portainer Business Edition text', () => {
      renderComponent();

      expect(
        screen.getByText('Portainer Business Edition')
      ).toBeInTheDocument();
    });

    test('should NOT render UpdateNotification component in BE', () => {
      renderComponent();

      expect(
        screen.queryByTestId('update-notification')
      ).not.toBeInTheDocument();
    });

    test('should render BuildInfoModalButton component', () => {
      renderComponent();

      expect(screen.getByTestId('build-info-modal-button')).toBeInTheDocument();
    });
  });

  describe('FooterContent', () => {
    test('should render all child elements in correct order', () => {
      renderComponent();

      const copyrightSymbol = screen.getByText('©');
      const editionText = screen.getByText(
        /Portainer (Community|Business) Edition/
      );
      const buildInfoButton = screen.getByTestId('build-info-modal-button');

      expect(copyrightSymbol).toBeInTheDocument();
      expect(editionText).toBeInTheDocument();
      expect(buildInfoButton).toBeInTheDocument();
    });
  });
});

function renderComponent() {
  const Wrapper = withTestQueryProvider(withUserProvider(Footer));
  return render(
    <SidebarProvider>
      <Wrapper />
    </SidebarProvider>
  );
}
