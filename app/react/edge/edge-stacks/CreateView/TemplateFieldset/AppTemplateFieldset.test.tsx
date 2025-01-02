import { render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';

import { EnvVarType } from '@/react/portainer/templates/app-templates/view-model';
import {
  AppTemplate,
  TemplateType,
} from '@/react/portainer/templates/app-templates/types';
import { server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { AppTemplateFieldset } from './AppTemplateFieldset';

test('renders AppTemplateFieldset component', async () => {
  const testedEnv = {
    name: 'VAR2',
    label: 'Variable 2',
    default: 'value2',
    value: 'value2',
    type: EnvVarType.Text,
  };

  const env = [
    {
      name: 'VAR1',
      label: 'Variable 1',
      default: 'value1',
      value: 'value1',
      type: EnvVarType.Text,
    },
    testedEnv,
  ];
  const template = {
    id: 1,
    note: 'This is a template note',
    env,
    type: TemplateType.ComposeStack,
    categories: ['edge'],
    title: 'Template title',
    description: 'Template description',
    administrator_only: false,
    image: 'template-image',
    repository: {
      url: '',
      stackfile: '',
    },
  } satisfies AppTemplate;

  const values: Record<string, string> = {
    VAR1: 'value1',
    VAR2: 'value2',
  };

  server.use(
    http.get('/api/templates', () =>
      HttpResponse.json({ version: '3', templates: [template] })
    ),
    http.get('/api/registries', () => HttpResponse.json([]))
  );

  const onChange = vi.fn();
  const Wrapped = withTestQueryProvider(AppTemplateFieldset);
  render(
    <Wrapped templateId={template.id} values={values} onChange={onChange} />
  );

  screen.debug();

  await expect(
    screen.findByText('This is a template note')
  ).resolves.toBeInTheDocument();

  const envVarsFieldsetElement = screen.getByLabelText(testedEnv.label, {
    exact: false,
  });
  expect(envVarsFieldsetElement).toBeInTheDocument();
});
