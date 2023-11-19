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
  const untrustedCount = useUntrustedCount();
  const licenseOverused = useLicenseOverused(untrustedCount);
  return (
    <>
      <PageHeader
        title="Waiting Room"
        breadcrumbs={[{ label: 'Waiting Room' }]}
      />

      <InformationPanel>
        <TextTip color="blue">
          Only environments generated from the AEEC script will appear here,
          manually added environments and edge devices will bypass the waiting
          room.
        </TextTip>
      </InformationPanel>

      {licenseOverused && (
        <div className="row">
          <div className="col-sm-12">
            <Alert color="warn">
              Associating all nodes in waiting room will exceed the node limit
              of your current license. Go to{' '}
              <Link to="portainer.licenses">Licenses</Link> page to view the
              current usage.
            </Alert>
          </div>
        </div>
      )}

      <Datatable />
    </>
  );
}
