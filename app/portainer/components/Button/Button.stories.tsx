import { Meta, Story } from '@storybook/react';
import { PropsWithChildren } from 'react';

import { Button, Props } from './Button';

export default {
  component: Button,
  title: 'Components/Buttons/Button',
} as Meta;

function Template({
  onClick,
  color,
  size,
  disabled,
}: JSX.IntrinsicAttributes & PropsWithChildren<Props>) {
  return (
    <Button onClick={onClick} color={color} size={size} disabled={disabled}>
      <i className="fa fa-download" aria-hidden="true" /> Primary Button
    </Button>
  );
}

export const Primary: Story<PropsWithChildren<Props>> = Template.bind({});
Primary.args = {
  color: 'primary',
  size: 'small',
  disabled: false,
  onClick: () => {
    alert('Hello Button!');
  },
};

export function Disabled() {
  return (
    <Button color="primary" onClick={() => {}} disabled>
      Disabled Button
    </Button>
  );
}

export function Warning() {
  return (
    <Button color="warning" onClick={() => {}}>
      Warning Button
    </Button>
  );
}

export function Success() {
  return (
    <Button color="success" onClick={() => {}}>
      Success Button
    </Button>
  );
}

export function Danger() {
  return (
    <Button color="danger" onClick={() => {}}>
      Danger Button
    </Button>
  );
}

export function Default() {
  return (
    <Button color="default" onClick={() => {}}>
      <i className="fa fa-plus-circle" aria-hidden="true" /> Add an environment
      variable
    </Button>
  );
}

export function Link() {
  return (
    <Button color="link" onClick={() => {}}>
      Link Button
    </Button>
  );
}

export function XSmall() {
  return (
    <Button color="primary" onClick={() => {}} size="xsmall">
      XSmall Button
    </Button>
  );
}

export function Small() {
  return (
    <Button color="primary" onClick={() => {}} size="small">
      Small Button
    </Button>
  );
}

export function Large() {
  return (
    <Button color="primary" onClick={() => {}} size="large">
      Large Button
    </Button>
  );
}
