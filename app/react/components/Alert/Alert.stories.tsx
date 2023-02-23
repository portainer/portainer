import { Meta, Story } from '@storybook/react';

import { Alert } from './Alert';

export default {
  component: Alert,
  title: 'Components/Alert',
} as Meta;

interface Args {
  color: 'success' | 'error' | 'info';
  title: string;
  text: string;
}

function Template({ text, color, title }: Args) {
  return (
    <Alert color={color} title={title}>
      {text}
    </Alert>
  );
}

export const Success: Story<Args> = Template.bind({});
Success.args = {
  color: 'success',
  title: 'Success',
  text: 'This is a success alert. Very long text, Very long text,Very long text ,Very long text ,Very long text, Very long text',
};

export const Error: Story<Args> = Template.bind({});
Error.args = {
  color: 'error',
  title: 'Error',
  text: 'This is an error alert',
};

export const Info: Story<Args> = Template.bind({});
Info.args = {
  color: 'info',
  title: 'Info',
  text: 'This is an info alert',
};
