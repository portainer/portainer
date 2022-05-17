import { Meta, Story } from '@storybook/react';

import { Code } from './Code';

export default {
  component: Code,
  title: 'Components/Code',
} as Meta;

interface Args {
  text: string;
  showCopyButton?: boolean;
}

function Template({ text, showCopyButton }: Args) {
  return <Code showCopyButton={showCopyButton}>{text}</Code>;
}

export const Primary: Story<Args> = Template.bind({});
Primary.args = {
  text: 'curl -X GET http://ultra-sound-money.eth',
  showCopyButton: true,
};

export const MultiLine: Story<Args> = Template.bind({});
MultiLine.args = {
  text: 'curl -X\n GET http://example-with-children.crypto',
};

export const MultiLineWithIcon: Story<Args> = Template.bind({});
MultiLineWithIcon.args = {
  text: 'curl -X\n GET http://example-with-children.crypto',
  showCopyButton: true,
};
