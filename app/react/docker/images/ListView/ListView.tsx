import { useTranslation } from 'react-i18next';

import { PageHeader } from '@@/PageHeader';

import { useIsSwarmAgent } from '../../proxy/queries/useIsSwarmAgent';

import { PullImageFormWidget } from './PullImageFormWidget';
import { ImagesDatatable } from './ImagesDatatable/ImagesDatatable';

export function ListView() {
  const { t } = useTranslation();
  const isSwarmAgent = useIsSwarmAgent();

  return (
    <>
      <PageHeader title={t('docker.images.list.title')} breadcrumbs={t('docker.images.list.breadcrumb')} reload />

      <div className="row">
        <div className="col-sm-12">
          <PullImageFormWidget isNodeVisible={isSwarmAgent} />
        </div>
      </div>

      <ImagesDatatable isHostColumnVisible={isSwarmAgent} />
    </>
  );
}
