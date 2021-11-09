import { Meta, Story } from '@storybook/react';

import { AddButton, Props } from './AddButton';

export default {
  component: AddButton,
  title: 'Components/Buttons/AddButton',
} as Meta;

function Template({ label, onClick }: JSX.IntrinsicAttributes & Props) {
  return <AddButton label={label} onClick={onClick} />;
}

export const Primary: Story<Props> = Template.bind({});
Primary.args = {
  label: 'Create new container',
  onClick: () => {
    alert('Hello AddButton!');
  },
};
