import { Meta } from '@storybook/react';
import { UIRouter, pushStateLocationPlugin } from '@uirouter/react';

import { Breadcrumbs } from './Breadcrumbs';

const meta: Meta = {
  title: 'Components/PageHeader/Breadcrumbs',
  component: Breadcrumbs,
};

export default meta;

export { Example };

function Example() {
  return (
    <UIRouter plugins={[pushStateLocationPlugin]}>
      <Breadcrumbs
        breadcrumbs={[
          { link: 'portainer.endpoints', label: 'Environments' },
          {
            label: 'endpointName',
            link: 'portainer.endpoints.endpoint',
            linkParams: { id: 5 },
          },
          { label: 'String item' },
        ]}
      />
    </UIRouter>
  );
}
