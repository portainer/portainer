import { ComponentMeta, Story } from '@storybook/react';
import { useState } from 'react';

import { NavTabs, type Option } from './NavTabs';

export default {
  title: 'Components/NavTabs',
  component: NavTabs,
} as ComponentMeta<typeof NavTabs>;

type Args = {
  options: Option[];
};

function Template({ options = [] }: Args) {
  const [selected, setSelected] = useState(
    options.length ? options[0].id : undefined
  );

  return (
    <NavTabs options={options} selectedId={selected} onSelect={setSelected} />
  );
}

export const Example: Story<Args> = Template.bind({});
Example.args = {
  options: [
    { children: 'Content 1', id: 'option1', label: 'Option 1' },
    { children: 'Content 2', id: 'option2', label: 'Option 2' },
  ],
};
