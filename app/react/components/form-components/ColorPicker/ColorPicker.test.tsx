import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ColorPicker } from './ColorPicker';

describe('ColorPicker', () => {
  it('renders with initial value and shows text input', () => {
    render(
      <ColorPicker value="#3c8dbc" onChange={() => {}} data-cy="color-picker" />
    );

    expect(screen.getByPlaceholderText('e.g. #ffbbbb')).toBeVisible();
    expect(screen.getByPlaceholderText('e.g. #ffbbbb')).toHaveValue('#3c8dbc');
    expect(screen.getByLabelText('Choose color')).toBeVisible();
  });

  it('calls onChange when user enters valid hex in text input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ColorPicker value="#000000" onChange={onChange} data-cy="color-picker" />
    );

    const input = screen.getByPlaceholderText('e.g. #ffbbbb');
    await user.clear(input);
    await user.type(input, 'ff5500');

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('#ff5500');
    });
  });

  it('calls onChange with expanded hex when user enters 3-digit shorthand', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ColorPicker value="#000000" onChange={onChange} data-cy="color-picker" />
    );

    const input = screen.getByPlaceholderText('e.g. #ffbbbb');
    await user.clear(input);
    await user.type(input, 'f50');

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('#ff5500');
    });
  });

  it('reverts text input to committed value on blur when input is invalid', async () => {
    const user = userEvent.setup();

    render(
      <ColorPicker value="#3c8dbc" onChange={() => {}} data-cy="color-picker" />
    );

    const input = screen.getByPlaceholderText('e.g. #ffbbbb');
    await user.clear(input);
    await user.type(input, 'xx');
    expect(input).toHaveValue('#xx');

    await user.tab();
    expect(input).toHaveValue('#3c8dbc');
  });
});
