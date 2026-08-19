import { Meta } from '@storybook/react-webpack5';
import { useState } from 'react';

import { ColorPicker } from './ColorPicker';

export default {
  component: ColorPicker,
  title: 'Components/Forms/ColorPicker',
} as Meta;

export function Default() {
  const [value, setValue] = useState('#3c8dbc');
  return (
    <ColorPicker
      value={value}
      onChange={setValue}
      id="story-color-picker"
      data-cy="story-color-picker"
    />
  );
}
