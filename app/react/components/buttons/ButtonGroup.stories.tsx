import { Meta, Story } from '@storybook/react';
import { PropsWithChildren } from 'react';

import { Icon } from '@@/Icon';

import { Button } from './Button';
import { ButtonGroup, Props } from './ButtonGroup';

export default {
  component: ButtonGroup,
  title: 'Components/Buttons/ButtonGroup',
} as Meta;

function Template({
  size,
}: JSX.IntrinsicAttributes & PropsWithChildren<Props>) {
  return (
    <ButtonGroup size={size}>
      <Button color="primary" onClick={() => {}}>
        <Icon icon="play" />
        Start
      </Button>
      <Button color="danger" onClick={() => {}}>
        <Icon icon="square" />
        Stop
      </Button>
      <Button color="primary" onClick={() => {}}>
        <Icon icon="refresh-cw" />
        Restart
      </Button>
      <Button color="primary" disabled onClick={() => {}}>
        <Icon icon="play" />
        Resume
      </Button>
      <Button color="danger" onClick={() => {}}>
        <Icon icon="trash-2" />
        Remove
      </Button>
    </ButtonGroup>
  );
}

export const Primary: Story<PropsWithChildren<Props>> = Template.bind({});
Primary.args = {
  size: 'small',
};

export function Xsmall() {
  return (
    <ButtonGroup size="xsmall">
      <Button color="primary" onClick={() => {}}>
        <Icon icon="play" />
        Start
      </Button>
      <Button color="danger" onClick={() => {}}>
        <Icon icon="square" />
        Stop
      </Button>
      <Button color="primary" onClick={() => {}}>
        <Icon icon="play" />
        Start
      </Button>
      <Button color="primary" onClick={() => {}}>
        <Icon icon="refresh-cw" />
        Restart
      </Button>
    </ButtonGroup>
  );
}

export function Small() {
  return (
    <ButtonGroup size="small">
      <Button color="primary" onClick={() => {}}>
        <Icon icon="play" />
        Start
      </Button>
      <Button color="danger" onClick={() => {}}>
        <Icon icon="square" />
        Stop
      </Button>
      <Button color="primary" onClick={() => {}}>
        <Icon icon="play" />
        Start
      </Button>
      <Button color="primary" onClick={() => {}}>
        <Icon icon="refresh-cw" />
        Restart
      </Button>
    </ButtonGroup>
  );
}

export function Large() {
  return (
    <ButtonGroup size="large">
      <Button color="primary" onClick={() => {}}>
        <Icon icon="play" />
        Start
      </Button>
      <Button color="danger" onClick={() => {}}>
        <Icon icon="square" />
        Stop
      </Button>
      <Button color="light" onClick={() => {}}>
        <Icon icon="play" />
        Start
      </Button>
      <Button color="primary" onClick={() => {}}>
        <Icon icon="refresh-cw" />
        Restart
      </Button>
    </ButtonGroup>
  );
}
