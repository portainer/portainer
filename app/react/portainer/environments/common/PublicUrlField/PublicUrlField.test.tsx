import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form, Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import { PublicUrlField } from './PublicUrlField';

describe('PublicUrlField', () => {
  it('should render the public URL field', () => {
    renderComponent();

    const input = screen.getByLabelText('Public IP');
    expect(input).toBeVisible();
  });

  it('should display placeholder text', () => {
    renderComponent();

    const input = screen.getByPlaceholderText(
      'e.g. 10.0.0.10 or mydocker.mydomain.com'
    );
    expect(input).toBeVisible();
  });

  it('should update value on user input', async () => {
    const { publicUrl } = renderComponent();

    const input = screen.getByLabelText('Public IP');
    await userEvent.clear(input);
    await userEvent.type(input, '10.0.0.10');

    expect(publicUrl()).toBe('10.0.0.10');
  });

  it('should display error message when field has error', () => {
    renderComponent({ initialErrors: { publicUrl: 'Invalid URL' } });

    expect(screen.getByText('Invalid URL')).toBeVisible();
  });
});

function renderComponent(options?: { initialErrors?: { publicUrl?: string } }) {
  const initialValues = { publicUrl: '' };
  let formValues = initialValues;

  const result = render(
    <Formik
      initialValues={initialValues}
      initialErrors={options?.initialErrors}
      onSubmit={() => {}}
    >
      {({ values }) => {
        formValues = values;
        return (
          <Form>
            <PublicUrlField />
          </Form>
        );
      }}
    </Formik>
  );

  return {
    ...result,
    publicUrl: () => formValues.publicUrl,
  };
}
