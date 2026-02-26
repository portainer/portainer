import { Meta, StoryFn } from '@storybook/react';
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
    <CopyButton
      copyText={copyText}
      displayText={displayText}
      data-cy="copy-button"
    >
      {children}
    </CopyButton>
  );
}

export const Primary: StoryFn<PropsWithChildren<Props>> = Template.bind({});
Primary.args = {
  children: 'Copy',
  copyText: 'this will be copied to clipboard',
};

export const NoCopyText: StoryFn<PropsWithChildren<Props>> = Template.bind({});
NoCopyText.args = {
  children: 'Copy without copied text',
  copyText: 'clipboard override',
  displayText: '',
};
