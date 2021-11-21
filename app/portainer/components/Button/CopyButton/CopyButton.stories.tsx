import { Meta, Story } from '@storybook/react';
import { PropsWithChildren } from 'react';

import { CopyButton, Props } from './CopyButton';

export default {
  component: CopyButton,
  title: 'Components/Buttons/CopyButton',
} as Meta;

function Template({
  label,
  copyText,
  displayText,
  children,
}: JSX.IntrinsicAttributes & PropsWithChildren<Props>) {
  return (
    <CopyButton label={label} copyText={copyText} displayText={displayText}>
      {children}
    </CopyButton>
  );
}

export const Primary: Story<PropsWithChildren<Props>> = Template.bind({});
Primary.args = {
  label: 'Example heading',
  copyText: 'this will be copied to clipboard',
};

export const WithChildren: Story<PropsWithChildren<Props>> = Template.bind({});
WithChildren.args = {
  children: 'This is a heading with children',
  copyText: 'clipboard override',
  displayText: 'copied',
};
