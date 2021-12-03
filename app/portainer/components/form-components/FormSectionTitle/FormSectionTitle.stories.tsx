import { Meta, Story } from '@storybook/react';
import { PropsWithChildren } from 'react';

import { FormSectionTitle } from './FormSectionTitle';

export default {
  component: FormSectionTitle,
  title: 'Components/Form/FormSectionTitle',
} as Meta;

function Template({
  children,
}: JSX.IntrinsicAttributes & PropsWithChildren<unknown>) {
  return <FormSectionTitle>{children}</FormSectionTitle>;
}

export const Example: Story<PropsWithChildren<unknown>> = Template.bind({});
Example.args = {
  children: 'This is a title with children',
};
