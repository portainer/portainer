import { Meta, StoryFn } from '@storybook/react-webpack5';
import { PropsWithChildren } from 'react';

import { FormSectionTitle } from './FormSectionTitle';

export default {
  component: FormSectionTitle,
  title: 'Components/Forms/FormSectionTitle',
} as Meta;

function Template({
  children,
}: JSX.IntrinsicAttributes & PropsWithChildren<unknown>) {
  return <FormSectionTitle>{children}</FormSectionTitle>;
}

export const Example: StoryFn<PropsWithChildren<unknown>> = Template.bind({});
Example.args = {
  children: 'This is a title with children',
};
