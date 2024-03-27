import { Meta, Story } from '@storybook/react';

import { AddButton } from './AddButton';

export default {
  component: AddButton,
  title: 'Components/Buttons/AddButton',
} as Meta;

type Args = {
  label: string;
};

function Template({ label }: Args) {
  return <AddButton data-cy="add-">{label}</AddButton>;
}

export const Primary: Story<Args> = Template.bind({});
Primary.args = {
  label: 'Create new container',
};
