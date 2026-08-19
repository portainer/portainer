import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { RestartPolicy } from '../../CreateView/RestartPolicyTab/types';

import { RestartPolicySection } from './RestartPolicySection';

const mockMutate = vi.fn();

vi.mock('./useUpdateRestartPolicyMutation', () => ({
  useUpdateRestartPolicyMutation: () => ({
    mutate: mockMutate,
  }),
}));

function renderComponent(
  props: Partial<React.ComponentProps<typeof RestartPolicySection>> = {}
) {
  const defaultProps: React.ComponentProps<typeof RestartPolicySection> = {
    environmentId: 1,
    containerId: 'test-container-id',
    name: RestartPolicy.No,
    maximumRetryCount: 0,
    ...props,
  };

  const Wrapper = withTestQueryProvider(
    withUserProvider(withTestRouter(RestartPolicySection))
  );

  return render(<Wrapper {...defaultProps} />);
}

describe('RestartPolicySection', () => {
  beforeEach(() => {
    mockMutate.mockReset();
  });

  it('should render with initial policy name', () => {
    renderComponent({ name: RestartPolicy.Always });

    const select = screen.getByTestId('container-restart-policy-select');
    expect(select).toHaveValue('always');
  });

  it('should show retry count input when "on-failure" is selected', async () => {
    const user = userEvent.setup();
    renderComponent({ name: RestartPolicy.No });

    const select = screen.getByTestId('container-restart-policy-select');
    await user.selectOptions(select, 'on-failure');

    expect(
      screen.getByTestId('container-restart-max-retry-input')
    ).toBeVisible();
  });

  it('should hide retry count input for policies other than "on-failure"', () => {
    renderComponent({ name: RestartPolicy.Always });

    expect(
      screen.queryByTestId('container-restart-max-retry-input')
    ).not.toBeInTheDocument();
  });

  it('should call mutation with correct values when update button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent({ name: RestartPolicy.No });

    const select = screen.getByTestId('container-restart-policy-select');
    await user.selectOptions(select, 'always');

    const updateButton = screen.getByTestId(
      'container-restart-policy-update-button'
    );
    await user.click(updateButton);

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        environmentId: 1,
        containerId: 'test-container-id',
        nodeName: undefined,
        policy: {
          name: RestartPolicy.Always,
          maximumRetryCount: 0,
        },
      }),
      expect.anything()
    );
  });

  it('should disable update button when no changes are made', async () => {
    renderComponent({ name: RestartPolicy.Always });

    const updateButton = screen.getByTestId(
      'container-restart-policy-update-button'
    );
    await waitFor(() => {
      expect(updateButton).toBeDisabled();
    });
  });

  it('should include retry count when updating "on-failure" policy', async () => {
    const user = userEvent.setup();
    renderComponent({ name: RestartPolicy.No });

    const select = screen.getByTestId('container-restart-policy-select');
    await user.selectOptions(select, 'on-failure');

    const retryInput = screen.getByTestId('container-restart-max-retry-input');
    await user.clear(retryInput);
    await user.type(retryInput, '5');

    const updateButton = screen.getByTestId(
      'container-restart-policy-update-button'
    );
    await user.click(updateButton);

    expect(mockMutate).toHaveBeenCalledWith(
      {
        environmentId: 1,
        containerId: 'test-container-id',
        nodeName: undefined,
        policy: {
          name: RestartPolicy.OnFailure,
          maximumRetryCount: 5,
        },
      },
      expect.anything()
    );
  });

  it('should call onUpdateSuccess callback when mutation succeeds', async () => {
    const user = userEvent.setup();
    const mockOnUpdateSuccess = vi.fn();

    mockMutate.mockImplementation((_, options) => {
      options.onSuccess();
    });

    renderComponent({
      name: RestartPolicy.No,
      onUpdateSuccess: mockOnUpdateSuccess,
    });

    const select = screen.getByTestId('container-restart-policy-select');
    await user.selectOptions(select, 'always');

    const updateButton = screen.getByTestId(
      'container-restart-policy-update-button'
    );
    await user.click(updateButton);

    await waitFor(() => {
      expect(mockOnUpdateSuccess).toHaveBeenCalledWith({
        name: RestartPolicy.Always,
        maximumRetryCount: 0,
      });
    });
  });
});
