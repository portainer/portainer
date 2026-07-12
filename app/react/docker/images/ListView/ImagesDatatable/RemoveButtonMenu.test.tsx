import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { server } from '@/setup-tests/server';

import { RemoveButtonMenu } from './RemoveButtonMenu';

const {
  mockConfirmDestructive,
  mockNotifySuccess,
  mockNotifyError,
  mockIsAuthorized,
} = vi.hoisted(() => ({
  mockConfirmDestructive: vi.fn(),
  mockNotifySuccess: vi.fn(),
  mockNotifyError: vi.fn(),
  mockIsAuthorized: vi.fn(),
}));

vi.mock('@reach/menu-button', () => ({
  Menu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  MenuButton: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <button type="button" {...(props as object)}>{children}</button>,
  MenuItem: ({
    children,
    onSelect,
  }: {
    children: React.ReactNode;
    onSelect?: () => void;
  }) => (
    <button type="button" onClick={onSelect}>
      {children}
    </button>
  ),
  MenuPopover: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@reach/popover', () => ({
  positionRight: () => ({}),
}));

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { endpointId: '1' },
  })),
}));

vi.mock(
  '@/react/hooks/useUser',
  async (importOriginal: () => Promise<object>) => ({
    ...(await importOriginal()),
    Authorized: ({
      children,
      childrenUnauthorized = null,
    }: {
      children: React.ReactNode;
      childrenUnauthorized?: React.ReactNode;
    }) => (mockIsAuthorized() ? children : childrenUnauthorized),
  })
);

vi.mock('@@/modals/confirm', () => ({
  confirmDestructive: mockConfirmDestructive,
  buildConfirmButton: vi.fn(),
}));

vi.mock('@/portainer/services/notifications', () => ({
  notifySuccess: mockNotifySuccess,
  notifyError: mockNotifyError,
}));

