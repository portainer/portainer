import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CollapseExpandButton } from './CollapseExpandButton';

it('should render the button with the correct icon and title', () => {
  renderCollapseExpandButton();
  const button = screen.getByRole('button');

  expect(button).toBeInTheDocument();
  expect(button).toHaveAttribute('title', 'Expand');
  expect(button).toHaveAttribute('aria-label', 'Expand');
  expect(button).toHaveAttribute('aria-expanded', 'false');
  expect(button.querySelector('svg')).toBeInTheDocument();
});

it('should call the onClick handler when the button is clicked', async () => {
  const onClick = vi.fn();
  const { user } = renderCollapseExpandButton({ onClick });
  const button = screen.getByRole('button');

  await user.click(button);

  expect(onClick).toHaveBeenCalledTimes(1);
});

it('should prevent default and stop propagation when the button is clicked', async () => {
  const user = userEvent.setup();
  const onClick = vi.fn();
  const onOuterClick = vi.fn();

  render(
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div onClick={onOuterClick}>
      <CollapseExpandButton
        onClick={onClick}
        isExpanded={false}
        data-cy="nothing"
      />
    </div>
  );

  const button = screen.getByLabelText('Expand');

  await user.click(button);

  expect(onOuterClick).not.toHaveBeenCalled();
  expect(onClick).toHaveBeenCalled();
});

function renderCollapseExpandButton({
  isExpanded = false,
  onClick = vi.fn(),
}: {
  isExpanded?: boolean;
  onClick?(): void;
} = {}) {
  const user = userEvent.setup();

  render(
    <CollapseExpandButton
      isExpanded={isExpanded}
      data-cy="random"
      onClick={onClick}
    />
  );
  return { user };
}
