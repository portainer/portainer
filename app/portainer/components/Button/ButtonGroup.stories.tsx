import { Meta, Story } from '@storybook/react';
import { PropsWithChildren } from 'react';

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
      <Button color="success" onClick={() => {}}>
        <i className="fa fa-play space-right" aria-hidden="true" />
        Start
      </Button>
      <Button color="danger" onClick={() => {}}>
        <i className="fa fa-stop space-right" aria-hidden="true" />
        Stop
      </Button>
      <Button color="danger" onClick={() => {}}>
        <i className="fa fa-bomb space-right" aria-hidden="true" />
        Kill
      </Button>
      <Button color="primary" onClick={() => {}}>
        <i className="fa fa-sync space-right" aria-hidden="true" />
        Restart
      </Button>
      <Button color="primary" disabled onClick={() => {}}>
        <i className="fa fa-play space-right" aria-hidden="true" />
        Resume
      </Button>
      <Button color="danger" onClick={() => {}}>
        <i className="fa fa-trash-alt space-right" aria-hidden="true" />
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
      <Button color="success" onClick={() => {}}>
        <i className="fa fa-play space-right" aria-hidden="true" />
        Start
      </Button>
      <Button color="danger" onClick={() => {}}>
        <i className="fa fa-stop space-right" aria-hidden="true" />
        Stop
      </Button>
      <Button color="success" onClick={() => {}}>
        <i className="fa fa-play space-right" aria-hidden="true" />
        Start
      </Button>
      <Button color="primary" onClick={() => {}}>
        <i className="fa fa-sync space-right" aria-hidden="true" />
        Restart
      </Button>
    </ButtonGroup>
  );
}

export function Small() {
  return (
    <ButtonGroup size="small">
      <Button color="success" onClick={() => {}}>
        <i className="fa fa-play space-right" aria-hidden="true" />
        Start
      </Button>
      <Button color="danger" onClick={() => {}}>
        <i className="fa fa-stop space-right" aria-hidden="true" />
        Stop
      </Button>
      <Button color="success" onClick={() => {}}>
        <i className="fa fa-play space-right" aria-hidden="true" />
        Start
      </Button>
      <Button color="primary" onClick={() => {}}>
        <i className="fa fa-sync space-right" aria-hidden="true" />
        Restart
      </Button>
    </ButtonGroup>
  );
}

export function Large() {
  return (
    <ButtonGroup size="large">
      <Button color="success" onClick={() => {}}>
        <i className="fa fa-play space-right" aria-hidden="true" />
        Start
      </Button>
      <Button color="danger" onClick={() => {}}>
        <i className="fa fa-stop space-right" aria-hidden="true" />
        Stop
      </Button>
      <Button color="success" onClick={() => {}}>
        <i className="fa fa-play space-right" aria-hidden="true" />
        Start
      </Button>
      <Button color="primary" onClick={() => {}}>
        <i className="fa fa-sync space-right" aria-hidden="true" />
        Restart
      </Button>
    </ButtonGroup>
  );
}
