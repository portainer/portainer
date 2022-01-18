import { Meta } from '@storybook/react';
import { useState } from 'react';

import { init as initFeatureService } from '@/portainer/feature-flags/feature-flags.service';
import { Edition, FeatureId } from '@/portainer/feature-flags/enums';

import { BoxSelector } from './BoxSelector';
import { BoxSelectorOption } from './types';

const meta: Meta = {
  title: 'BoxSelector',
  component: BoxSelector,
};

export default meta;

export { Example, LimitedFeature };

function Example() {
  const [value, setValue] = useState(3);
  const options: BoxSelectorOption<number>[] = [
    {
      description: 'description 1',
      icon: 'fa fa-rocket',
      id: '1',
      value: 3,
      label: 'option 1',
    },
    {
      description: 'description 2',
      icon: 'fa fa-rocket',
      id: '2',
      value: 4,
      label: 'option 2',
    },
  ];

  return (
    <BoxSelector
      radioName="name"
      onChange={(value: number) => {
        setValue(value);
      }}
      value={value}
      options={options}
    />
  );
}

function LimitedFeature() {
  initFeatureService(Edition.CE);
  const [value, setValue] = useState(3);
  const options: BoxSelectorOption<number>[] = [
    {
      description: 'description 1',
      icon: 'fa fa-rocket',
      id: '1',
      value: 3,
      label: 'option 1',
    },
    {
      description: 'description 2',
      icon: 'fa fa-rocket',
      id: '2',
      value: 4,
      label: 'option 2',
      feature: FeatureId.ACTIVITY_AUDIT,
    },
  ];

  return (
    <BoxSelector
      radioName="name"
      onChange={(value: number) => {
        setValue(value);
      }}
      value={value}
      options={options}
    />
  );
}

// regular example

// story with limited feature
