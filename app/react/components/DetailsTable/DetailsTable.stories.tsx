import { Meta, Story } from '@storybook/react';

import { DetailsTable } from './DetailsTable';
import { DetailsRow } from './DetailsRow';

type Args = {
  key1: string;
  val1: string;
  key2: string;
  val2: string;
};

export default {
  component: DetailsTable,
  title: 'Components/Tables/DetailsTable',
} as Meta;

function Template({ key1, val1, key2, val2 }: Args) {
  return (
    <DetailsTable>
      <DetailsRow label={key1}>{val1}</DetailsRow>
      <DetailsRow label={key2}>{val2}</DetailsRow>
    </DetailsTable>
  );
}

export const Default: Story<Args> = Template.bind({});
Default.args = {
  key1: 'Name',
  val1: 'My Cool App',
  key2: 'Id',
  val2: 'dmsjs1532',
};
