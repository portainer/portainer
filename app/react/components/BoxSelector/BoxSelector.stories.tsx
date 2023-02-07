import { Meta } from '@storybook/react';
import { useState } from 'react';
import { Anchor, Briefcase } from 'lucide-react';

import Docker from '@/assets/ico/vendor/docker.svg?c';
import { init as initFeatureService } from '@/react/portainer/feature-flags/feature-flags.service';
import { Edition, FeatureId } from '@/react/portainer/feature-flags/enums';

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
      icon: Anchor,
      iconType: 'badge',
      id: '1',
      value: 3,
      label: 'option 1',
    },
    {
      description: 'description 2',
      icon: Briefcase,
      iconType: 'badge',
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
      icon: Anchor,
      iconType: 'badge',
      id: '1',
      value: 3,
      label: 'option 1',
    },
    {
      description: 'description 2',
      icon: Briefcase,
      iconType: 'badge',
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

export function MultiSelect() {
  const [value, setValue] = useState([3]);
  const options: BoxSelectorOption<number>[] = [
    {
      description: 'description 1',
      icon: Anchor,
      iconType: 'badge',
      id: '1',
      value: 1,
      label: 'option 1',
    },
    {
      description: 'description 2',
      icon: Briefcase,
      iconType: 'badge',
      id: '2',
      value: 2,
      label: 'option 2',
    },
    {
      description: 'description 3',
      icon: Docker,
      id: '3',
      value: 3,
      label: 'option 2',
    },
  ];

  return (
    <BoxSelector
      isMulti
      radioName="name"
      onChange={(value: number[]) => {
        setValue(value);
      }}
      value={value}
      options={options}
    />
  );
}

export function SlimMultiSelect() {
  const [value, setValue] = useState([3]);
  const options: BoxSelectorOption<number>[] = [
    {
      description: 'description 1',
      icon: Anchor,
      iconType: 'badge',
      id: '1',
      value: 1,
      label: 'option 1',
    },
    {
      description: 'description 2',
      icon: Briefcase,
      iconType: 'badge',
      id: '2',
      value: 2,
      label: 'option 2',
    },
    {
      description: 'description 3',
      icon: Docker,
      id: '3',
      value: 3,
      label: 'option 2',
    },
  ];

  return (
    <BoxSelector
      isMulti
      radioName="name"
      onChange={(value: number[]) => {
        setValue(value);
      }}
      value={value}
      options={options}
      slim
    />
  );
}
