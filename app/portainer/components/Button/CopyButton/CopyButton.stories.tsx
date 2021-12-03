import { Meta, Story } from '@storybook/react';
import { PropsWithChildren } from 'react';

import { CopyButton, Props } from './CopyButton';

export default {
  component: CopyButton,
  title: 'Components/Buttons/CopyButton',
} as Meta;

function Template({
  copyText,
  displayText,
  children,
}: JSX.IntrinsicAttributes & PropsWithChildren<Props>) {
  return (
    <CopyButton copyText={copyText} displayText={displayText}>
      {children}
    </CopyButton>
  );
}

export const Primary: Story<PropsWithChildren<Props>> = Template.bind({});
Primary.args = {
  children: 'Copy to clipboard',
  copyText: 'this will be copied to clipboard',
};

export const NoCopyText: Story<PropsWithChildren<Props>> = Template.bind({});
NoCopyText.args = {
  children: 'Copy to clipboard without copied text',
  copyText: 'clipboard override',
  displayText: '',
};
