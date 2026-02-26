import { Meta, StoryFn } from '@storybook/react';

import { Tooltip, Props } from './Tooltip';

export default {
  component: Tooltip,
  title: 'Components/Tip/Tooltip',
} as Meta;

function Template({ message, position }: JSX.IntrinsicAttributes & Props) {
  return (
    <div className="col-sm-3 col-lg-2">
      Example tooltip
      <Tooltip message={message} position={position} />
    </div>
  );
}

export const Primary: StoryFn<Props> = Template.bind({});
Primary.args = {
  message: 'Tooltip example',
  position: 'bottom',
};
