import { Story, Meta } from '@storybook/react';
import { PropsWithChildren } from 'react';

import { InlineLoader, Props } from './InlineLoader';

export default {
  title: 'Components/InlineLoader',
  component: InlineLoader,
} as Meta;

function Template({ className, children }: PropsWithChildren<Props>) {
  return <InlineLoader className={className}>{children}</InlineLoader>;
}

export const Primary: Story<PropsWithChildren<Props>> = Template.bind({});
Primary.args = {
  className: 'test-class',
  children: 'Loading...',
};
