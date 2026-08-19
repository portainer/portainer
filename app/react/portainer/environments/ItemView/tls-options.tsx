import { Shield } from 'lucide-react';

import { BoxSelectorOption } from '@@/BoxSelector';

export const tlsOptions: ReadonlyArray<BoxSelectorOption<string>> = [
  {
    id: 'tls_client_ca',
    value: 'tls_client_ca',
    icon: Shield,
    iconType: 'badge',
    label: 'TLS with server and client verification',
    description: 'Use client certificates and server verification',
  },
  {
    id: 'tls_client_noca',
    value: 'tls_client_noca',
    icon: Shield,
    iconType: 'badge',
    label: 'TLS with client verification only',
    description: 'Use client certificates without server verification',
  },
  {
    id: 'tls_ca',
    value: 'tls_ca',
    icon: Shield,
    iconType: 'badge',
    label: 'TLS with server verification only',
    description: 'Only verify the server certificate',
  },
  {
    id: 'tls_only',
    value: 'tls_only',
    icon: Shield,
    iconType: 'badge',
    label: 'TLS only',
    description: 'No server/client verification',
  },
] as const;
