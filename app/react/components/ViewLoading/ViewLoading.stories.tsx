import { Meta, StoryFn } from '@storybook/react-webpack5';

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

export const Example: StoryFn<Args> = Template.bind({});
Example.args = {
  message: 'Loading...',
};
