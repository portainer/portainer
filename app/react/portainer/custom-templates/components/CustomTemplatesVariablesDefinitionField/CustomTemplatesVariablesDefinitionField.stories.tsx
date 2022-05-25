import { ComponentMeta } from '@storybook/react';
import { useState } from 'react';

import {
  CustomTemplatesVariablesDefinitionField,
  VariableDefinition,
} from './CustomTemplatesVariablesDefinitionField';

export default {
  title: 'Custom Templates/Variables Definition Field',
  component: CustomTemplatesVariablesDefinitionField,
  args: {},
} as ComponentMeta<typeof CustomTemplatesVariablesDefinitionField>;

function Template() {
  const [value, setValue] = useState<VariableDefinition[]>([
    { label: '', name: '', defaultValue: '', description: '' },
  ]);

  return (
    <CustomTemplatesVariablesDefinitionField
      value={value}
      onChange={setValue}
      errors={[
        {
          name: 'required',
          defaultValue: 'non empty',
          description: '',
          label: 'invalid',
        },
      ]}
    />
  );
}

export const Story = Template.bind({});
