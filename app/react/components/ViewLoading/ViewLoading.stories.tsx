import { Meta, Story } from '@storybook/react';

import { ViewLoading } from './ViewLoading';

export default {
  component: ViewLoading,
  title: 'Components/ViewLoading',
} as Meta;

interface Args {
  message: string;
}

function Template({ message }: Args) {
  return <ViewLoading message={message} />;
}

export const Example: Story<Args> = Template.bind({});
Example.args = {
  message: 'Loading...',
};
