import { UIRouter, pushStateLocationPlugin } from '@uirouter/react';
import { Meta } from '@storybook/react';

import { ReactExample } from './ReactExample';

const meta: Meta = {
  title: 'ReactExample',
  component: ReactExample,
};

export default meta;

interface Props {
  text: string;
}

export function Example({ text }: Props) {
  return (
    <UIRouter plugins={[pushStateLocationPlugin]}>
      <ReactExample text={text} />
    </UIRouter>
  );
}
