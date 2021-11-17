import { Meta } from '@storybook/react';
import { UIRouter, pushStateLocationPlugin } from '@uirouter/react';

import { Link } from '@/portainer/components/Link';

import { Breadcrumbs } from './Breadcrumbs';

const meta: Meta = {
  title: 'Components/Header/Breadcrumbs',
  component: Breadcrumbs,
};

export default meta;

export function Example() {
  return (
    <UIRouter plugins={[pushStateLocationPlugin]}>
      <Breadcrumbs>
        <Link to="portainer.endpoints">Environments</Link>
        <Link to="portainer.endpoints.endpoint({id: endpoint.Id})">
          endpointName
        </Link>
        String item
      </Breadcrumbs>
    </UIRouter>
  );
}
