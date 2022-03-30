import { Meta, Story } from '@storybook/react';

import { DetailsTable, Props } from './DetailsTable';
import { DetailsTableKeyValueRow } from './DetailsTableKeyValueRow';

export default {
  component: DetailsTable,
  title: 'Components/Tables/DetailsTable',
} as Meta;

function Template({ children }: Props) {
  return <DetailsTable>{children}</DetailsTable>;
}

export const Default: Story<Props> = Template.bind({});
Default.args = {
  children: (
    <>
      <DetailsTableKeyValueRow keyProp="Name">Bob</DetailsTableKeyValueRow>
      <DetailsTableKeyValueRow keyProp="Id">dmsjs1532</DetailsTableKeyValueRow>
    </>
  ),
};
