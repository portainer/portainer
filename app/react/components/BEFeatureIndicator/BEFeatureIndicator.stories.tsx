import { Meta } from '@storybook/react';

import { Edition, FeatureId } from '@/portainer/feature-flags/enums';
import { init as initFeatureService } from '@/portainer/feature-flags/feature-flags.service';

import { BEFeatureIndicator, Props } from './BEFeatureIndicator';

export default {
  component: BEFeatureIndicator,
  title: 'Components/BEFeatureIndicator',
  argTypes: {
    featureId: {
      control: { type: 'select', options: Object.values(FeatureId) },
    },
  },
} as Meta<Props>;

// : JSX.IntrinsicAttributes & PropsWithChildren<Props>
function Template({ featureId }: Props) {
  initFeatureService(Edition.CE);

  return <BEFeatureIndicator featureId={featureId} />;
}

export const Example = Template.bind({});
