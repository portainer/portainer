import userEvent from '@testing-library/user-event';

import { render } from '@/react-tools/test-utils';

import { CreateAccessToken } from './CreateAccessToken';

test('the button is disabled when description is missing and enabled when description is filled', async () => {
  const queries = renderComponent();

  const button = queries.getByRole('button', { name: 'Add access token' });

  expect(button).toBeDisabled();

  const descriptionField = queries.getByLabelText('Description');

  userEvent.type(descriptionField, 'description');

  expect(button).toBeEnabled();

  userEvent.clear(descriptionField);

  expect(button).toBeDisabled();
});

test('once the button is clicked, the access token is generated and displayed', async () => {
  const token = 'a very long access token that should be displayed';
  const onSubmit = jest.fn(() => Promise.resolve({ rawAPIKey: token }));

  const queries = renderComponent(onSubmit);

  const descriptionField = queries.getByLabelText('Description');

  userEvent.type(descriptionField, 'description');

  const button = queries.getByRole('button', { name: 'Add access token' });

  userEvent.click(button);

  expect(onSubmit).toHaveBeenCalledWith('description');
  expect(onSubmit).toHaveBeenCalledTimes(1);

  await expect(queries.findByText('New access token')).resolves.toBeVisible();
  expect(queries.getByText(token)).toHaveTextContent(token);
});

function renderComponent(onSubmit = jest.fn()) {
  const queries = render(
    <CreateAccessToken onSubmit={onSubmit} onError={jest.fn()} />
  );

  expect(queries.getByLabelText('Description')).toBeVisible();

  return queries;
}
