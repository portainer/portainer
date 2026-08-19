import { http, HttpResponse } from 'msw';

import { PublicSettingsResponse } from '@/react/portainer/settings/types';

export const settingsHandlers = [
  http.get('/api/ssl', () => HttpResponse.json({})),
  http.get('/api/settings', () => HttpResponse.json({})),
  http.get('/api/settings/edge/mtls_certificate', () => HttpResponse.json({})),
  http.get('/api/settings/edge/mtls_ca_certificate', () =>
    HttpResponse.json({})
  ),
  http.get('/api/settings/additional_functionality', () =>
    HttpResponse.json({})
  ),
  http.get('/api/support/debug_log', () => HttpResponse.json({})),
  http.get<never, never, Partial<PublicSettingsResponse>>(
    '/api/settings/public',
    () =>
      HttpResponse.json({
        Edge: {
          AsyncMode: false,
          CheckinInterval: 60,
          CommandInterval: 60,
          PingInterval: 60,
          SnapshotInterval: 60,
        },
        GlobalDeploymentOptions: {
          perEnvOverride: false,
          hideAddWithForm: false,
          hideFileUpload: false,
          hideStacksFunctionality: false,
          hideWebEditor: false,
          requireNoteOnApplications: false,
          minApplicationNoteLength: 0,
        },
        Features: {},
      } satisfies Partial<PublicSettingsResponse>)
  ),
];
