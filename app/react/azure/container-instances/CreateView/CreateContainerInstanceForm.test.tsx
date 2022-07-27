import userEvent from '@testing-library/user-event';

import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';
import { renderWithQueryClient } from '@/react-tools/test-utils';

import { CreateContainerInstanceForm } from './CreateContainerInstanceForm';

jest.mock('@uirouter/react', () => ({
  ...jest.requireActual('@uirouter/react'),
  useCurrentStateAndParams: jest.fn(() => ({
    params: { endpointId: 5 },
  })),
}));

test('submit button should be disabled when name or image is missing', async () => {
  const user = new UserViewModel({ Username: 'user' });

  const { findByText, getByText, getByLabelText } = renderWithQueryClient(
    <UserContext.Provider value={{ user }}>
      <CreateContainerInstanceForm />
    </UserContext.Provider>
  );

  await expect(findByText(/Azure settings/)).resolves.toBeVisible();

  const button = getByText(/Deploy the container/);
  expect(button).toBeVisible();
  expect(button).toBeDisabled();

  const nameInput = getByLabelText(/name/i);
  userEvent.type(nameInput, 'name');

  const imageInput = getByLabelText(/image/i);
  userEvent.type(imageInput, 'image');

  await expect(findByText(/Deploy the container/)).resolves.toBeEnabled();

  expect(nameInput).toHaveValue('name');
  userEvent.clear(nameInput);

  await expect(findByText(/Deploy the container/)).resolves.toBeDisabled();
});
