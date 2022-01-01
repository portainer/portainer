import { Meta } from '@storybook/react';
import { useState } from 'react';

import { ButtonSelector, Option } from './ButtonSelector';

export default {
  component: ButtonSelector,
  title: 'Components/ButtonSelector',
} as Meta;

export { TwoOptionsSelector };

function TwoOptionsSelector() {
  const options: Option<string>[] = [
    { value: 'sAMAccountName', label: 'username' },
    { value: 'userPrincipalName', label: 'user@domainname' },
  ];

  const [value, setValue] = useState('sAMAccountName');
  return (
    <ButtonSelector<string>
      onChange={handleChange}
      value={value}
      options={options}
    />
  );

  function handleChange(value: string) {
    setValue(value);
  }
}
