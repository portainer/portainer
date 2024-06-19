import { PageHeader } from '@@/PageHeader';

import { useIsSwarmAgent } from '../../proxy/queries/useIsSwarmAgent';

import { PullImageFormWidget } from './PullImageFormWidget';
import { ImagesDatatable } from './ImagesDatatable/ImagesDatatable';

export function ListView() {
  const isSwarmAgent = useIsSwarmAgent();

  return (
    <>
      <PageHeader title="Image list" breadcrumbs="Images" reload />

      <div className="row">
        <div className="col-sm-12">
          <PullImageFormWidget isNodeVisible={isSwarmAgent} />
        </div>
      </div>

      <ImagesDatatable isHostColumnVisible={isSwarmAgent} />
    </>
  );
}
