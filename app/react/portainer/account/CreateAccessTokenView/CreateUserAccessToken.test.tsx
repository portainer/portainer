import userEvent from '@testing-library/user-event';
import { render, waitFor } from '@testing-library/react';

import { UserViewModel } from '@/portainer/models/user';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { CreateUserAccessToken } from './CreateUserAccessToken';

test('the button is disabled when all fields are blank and enabled when all fields are filled', async () => {
  const { getByRole, getByLabelText } = renderComponent();

  const button = getByRole('button', { name: 'Add access token' });
  await waitFor(() => {
    expect(button).toBeDisabled();
  });

  const descriptionField = getByLabelText(/Description/);
  const passwordField = getByLabelText(/Current password/);

  await userEvent.type(passwordField, 'password');
  await userEvent.type(descriptionField, 'description');

  await waitFor(() => {
    expect(button).toBeEnabled();
  });

  await userEvent.clear(descriptionField);
  await waitFor(() => {
    expect(button).toBeDisabled();
  });
});

function renderComponent() {
  const user = new UserViewModel({
    Username: 'admin',
    Id: 1,
  });

  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(CreateUserAccessToken), user)
  );

  return render(<Wrapped />);
}
