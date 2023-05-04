import { Meta } from '@storybook/react';
import { ReactNode } from 'react';
import { Briefcase } from 'lucide-react';

import { init as initFeatureService } from '@/react/portainer/feature-flags/feature-flags.service';
import { Edition, FeatureId } from '@/react/portainer/feature-flags/enums';
import Docker from '@/assets/ico/vendor/docker.svg?c';

import { IconProps } from '@@/Icon';

import { BoxSelectorItem } from './BoxSelectorItem';
import { BoxSelectorOption } from './types';

const meta: Meta = {
  title: 'BoxSelector/Item',
  args: {
    selected: false,
    description: 'description',
    icon: Briefcase,
    label: 'label',
  },
};

export default meta;

interface ExampleProps {
  selected?: boolean;
  description?: string;
  icon?: IconProps['icon'];
  label?: string;
  feature?: FeatureId;
}

function Template({
  selected = false,
  description = 'description',
  icon,
  label = 'label',
  feature,
}: ExampleProps) {
  const option: BoxSelectorOption<number> = {
    description,
    icon,
    id: 'id',
    label,
    value: 1,
    feature,
  };

  return (
    <div className="boxselector_wrapper">
      <BoxSelectorItem
        onSelect={() => {}}
        option={option}
        radioName="radio"
        isSelected={() => selected}
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

function IconTemplate({
  icon,
  iconType,
}: {
  icon: ReactNode;
  iconType: 'raw' | 'logo' | 'badge';
}) {
  return (
    <BoxSelectorItem
      onSelect={() => {}}
      option={{
        description: 'description',
        icon,
        iconType,
        label: 'label',
        id: 'id',
        value: 'value',
      }}
      isSelected={() => false}
      radioName="radio"
      slim
    />
  );
}

export function LogoItem() {
  return <IconTemplate icon={Docker} iconType="logo" />;
}

export function BadgeItem() {
  return <IconTemplate icon={Briefcase} iconType="badge" />;
}
