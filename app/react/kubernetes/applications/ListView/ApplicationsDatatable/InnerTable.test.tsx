import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';

import { InnerTable } from './InnerTable';
import { Application } from './types';

// Mock the necessary hooks
const mockUseEnvironmentId = vi.fn(() => 1);

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => mockUseEnvironmentId(),
}));

describe('InnerTable', () => {
  it('should render all rows from the dataset', () => {
    const mockApplications: Application[] = Array.from(
      { length: 11 },
      (_, index) => ({
        Id: `app-${index}`,
        Name: `Application ${index}`,
        Image: `image-${index}`,
        CreationDate: new Date().toISOString(),
        ResourcePool: 'default',
        ApplicationType: 'Deployment',
        Status: 'Ready',
        TotalPodsCount: 1,
        RunningPodsCount: 1,
        DeploymentType: 'Replicated',
      })
    );

    const Wrapped = withTestQueryProvider(withTestRouter(InnerTable));
    render(<Wrapped dataset={mockApplications} hideStacks={false} />);

    // Verify that all 11 rows are rendered
    const rows = screen.getAllByRole('row');
    // Subtract 1 for the header row
    expect(rows.length - 1).toBe(11);
  });
});
