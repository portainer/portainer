import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';

import { useIsSwarmAgent } from '../../proxy/queries/useIsSwarmAgent';

import { ListView } from './ListView';

vi.mock('../../proxy/queries/useIsSwarmAgent');
vi.mock('./PullImageFormWidget', () => ({
  PullImageFormWidget: ({ isNodeVisible }: { isNodeVisible: boolean }) => (
    <div data-cy="pull-image-form-widget">
      PullImageFormWidget - isNodeVisible: {String(isNodeVisible)}
    </div>
  ),
}));
vi.mock('./ImagesDatatable/ImagesDatatable', () => ({
  ImagesDatatable: ({
    isHostColumnVisible,
  }: {
    isHostColumnVisible: boolean;
  }) => (
    <div data-cy="images-datatable">
      ImagesDatatable - isHostColumnVisible: {String(isHostColumnVisible)}
    </div>
  ),
}));

describe('ListView', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Rendering', () => {
    it('should render all main sections', async () => {
      vi.mocked(useIsSwarmAgent).mockReturnValue(false);

      renderComponent();

      // PageHeader with title
      expect(
        screen.getByRole('heading', { name: /image list/i })
      ).toBeVisible();

      // PullImageFormWidget
      expect(screen.getByTestId('pull-image-form-widget')).toBeVisible();

      // ImagesDatatable
      expect(screen.getByTestId('images-datatable')).toBeVisible();
    });
  });

  describe('Swarm Agent Integration', () => {
    it('should pass isNodeVisible=false to child components when not swarm agent', async () => {
      vi.mocked(useIsSwarmAgent).mockReturnValue(false);

      renderComponent();

      // Verify PullImageFormWidget receives isNodeVisible={false}
      expect(screen.getByTestId('pull-image-form-widget')).toHaveTextContent(
        'isNodeVisible: false'
      );

      // Verify ImagesDatatable receives isHostColumnVisible={false}
      expect(screen.getByTestId('images-datatable')).toHaveTextContent(
        'isHostColumnVisible: false'
      );
    });

    it('should pass isNodeVisible=true to child components when swarm agent', async () => {
      vi.mocked(useIsSwarmAgent).mockReturnValue(true);

      renderComponent();

      // Verify PullImageFormWidget receives isNodeVisible={true}
      expect(screen.getByTestId('pull-image-form-widget')).toHaveTextContent(
        'isNodeVisible: true'
      );

      // Verify ImagesDatatable receives isHostColumnVisible={true}
      expect(screen.getByTestId('images-datatable')).toHaveTextContent(
        'isHostColumnVisible: true'
      );
    });
  });
});

function renderComponent() {
  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(ListView))
  );
  return render(<Wrapped />);
}
