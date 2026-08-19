import { Meta } from '@storybook/react-webpack5';
import { useState } from 'react';

import {
  CustomTemplatesVariablesDefinitionField,
  VariableDefinition,
} from './CustomTemplatesVariablesDefinitionField';

export default {
  title: 'Components/Custom Templates/Variables Definition Field',
  component: CustomTemplatesVariablesDefinitionField,
  args: {},
} as Meta<typeof CustomTemplatesVariablesDefinitionField>;

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
