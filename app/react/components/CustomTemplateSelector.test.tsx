import { http, HttpResponse } from 'msw';
import { render, waitFor } from '@testing-library/react';
import { Mock } from 'vitest';

import { server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';
import { StackType } from '@/react/common/stacks/types';

import { CustomTemplateSelector } from './CustomTemplateSelector';

const mockCustomTemplates: CustomTemplate[] = [
  {
    Id: 1,
    Title: 'Nginx Template',
    Description: 'Web server template',
    ProjectPath: '/data/custom_template/1',
    EntryPoint: 'docker-compose.yml',
    CreatedByUserId: 1,
    Note: 'Nginx note',
    Platform: 1,
    Logo: '',
    Type: StackType.DockerCompose,
    Variables: [],
    IsComposeFormat: false,
    EdgeTemplate: false,
  },
  {
    Id: 2,
    Title: 'Redis Template',
    Description: '',
    ProjectPath: '/data/custom_template/2',
    EntryPoint: 'docker-compose.yml',
    CreatedByUserId: 1,
    Note: '',
    Platform: 1,
    Logo: '',
    Type: StackType.DockerCompose,
    Variables: [],
    IsComposeFormat: false,
    EdgeTemplate: false,
  },
];

test('should render the component with label', async () => {
  const { getByText } = await renderComponent({}, []);

  expect(getByText('Template')).toBeInTheDocument();
});

test('should show message when no templates are available', async () => {
  const queries = await renderComponent({}, []);

  await waitFor(() => {
    expect(
      queries.getByText('No custom templates are available.')
    ).toBeInTheDocument();
  });
});

test('should show link to create template when newTemplatePath is provided', async () => {
  const queries = await renderComponent(
    { newTemplatePath: '/templates/new' },
    []
  );

  await waitFor(() => {
    const link = queries.getByRole('link', { name: /custom template view/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/templates/new');
  });
});

test('should render select with templates', async () => {
  const queries = await renderComponent({}, mockCustomTemplates);

  await waitFor(() => {
    const combobox = queries.getByRole('combobox');
    expect(combobox).toBeInTheDocument();
  });
});

test('should display error message when provided', async () => {
  const queries = await renderComponent(
    { error: 'This field is required' },
    mockCustomTemplates
  );

  await waitFor(() => {
    expect(queries.getByText('This field is required')).toBeInTheDocument();
  });
});

async function renderComponent(
  {
    value,
    onChange = vi.fn(),
    error,
    stackType,
    newTemplatePath,
  }: {
    value?: number;
    onChange?: Mock;
    error?: string;
    stackType?: StackType;
    newTemplatePath?: string;
  } = {},
  templates: CustomTemplate[] = []
) {
  server.use(
    http.get('/api/custom_templates', () => HttpResponse.json(templates))
  );

  const Component = withTestQueryProvider(CustomTemplateSelector);

  const queries = render(
    <Component
      value={value}
      onChange={onChange}
      error={error}
      stackType={stackType}
      newTemplatePath={newTemplatePath}
    />
  );

  const labelElement = await queries.findByText('Template');
  expect(labelElement).toBeInTheDocument();

  return queries;
}
