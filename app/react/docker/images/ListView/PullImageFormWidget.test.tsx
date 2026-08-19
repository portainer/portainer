import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { useAuthorizations } from '@/react/hooks/useUser';

import { usePullImageMutation } from '../queries/usePullImageMutation';

import { PullImageFormWidget } from './PullImageFormWidget';

// Mocks
vi.mock(
  '@/react/hooks/useUser',
  async (importOriginal: () => Promise<object>) => {
    const actual = await importOriginal();
    return {
      ...actual,
      useAuthorizations: vi.fn(),
    };
  }
);

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => 1,
}));

vi.mock('@/portainer/services/notifications', () => ({
  notifySuccess: vi.fn(),
}));

vi.mock('../queries/usePullImageMutation', () => ({
  usePullImageMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
  })),
}));

vi.mock('@@/ImageConfigFieldset/getImageConfig', () => ({
  getDefaultImageConfig: () => ({
    image: '',
    registryId: 0,
    useRegistry: false,
  }),
}));

// Mock child components to simplify tests
vi.mock('./PullImageFormWidget.Form', () => ({
  PullImageForm: ({
    isNodeVisible,
    isLoading,
  }: {
    isNodeVisible: boolean;
    isLoading: boolean;
  }) => (
    <form data-cy="pull-image-form">
      <input aria-label="Image name" name="image" data-cy="image-input" />
      {isNodeVisible && (
        <select aria-label="Node" name="node" data-cy="node-selector">
          <option value="">Select a node</option>
          <option value="node1">Node 1</option>
          <option value="node2">Node 2</option>
        </select>
      )}
      <button type="submit" disabled={isLoading} data-cy="pull-image-button">
        {isLoading ? 'Download in progress...' : 'Pull the image'}
      </button>
    </form>
  ),
}));

describe('PullImageFormWidget', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authorization', () => {
    it('should render widget when user has DockerImageCreate authorization', () => {
      vi.mocked(useAuthorizations).mockReturnValue({
        authorized: true,
        isLoading: false,
      });

      renderComponent({ isNodeVisible: false });

      expect(
        screen.getByRole('heading', { name: /pull image/i })
      ).toBeVisible();
      expect(screen.getByTestId('pull-image-form')).toBeVisible();
    });

    it('should not render when user lacks DockerImageCreate authorization', () => {
      vi.mocked(useAuthorizations).mockReturnValue({
        authorized: false,
        isLoading: false,
      });

      renderComponent({ isNodeVisible: false });

      expect(
        screen.queryByRole('heading', { name: /pull image/i })
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('pull-image-form')).not.toBeInTheDocument();
    });
  });

  describe('Form Rendering', () => {
    beforeEach(() => {
      vi.mocked(useAuthorizations).mockReturnValue({
        authorized: true,
        isLoading: false,
      });
    });

    it('should render widget with title "Pull image"', () => {
      renderComponent({ isNodeVisible: false });

      expect(
        screen.getByRole('heading', { name: /pull image/i })
      ).toBeVisible();
    });

    it('should not render NodeSelector when isNodeVisible=false', () => {
      renderComponent({ isNodeVisible: false });

      expect(screen.queryByLabelText(/node/i)).not.toBeInTheDocument();
      expect(screen.queryByTestId('node-selector')).not.toBeInTheDocument();
    });

    it('should render NodeSelector when isNodeVisible=true', () => {
      renderComponent({ isNodeVisible: true });

      expect(screen.getByLabelText(/node/i)).toBeVisible();
      expect(screen.getByTestId('node-selector')).toBeVisible();
    });
  });

  describe('Mutation Hook Setup', () => {
    beforeEach(() => {
      vi.mocked(useAuthorizations).mockReturnValue({
        authorized: true,
        isLoading: false,
      });
    });

    it('should initialize usePullImageMutation with correct environment ID', async () => {
      const mockUsePullImageMutation = vi.mocked(usePullImageMutation);

      renderComponent({ isNodeVisible: false });

      // Verify mutation hook was called with environment ID 1
      expect(mockUsePullImageMutation).toHaveBeenCalledWith(1);
    });

    it('should show loading state during pull operation', async () => {
      vi.mocked(usePullImageMutation).mockReturnValue({
        mutate: vi.fn(),
        isLoading: true,
      } as unknown as ReturnType<typeof usePullImageMutation>);

      renderComponent({ isNodeVisible: false });

      const submitButton = screen.getByRole('button', {
        name: /download in progress/i,
      });
      expect(submitButton).toBeVisible();
      expect(submitButton).toBeDisabled();
    });
  });
});

function renderComponent({ isNodeVisible }: { isNodeVisible: boolean }) {
  const Wrapped = withTestQueryProvider(withTestRouter(PullImageFormWidget));
  return render(<Wrapped isNodeVisible={isNodeVisible} />);
}
