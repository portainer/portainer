import { Meta } from '@storybook/react';
import { useState } from 'react';

import { TagId } from '@/portainer/tags/types';

import { TagSelector } from './TagSelector';

export default {
  component: TagSelector,
  title: 'Components/TagSelector',
} as Meta;

function Example() {
  const [value, setValue] = useState<TagId[]>([]);

  return <TagSelector value={value} onChange={setValue} />;
}

function ExampleWithCreate() {
  const [value, setValue] = useState<TagId[]>([]);

  return <TagSelector value={value} onChange={setValue} allowCreate />;
}

export { Example, ExampleWithCreate };
