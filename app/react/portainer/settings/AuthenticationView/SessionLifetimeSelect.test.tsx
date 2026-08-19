import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SessionLifetimeSelect } from './SessionLifetimeSelect';

describe('SessionLifetimeSelect', () => {
  test('should render with the correct label and tooltip', () => {
    const onChange = vi.fn();
    render(<SessionLifetimeSelect value="1h" onChange={onChange} />);

    expect(screen.getByLabelText('Session lifetime')).toBeInTheDocument();
  });

  test('should call onChange when selecting a new value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SessionLifetimeSelect value="1h" onChange={onChange} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, '8h');

    expect(onChange).toHaveBeenCalledWith('8h');
  });
});
