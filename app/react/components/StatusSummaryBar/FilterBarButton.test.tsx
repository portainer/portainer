import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FilterBarButton } from './FilterBarButton';

function renderComponent(
  props: Partial<React.ComponentProps<typeof FilterBarButton>> = {}
) {
  const defaultProps: React.ComponentProps<typeof FilterBarButton> = {
    count: 5,
    label: 'Running',
    isSelected: false,
    onClick: vi.fn(),
    name: 'status-filter',
    'data-cy': 'filter-bar-button',
    ...props,
  };

  return {
    ...render(<FilterBarButton {...defaultProps} />),
    props: defaultProps,
  };
}

describe('FilterBarButton', () => {
  it('should render count and label, and call onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderComponent({ onClick, color: 'success' });

    expect(screen.getByText('5')).toBeVisible();
    expect(screen.getByText('Running')).toBeVisible();
    expect(
      screen.getByRole('radio', { name: /filter by running/i })
    ).toBeVisible();

    await user.click(screen.getByText('Running'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('should return null when count is 0', () => {
    const { container } = renderComponent({ count: 0 });
    expect(container).toBeEmptyDOMElement();
  });
});
