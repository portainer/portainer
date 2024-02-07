import { UISref, UIView } from '@uirouter/react';
import { render, screen } from '@testing-library/react';

import { withTestRouter } from '@/react/test-utils/withRouter';

function RelativePathLink() {
  return (
    <UISref to=".custom">
      <span>Link</span>
    </UISref>
  );
}

test.todo('should render a link with relative path', () => {
  const WrappedComponent = withTestRouter(RelativePathLink, {
    stateConfig: [
      {
        name: 'parent',
        url: '/',

        component: () => (
          <>
            <div>parent</div>
            <UIView />
          </>
        ),
      },
      {
        name: 'parent.custom',
        url: 'custom',
      },
    ],
    route: 'parent',
  });

  render(<WrappedComponent />);

  expect(screen.getByText('Link')).toBeInTheDocument();
});
