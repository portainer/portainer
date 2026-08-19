import { Meta, StoryFn } from '@storybook/react-webpack5';

import { PageTitle } from './PageTitle';

export default {
  component: PageTitle,
  title: 'Components/PageHeader/PageTitle',
} as Meta;

interface StoryProps {
  title: string;
}

function Template({ title }: StoryProps) {
  return <PageTitle title={title} />;
}

export const Primary: StoryFn<StoryProps> = Template.bind({});
Primary.args = {
  title: 'Container details',
};

function WithChildrenTemplate({ title }: StoryProps) {
  return (
    <PageTitle title={title}>
      <span className="text-muted text-sm">additional content</span>
    </PageTitle>
  );
}

export const WithChildren: StoryFn<StoryProps> = WithChildrenTemplate.bind({});
WithChildren.args = {
  title: 'Container details',
};
