import { useTranslation } from 'react-i18next';

import { withLimitToBE } from '@/react/hooks/useLimitToBE';

import { InformationPanel } from '@@/InformationPanel';
import { TextTip } from '@@/Tip/TextTip';
import { PageHeader } from '@@/PageHeader';
import { Link } from '@@/Link';
import { Alert } from '@@/Alert';

import { Datatable } from './Datatable';
import { useLicenseOverused, useUntrustedCount } from './queries';

export default withLimitToBE(WaitingRoomView);

function WaitingRoomView() {
  const { t } = useTranslation();
  const untrustedCount = useUntrustedCount();
  const licenseOverused = useLicenseOverused(untrustedCount);
  return (
    <>
      <PageHeader
        title={t('edge.waiting_room')}
        breadcrumbs={[{ label: t('edge.waiting_room') }]}
        reload
      />

      <div className="row">
        <div className="col-sm-12">
          <InformationPanel>
            <TextTip color="blue">
              {t('edge.waiting_room_info_prefix')}{' '}
              <Link
                to="portainer.endpoints.edgeAutoCreateScript"
                data-cy="waitingRoom-edgeAutoCreateScriptLink"
              >
                {t('edge.waiting_room_info_link')}
              </Link>{' '}
              {t('edge.waiting_room_info_suffix')}
            </TextTip>
          </InformationPanel>
        </div>
      </div>

      {licenseOverused && (
        <div className="row">
          <div className="col-sm-12">
            <Alert color="warn">
              {t('edge.waiting_room_license_prefix')}{' '}
              <Link
                to="portainer.licenses"
                data-cy="waitingRoom-portainerLicensesLink"
              >
                {t('edge.waiting_room_license_link')}
              </Link>{' '}
              {t('edge.waiting_room_license_suffix')}
            </Alert>
          </div>
        </div>
      )}

      <Datatable />
    </>
  );
}