describe('RemoveButtonMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
    mockConfirmDestructive.mockResolvedValue(true);
    mockIsAuthorized.mockReturnValue(true);
  });

  afterEach(() => {
    document.body.querySelectorAll('reach-portal').forEach((el) => el.remove());
  });

  describe('Authorization', () => {
    it('should render when user has DockerImageDelete authorization', () => {
      mockIsAuthorized.mockReturnValue(true);
      renderComponent([{ id: 'sha256:abc' }]);
      expect(
        screen.getByRole('button', { name: /^remove$/i })
      ).toBeVisible();
    });

    it('should not render when user lacks DockerImageDelete authorization', () => {
      mockIsAuthorized.mockReturnValue(false);
      renderComponent([{ id: 'sha256:abc' }]);
      expect(
        screen.queryByRole('button', { name: /^remove$/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Button State', () => {
    it('should disable buttons when no images are selected', () => {
      renderComponent([]);
      expect(
        screen.getByRole('button', { name: /^remove$/i })
      ).toBeDisabled();
    });

    it('should enable buttons when images are selected', () => {
      renderComponent([{ id: 'sha256:abc' }]);
      expect(
        screen.getByRole('button', { name: /^remove$/i })
      ).not.toBeDisabled();
    });
  });

  describe('Remove Flow', () => {
    it('should show confirmation modal when clicked', async () => {
      const user = userEvent.setup();
      renderComponent([{ id: 'sha256:abc' }]);

      await user.click(screen.getByRole('button', { name: /^remove$/i }));

      expect(mockConfirmDestructive).toHaveBeenCalled();
    });

    it('should not call API when user cancels confirmation', async () => {
      mockConfirmDestructive.mockResolvedValue(false);

      let apiCalled = false;
      server.use(
        http.delete('/api/endpoints/:envId/docker/images/:imageId', () => {
          apiCalled = true;
          return HttpResponse.json({});
        })
      );

      const user = userEvent.setup();
      renderComponent([{ id: 'sha256:abc' }]);

      await user.click(screen.getByRole('button', { name: /^remove$/i }));

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      expect(apiCalled).toBe(false);
    });

    it('should show success notification on successful removal', async () => {
      server.use(
        http.delete('/api/endpoints/:envId/docker/images/:imageId', () =>
          HttpResponse.json({})
        )
      );

      const user = userEvent.setup();
      renderComponent([{ id: 'sha256:abc' }]);

      await user.click(screen.getByRole('button', { name: /^remove$/i }));

      await waitFor(() => {
        expect(mockNotifySuccess).toHaveBeenCalledWith(
          'Image successfully removed',
          'sha256:abc'
        );
      });
    });

    it('should send force=false for regular remove', async () => {
      let forceParam = '';
      server.use(
        http.delete(
          '/api/endpoints/:envId/docker/images/:imageId',
          ({ request }) => {
            const url = new URL(request.url);
            forceParam = url.searchParams.get('force') || '';
            return HttpResponse.json({});
          }
        )
      );

      const user = userEvent.setup();
      renderComponent([{ id: 'sha256:abc' }]);

      await user.click(screen.getByRole('button', { name: /^remove$/i }));

      await waitFor(() => {
        expect(mockNotifySuccess).toHaveBeenCalled();
      });

      expect(forceParam).toBe('false');
    });
  });

  describe('Error Handling', () => {
    it('should show error notification when image removal fails with 409 conflict', async () => {
      server.use(
        http.delete('/api/endpoints/:envId/docker/images/:imageId', () =>
          HttpResponse.json(
            { message: 'image is being used by container abc123' },
            { status: 409 }
          )
        )
      );

      const user = userEvent.setup();
      renderComponent([{ id: 'sha256:abc' }]);

      await user.click(screen.getByRole('button', { name: /^remove$/i }));

      await waitFor(() => {
        expect(mockNotifyError).toHaveBeenCalledWith(
          'Failure',
          expect.anything(),
          'Unable to remove image sha256:abc'
        );
      });
    });

    it('should show error notification on 500 server error', async () => {
      server.use(
        http.delete('/api/endpoints/:envId/docker/images/:imageId', () =>
          HttpResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
          )
        )
      );

      const user = userEvent.setup();
      renderComponent([{ id: 'sha256:abc' }]);

      await user.click(screen.getByRole('button', { name: /^remove$/i }));

      await waitFor(() => {
        expect(mockNotifyError).toHaveBeenCalledWith(
          'Failure',
          expect.anything(),
          'Unable to remove image sha256:abc'
        );
      });
    });

    it('should show success for valid images and error for failed ones in batch removal', async () => {
      server.use(
        http.delete(
          '/api/endpoints/:envId/docker/images/:imageId',
          ({ params }) => {
            if (params.imageId === 'sha256:fail') {
              return HttpResponse.json(
                { message: 'image is in use' },
                { status: 409 }
              );
            }
            return HttpResponse.json({});
          }
        )
      );

      const user = userEvent.setup();
      renderComponent([
        { id: 'sha256:ok1' },
        { id: 'sha256:fail' },
        { id: 'sha256:ok2' },
      ]);

      await user.click(screen.getByRole('button', { name: /^remove$/i }));

      await waitFor(() => {
        expect(mockNotifyError).toHaveBeenCalledWith(
          'Failure',
          expect.anything(),
          'Unable to remove image sha256:fail'
        );
      });

      await waitFor(() => {
        expect(mockNotifySuccess).toHaveBeenCalledWith(
          'Image successfully removed',
          'sha256:ok1'
        );
        expect(mockNotifySuccess).toHaveBeenCalledWith(
          'Image successfully removed',
          'sha256:ok2'
        );
      });
    });

    it('should show error for each failed image when multiple images fail', async () => {
      server.use(
        http.delete('/api/endpoints/:envId/docker/images/:imageId', () =>
          HttpResponse.json(
            { message: 'image is in use' },
            { status: 409 }
          )
        )
      );

      const user = userEvent.setup();
      renderComponent([{ id: 'sha256:fail1' }, { id: 'sha256:fail2' }]);

      await user.click(screen.getByRole('button', { name: /^remove$/i }));

      await waitFor(() => {
        expect(mockNotifyError).toHaveBeenCalledWith(
          'Failure',
          expect.anything(),
          'Unable to remove image sha256:fail1'
        );
        expect(mockNotifyError).toHaveBeenCalledWith(
          'Failure',
          expect.anything(),
          'Unable to remove image sha256:fail2'
        );
      });
    });
  });
});

function renderComponent(
  images: Array<{ id: string }> = []
) {
  const imagesWithDefaults = images.map((img) => ({
    id: img.id,
    used: false,
    tags: [],
    created: 0,
    size: 0,
  }));
  const Wrapped = withTestQueryProvider(
    withTestRouter(() => (
      <RemoveButtonMenu selectedItems={imagesWithDefaults} />
    ))
  );
  return render(<Wrapped />);
}
