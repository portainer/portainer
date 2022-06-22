import { useState } from 'react';

import { VariableDefinition } from '../CustomTemplatesVariablesDefinitionField/CustomTemplatesVariablesDefinitionField';

import {
  CustomTemplatesVariablesField,
  Variables,
} from './CustomTemplatesVariablesField';

export default {
  title: 'Custom Templates/Variables Field',
  component: CustomTemplatesVariablesField,
};

const definitions: VariableDefinition[] = [
  {
    label: 'Image Name',
    name: 'image_name',
    defaultValue: 'nginx',
    description: '',
  },
  {
    label: 'Required field',
    name: 'required_field',
    defaultValue: '',
    description: '',
  },
  {
    label: 'Required field with tooltip',
    name: 'required_field',
    defaultValue: '',
    description: 'tooltip',
  },
];

function Template() {
  const [value, setValue] = useState<Variables>(
    Object.fromEntries(
      definitions.map((def) => [def.name, def.defaultValue || ''])
    )
  );

  return (
    <CustomTemplatesVariablesField
      value={value}
      onChange={setValue}
      definitions={definitions}
    />
  );
}

export const Story = Template.bind({});
