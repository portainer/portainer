import { render, screen } from '@testing-library/react';

import { withTestRouter } from '@/react/test-utils/withRouter';

import { Breadcrumbs } from './Breadcrumbs';

function renderBreadcrumbs(
  breadcrumbs: React.ComponentProps<typeof Breadcrumbs>['breadcrumbs']
) {
  const Wrapped = withTestRouter(() => (
    <Breadcrumbs breadcrumbs={breadcrumbs} />
  ));
  return render(<Wrapped />);
}

describe('Breadcrumbs', () => {
  it('should render a home link', () => {
    renderBreadcrumbs([{ label: 'Settings' }]);

    expect(screen.getByTestId('breadcrumb-home')).toBeInTheDocument();
  });

  it('should render each breadcrumb label', () => {
    renderBreadcrumbs([
      { label: 'Settings' },
      { label: 'Environment Groups' },
      { label: 'Production' },
    ]);

    expect(screen.getByText('Settings')).toBeVisible();
    expect(screen.getByText('Environment Groups')).toBeVisible();
    expect(screen.getByText('Production')).toBeVisible();
  });

  it('should render string breadcrumbs', () => {
    renderBreadcrumbs(['Settings', 'Tags']);

    expect(screen.getByText('Settings')).toBeVisible();
    expect(screen.getByText('Tags')).toBeVisible();
  });

  it('should render a single string breadcrumb', () => {
    renderBreadcrumbs('Environments');

    expect(screen.getByText('Environments')).toBeVisible();
  });

  it('should render linked breadcrumbs with data-cy', () => {
    renderBreadcrumbs([
      { label: 'Settings', link: 'portainer.settings' },
      { label: 'Groups' },
    ]);

    expect(screen.getByTestId('breadcrumb-Settings')).toBeInTheDocument();
  });
});
