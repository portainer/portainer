import { vi } from 'vitest';
import { HttpResponse, http } from 'msw';
import { render, screen } from '@testing-library/react';

import { AppTemplate } from '@/react/portainer/templates/app-templates/types';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';
import { server } from '@/setup-tests/server';
import selectEvent from '@/react/test-utils/react-select';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { TemplateViewModel } from '@/react/portainer/templates/app-templates/view-model';

import { TemplateSelector } from './TemplateSelector';

test('renders TemplateSelector component', async () => {
  renderComponent();

  const templateSelectorElement = screen.getByLabelText('Template');
  expect(templateSelectorElement).toBeInTheDocument();
});

// TODO skipped select tests because the tests take too long to run

// eslint-disable-next-line vitest/expect-expect
test.skip('selects an edge app template', async () => {
  const onChange = vi.fn();

  const selectedTemplate = {
    title: 'App Template 2',
    description: 'Description 2',
    id: 2,
    categories: ['edge'],
  };

  const { select } = renderComponent({
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
test.skip('selects an edge custom template', async () => {
  const onChange = vi.fn();

  const selectedTemplate = {
    Title: 'Custom Template 2',
    Description: 'Description 2',
    Id: 2,
  };

  const { select } = renderComponent({
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
  renderComponent({
    error: 'Invalid template',
  });

  const templateSelectorElement = screen.getByLabelText('Template');
  expect(templateSelectorElement).toBeInTheDocument();

  const errorElement = screen.getByText('Invalid template');
  expect(errorElement).toBeInTheDocument();
});

test.skip('renders TemplateSelector component with no custom templates available', async () => {
  renderComponent({
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

function renderComponent({
  onChange = vi.fn(),
  appTemplates = [],
  customTemplates = [],
  error,
}: {
  onChange?: (
    template: TemplateViewModel | CustomTemplate | undefined,
    type: 'app' | 'custom' | undefined
  ) => void;
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

  const Wrapped = withTestQueryProvider(TemplateSelector);

  render(
    <Wrapped
      value={{ templateId: undefined, type: undefined }}
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
