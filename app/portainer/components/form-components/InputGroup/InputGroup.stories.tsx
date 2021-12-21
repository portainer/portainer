import { Meta } from '@storybook/react';
import { useState } from 'react';

import { InputGroup } from '.';

export default {
  component: InputGroup,
  title: 'Components/Form/InputGroup',
} as Meta;

export { BasicExample, Addons, Sizing };

function BasicExample() {
  const [value1, setValue1] = useState('');
  const [valueNumber, setValueNumber] = useState(0);

  return (
    <div className="space-y-8">
      <InputGroup>
        <InputGroup.Addon>@</InputGroup.Addon>
        <InputGroup.Input
          value={value1}
          onChange={(e) => setValue1(e.target.value)}
          placeholder="Username"
          aria-describedby="basic-addon1"
        />
      </InputGroup>

      <InputGroup>
        <InputGroup.Input
          value={value1}
          onChange={(e) => setValue1(e.target.value)}
          placeholder="Recipient's username"
          aria-describedby="basic-addon2"
        />
        <InputGroup.Addon>@example.com</InputGroup.Addon>
      </InputGroup>

      <InputGroup>
        <InputGroup.Addon>$</InputGroup.Addon>
        <InputGroup.Input
          type="number"
          value={valueNumber}
          onChange={(e) => setValueNumber(parseInt(e.target.value, 10))}
          aria-label="Amount (to the nearest dollar)"
        />
        <InputGroup.Addon>.00</InputGroup.Addon>
      </InputGroup>

      <label htmlFor="basic-url">Your vanity URL</label>
      <InputGroup>
        <InputGroup.Addon>https://example.com/users/</InputGroup.Addon>
        <InputGroup.Input
          value={value1}
          onChange={(e) => setValue1(e.target.value)}
          id="basic-url"
          aria-describedby="basic-addon3"
        />
      </InputGroup>
    </div>
  );
}

function Addons() {
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  return (
    <div className="row">
      <div className="col-lg-6">
        <InputGroup>
          <InputGroup.ButtonWrapper>
            <button className="btn btn-default" type="button">
              Go!
            </button>
          </InputGroup.ButtonWrapper>
          <InputGroup.Input
            value={value1}
            onChange={(e) => setValue1(e.target.value)}
          />
        </InputGroup>
      </div>
      <div className="col-lg-6">
        <InputGroup>
          <InputGroup.Input
            value={value2}
            onChange={(e) => setValue2(e.target.value)}
          />
          <InputGroup.Addon>
            <input type="checkbox" />
          </InputGroup.Addon>
        </InputGroup>
      </div>
    </div>
  );
}

function Sizing() {
  const [value, setValue] = useState('');
  return (
    <div className="space-y-8">
      <InputGroup size="small">
        <InputGroup.Addon>Small</InputGroup.Addon>
        <InputGroup.Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </InputGroup>

      <InputGroup>
        <InputGroup.Addon>Default</InputGroup.Addon>
        <InputGroup.Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </InputGroup>

      <InputGroup size="large">
        <InputGroup.Addon>Large</InputGroup.Addon>
        <InputGroup.Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </InputGroup>
    </div>
  );
}
