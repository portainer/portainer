import { Meta } from '@storybook/react';

import { init as initFeatureService } from '@/portainer/feature-flags/feature-flags.service';
import { Edition, FeatureId } from '@/portainer/feature-flags/enums';

import { BoxSelectorItem } from './BoxSelectorItem';
import { BoxSelectorOption } from './types';

const meta: Meta = {
  title: 'BoxSelector/Item',
  args: {
    selected: false,
    description: 'description',
    icon: 'fa-rocket',
    label: 'label',
  },
};

export default meta;

interface ExampleProps {
  selected?: boolean;
  description?: string;
  icon?: string;
  label?: string;
  feature?: FeatureId;
}

function Template({
  selected,
  description = 'description',
  icon,
  label = 'label',
  feature,
}: ExampleProps) {
  const option: BoxSelectorOption<number> = {
    description,
    icon: `fa ${icon}`,
    id: 'id',
    label,
    value: 1,
    feature,
  };

  return (
    <div className="boxselector_wrapper">
      <BoxSelectorItem
        onChange={() => {}}
        option={option}
        radioName="radio"
        selectedValue={selected ? option.value : 0}
      />
    </div>
  );
}

export const Example = Template.bind({});

export function SelectedItem() {
  return <Template selected />;
}

SelectedItem.args = {
  selected: true,
};

export function LimitedFeatureItem() {
  initFeatureService(Edition.CE);

  return <Template feature={FeatureId.ACTIVITY_AUDIT} />;
}

export function SelectedLimitedFeatureItem() {
  initFeatureService(Edition.CE);

  return <Template feature={FeatureId.ACTIVITY_AUDIT} selected />;
}
