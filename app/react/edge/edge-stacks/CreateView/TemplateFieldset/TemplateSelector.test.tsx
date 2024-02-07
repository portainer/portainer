import { vi } from 'vitest';
import { HttpResponse, http } from 'msw';

import { renderWithQueryClient, screen } from '@/react-tools/test-utils';
import { AppTemplate } from '@/react/portainer/templates/app-templates/types';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';
import { server } from '@/setup-tests/server';
import selectEvent from '@/react/test-utils/react-select';

import { SelectedTemplateValue } from './types';
import { TemplateSelector } from './TemplateSelector';

test('renders TemplateSelector component', async () => {
  render();

  const templateSelectorElement = screen.getByLabelText('Template');
  expect(templateSelectorElement).toBeInTheDocument();
});

// eslint-disable-next-line vitest/expect-expect
test('selects an edge app template', async () => {
  const onChange = vi.fn();

  const selectedTemplate = {
    title: 'App Template 2',
    description: 'Description 2',
    id: 2,
    categories: ['edge'],
  };

  const { select } = render({
    onChange,
    appTemplates: [
      {
        title: 'App Template 1',
        description: 'Description 1',
        id: 1,
        categories: ['edge'],
      },
      selectedTemplate,
    ],
  });

  await select('app', {
    Title: selectedTemplate.title,
    Description: selectedTemplate.description,
  });
});

// eslint-disable-next-line vitest/expect-expect
test('selects an edge custom template', async () => {
  const onChange = vi.fn();

  const selectedTemplate = {
    Title: 'Custom Template 2',
    Description: 'Description 2',
    Id: 2,
  };

  const { select } = render({
    onChange,
    customTemplates: [
      {
        Title: 'Custom Template 1',
        Description: 'Description 1',
        Id: 1,
      },
      selectedTemplate,
    ],
  });

  await select('custom', selectedTemplate);
});

test('renders with error', async () => {
  render({
    error: 'Invalid template',
  });

  const templateSelectorElement = screen.getByLabelText('Template');
  expect(templateSelectorElement).toBeInTheDocument();

  const errorElement = screen.getByText('Invalid template');
  expect(errorElement).toBeInTheDocument();
});

test('renders TemplateSelector component with no custom templates available', async () => {
  render({
    customTemplates: [],
  });

  const templateSelectorElement = screen.getByLabelText('Template');
  expect(templateSelectorElement).toBeInTheDocument();

  await selectEvent.openMenu(templateSelectorElement);

  const noCustomTemplatesElement = screen.getByText(
    'No edge custom templates available'
  );
  expect(noCustomTemplatesElement).toBeInTheDocument();
});

function render({
  onChange = vi.fn(),
  appTemplates = [],
  customTemplates = [],
  error,
}: {
  onChange?: (value: SelectedTemplateValue) => void;
  appTemplates?: Array<Partial<AppTemplate>>;
  customTemplates?: Array<Partial<CustomTemplate>>;
  error?: string;
} = {}) {
  server.use(
    http.get('/api/registries', async () => HttpResponse.json([])),
    http.get('/api/templates', async () =>
      HttpResponse.json({ templates: appTemplates, version: '3' })
    ),
    http.get('/api/custom_templates', async () =>
      HttpResponse.json(customTemplates)
    )
  );

  renderWithQueryClient(
    <TemplateSelector
      value={{ template: undefined, type: undefined }}
      onChange={onChange}
      error={error}
    />
  );

  return { select };

  async function select(
    type: 'app' | 'custom',
    template: { Title: string; Description: string }
  ) {
    const templateSelectorElement = screen.getByLabelText('Template');
    await selectEvent.select(
      templateSelectorElement,
      `${template.Title} - ${template.Description}`
    );

    expect(onChange).toHaveBeenCalledWith({
      template: expect.objectContaining(template),
      type,
    });
  }
}
