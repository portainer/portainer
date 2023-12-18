import userEvent from '@testing-library/user-event';

import { act, renderWithQueryClient } from '@/react-tools/test-utils';
import { UserViewModel } from '@/portainer/models/user';
import { UserContext } from '@/react/hooks/useUser';

import { CreateUserAccessToken } from './CreateUserAccessToken';

test('the button is disabled when description is missing and enabled when description is filled', async () => {
  const queries = renderComponent();

  const button = queries.getByRole('button', { name: 'Add access token' });
  expect(button).toBeDisabled();

  const descriptionField = queries.getByLabelText(/Description/);

  await act(() => userEvent.type(descriptionField, 'description'));
  expect(button).toBeEnabled();

  userEvent.type(descriptionField, 'description');
  expect(button).toBeEnabled();

  // act(() => userEvent.clear(descriptionField));
  // // await act(() => Promise.resolve()); // Flush microtasks used by Formik validation

  // expect(button).toBeDisabled();
});

// test('once the button is clicked, the access token is generated and displayed', async () => {
//   const token = 'a very long access token that should be displayed';

//   const queries = renderComponent();

//   const descriptionField = queries.getByLabelText('Description');

//   userEvent.type(descriptionField, 'description');

//   const button = queries.getByRole('button', { name: 'Add access token' });

//   userEvent.click(button);

//   // expect(onSubmit).toHaveBeenCalledWith('description');
//   // expect(onSubmit).toHaveBeenCalledTimes(1);

//   await expect(queries.findByText('New access token')).resolves.toBeVisible();
//   expect(queries.getByText(token)).toHaveTextContent(token);
// });

function renderComponent() {
  const user = new UserViewModel({ Username: 'user' });

  return renderWithQueryClient(
    <UserContext.Provider value={{ user }}>
      <CreateUserAccessToken />
    </UserContext.Provider>
  );
}
