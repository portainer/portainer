import { KVM } from '@open-amt-cloud-toolkit/ui-toolkit-react/reactjs/src/kvm.bundle';
import { useTranslation } from 'react-i18next';

import './KVMControl.css';

export interface KVMControlProps {
  deviceId: string;
  server: string;
  token: string;
}

export function KVMControl({ deviceId, server, token }: KVMControlProps) {
  const { t } = useTranslation();
  if (!deviceId || !server || !token) return <div>{t('common.loading')}</div>;

  return (
    <KVM
      deviceId={deviceId}
      mpsServer={`https://${server}/mps/ws/relay`}
      authToken={token}
      mouseDebounceTime="200"
      canvasHeight="100%"
      canvasWidth="100%"
    />
  );
}
