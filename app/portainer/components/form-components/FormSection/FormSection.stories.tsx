import { Meta, Story } from '@storybook/react';

import { FormSection } from './FormSection';

export default {
  component: FormSection,
  title: 'Components/Form/FormSection',
} as Meta;

interface Args {
  title: string;
  content: string;
}

function Template({ title, content }: Args) {
  return <FormSection title={title}>{content}</FormSection>;
}

const exampleContent = `Content
  
  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam egestas turpis magna,
   vel pretium dui rhoncus nec. Maecenas felis purus, consectetur non porta sit amet,
    auctor sed sapien. Aliquam eu nunc felis. Pellentesque pulvinar velit id quam pellentesque,
     nec imperdiet dui finibus. In blandit augue nibh, nec tincidunt nisi porttitor quis.
      Nullam nec nibh maximus, consequat quam sed, dapibus purus. Donec facilisis commodo mi, in commodo augue molestie sed.
  `;

export const Example: Story<Args> = Template.bind({});
Example.args = {
  title: 'title',
  content: exampleContent,
};

export function FoldableSection({
  title = 'title',
  content = exampleContent,
}: Args) {
  return (
    <FormSection title={title} isFoldable>
      {content}
    </FormSection>
  );
}
