import { Meta } from '@storybook/react';
import { Download } from 'lucide-react';

import { LoadingButton } from './LoadingButton';

export default {
  component: LoadingButton,
  title: 'Components/Buttons/LoadingButton',
} as Meta;

interface Args {
  loadingText: string;
  isLoading: boolean;
}

function Template({ loadingText, isLoading }: Args) {
  return (
    <LoadingButton
      loadingText={loadingText}
      isLoading={isLoading}
      icon={Download}
    >
      Download
    </LoadingButton>
  );
}

Template.args = {
  loadingText: 'loading',
  isLoading: false,
};

export const Example = Template.bind({});

export function IsLoading() {
  return (
    <LoadingButton loadingText="loading" isLoading icon={Download}>
      Download
    </LoadingButton>
  );
}
