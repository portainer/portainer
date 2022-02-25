import { Meta } from '@storybook/react';
import { useState } from 'react';

import { FileUploadField } from './FileUploadField';

export default {
  component: FileUploadField,
  title: 'Components/Buttons/FileUploadField',
} as Meta;

interface Args {
  title: string;
}

export { Example };

function Example({ title }: Args) {
  const [value, setValue] = useState<File>();
  function onChange(value: File) {
    if (value) {
      setValue(value);
    }
  }

  return <FileUploadField onChange={onChange} value={value} title={title} />;
}
