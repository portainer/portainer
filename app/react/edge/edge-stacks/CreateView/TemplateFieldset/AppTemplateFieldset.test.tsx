import { render, screen } from '@testing-library/react';

import {
  EnvVarType,
  TemplateViewModel,
} from '@/react/portainer/templates/app-templates/view-model';

import { AppTemplateFieldset } from './AppTemplateFieldset';

test('renders AppTemplateFieldset component', () => {
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
    Note: 'This is a template note',
    Env: env,
  } as TemplateViewModel;

  const values: Record<string, string> = {
    VAR1: 'value1',
    VAR2: 'value2',
  };

  const onChange = vi.fn();

  render(
    <AppTemplateFieldset
      template={template}
      values={values}
      onChange={onChange}
    />
  );

  const templateNoteElement = screen.getByText('This is a template note');
  expect(templateNoteElement).toBeInTheDocument();

  const envVarsFieldsetElement = screen.getByLabelText(testedEnv.label, {
    exact: false,
  });
  expect(envVarsFieldsetElement).toBeInTheDocument();
});
