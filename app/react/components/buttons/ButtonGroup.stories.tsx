import { Meta, Story } from '@storybook/react';
import { PropsWithChildren } from 'react';
import { Play, RefreshCw, Square, Trash2 } from 'lucide-react';

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
      <Button icon={Play} color="primary" onClick={() => {}}>
        Start
      </Button>
      <Button icon={Square} color="danger" onClick={() => {}}>
        Stop
      </Button>
      <Button icon={RefreshCw} color="primary" onClick={() => {}}>
        Restart
      </Button>
      <Button icon={Play} color="primary" disabled onClick={() => {}}>
        Resume
      </Button>
      <Button icon={Trash2} color="danger" onClick={() => {}}>
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
      <Button icon={Play} color="primary" onClick={() => {}}>
        Start
      </Button>
      <Button icon={Square} color="danger" onClick={() => {}}>
        Stop
      </Button>
      <Button icon={Play} color="primary" onClick={() => {}}>
        Start
      </Button>
      <Button icon={RefreshCw} color="primary" onClick={() => {}}>
        Restart
      </Button>
    </ButtonGroup>
  );
}

export function Small() {
  return (
    <ButtonGroup size="small">
      <Button icon={Play} color="primary" onClick={() => {}}>
        Start
      </Button>
      <Button icon={Square} color="danger" onClick={() => {}}>
        Stop
      </Button>
      <Button icon={Play} color="primary" onClick={() => {}}>
        Start
      </Button>
      <Button icon={RefreshCw} color="primary" onClick={() => {}}>
        Restart
      </Button>
    </ButtonGroup>
  );
}

export function Large() {
  return (
    <ButtonGroup size="large">
      <Button icon={Play} color="primary" onClick={() => {}}>
        Start
      </Button>
      <Button icon={Square} color="danger" onClick={() => {}}>
        Stop
      </Button>
      <Button icon={Play} color="light" onClick={() => {}}>
        Start
      </Button>
      <Button icon={RefreshCw} color="primary" onClick={() => {}}>
        Restart
      </Button>
    </ButtonGroup>
  );
}
