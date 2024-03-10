import { FormikErrors } from 'formik';
import { ComponentProps } from 'react';
import { HttpResponse } from 'msw';
import { render, fireEvent } from '@testing-library/react';

import { http, server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { ImageConfigFieldset } from './ImageConfigFieldset';
import { Values } from './types';

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { endpointId: 1 },
  })),
}));

it('should render SimpleForm when useRegistry is true', () => {
  const { getByText } = renderComponent({ values: { useRegistry: true } });

  expect(getByText('Advanced mode')).toBeInTheDocument();
});

it('should render AdvancedForm when useRegistry is false', () => {
  const { getByText } = renderComponent({ values: { useRegistry: false } });

  expect(getByText('Simple mode')).toBeInTheDocument();
});

it('should call setFieldValue with useRegistry set to false when "Advanced mode" button is clicked', () => {
  const setFieldValue = vi.fn();
  const { getByText } = renderComponent({
    values: { useRegistry: true },
    setFieldValue,
  });

  fireEvent.click(getByText('Advanced mode'));

  expect(setFieldValue).toHaveBeenCalledWith('useRegistry', false);
});

it('should call setFieldValue with useRegistry set to true when "Simple mode" button is clicked', () => {
  const setFieldValue = vi.fn();
  const { getByText } = renderComponent({
    values: { useRegistry: false },
    setFieldValue,
  });

  fireEvent.click(getByText('Simple mode'));

  expect(setFieldValue).toHaveBeenCalledWith('useRegistry', true);
});

function renderComponent({
  values = {
    useRegistry: true,
    registryId: 123,
    image: '',
  },
  errors = {},
  setFieldValue = vi.fn(),
  onChangeImage = vi.fn(),
  onRateLimit = vi.fn(),
}: {
  values?: Partial<Values>;
  errors?: FormikErrors<Values>;
  setFieldValue?: ComponentProps<typeof ImageConfigFieldset>['setFieldValue'];
  onChangeImage?: ComponentProps<typeof ImageConfigFieldset>['onChangeImage'];
  onRateLimit?: ComponentProps<typeof ImageConfigFieldset>['onRateLimit'];
} = {}) {
  server.use(
    http.get('/api/registries/:id', () => HttpResponse.json({})),
    http.get('/api/endpoints/:id', () => HttpResponse.json({}))
  );

  const Wrapped = withTestQueryProvider(ImageConfigFieldset);

  return render(
    <Wrapped
      values={{
        useRegistry: true,
        registryId: 123,
        image: '',
        ...values,
      }}
      errors={errors}
      setFieldValue={setFieldValue}
      onChangeImage={onChangeImage}
      onRateLimit={onRateLimit}
    />
  );
}
