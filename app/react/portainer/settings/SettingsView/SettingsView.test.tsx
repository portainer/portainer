import { render } from '@testing-library/react';
import { HttpResponse, http } from 'msw';

import { withTestRouter } from '@/react/test-utils/withRouter';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { server } from '@/setup-tests/server';

import { SettingsView } from './SettingsView';

describe('SettingsView', () => {
  function setupMocks() {
    // Mock the settings API endpoints
    server.use(
      http.get('/api/settings', () =>
        HttpResponse.json({
          LogoURL: '',
          SnapshotInterval: '5m',
          EnableTelemetry: false,
        })
      )
    );

    server.use(
      http.get('/api/settings/experimental', () =>
        HttpResponse.json({
          experimentalFeatures: {},
        })
      )
    );

    // Mock public settings for feature flags
    server.use(
      http.get('/api/settings/public', () =>
        HttpResponse.json({
          Features: {
            'auto-patch': false,
            'disable-roles-sync': false,
          },
        })
      )
    );

    // Mock SSL settings
    server.use(
      http.get('/api/ssl', () =>
        HttpResponse.json({
          HTTPSOnly: false,
          SelfSigned: false,
        })
      )
    );

    // Mock debug settings
    server.use(
      http.get('/api/support/debug_log', () =>
        HttpResponse.json({
          LogLevel: 'INFO',
          EnableProfiling: false,
        })
      )
    );

    // Mock backup S3 settings
    server.use(
      http.get('/api/backup/s3/settings', () =>
        HttpResponse.json({
          Enabled: false,
          AccessKey: '',
          SecretKey: '',
          Region: '',
          Bucket: '',
        })
      )
    );
  }

  function renderComponent() {
    const Wrapped = withTestQueryProvider(
      withUserProvider(withTestRouter(SettingsView))
    );
    return render(<Wrapped />);
  }

  describe('Experimental Features', () => {
    test('should NOT render ExperimentalFeatures component in CE edition', async () => {
      setupMocks();
      const { queryByText } = renderComponent();

      // Check that the ExperimentalFeatures component is NOT rendered
      const experimentalFeaturesTitle = queryByText('Experimental features');
      expect(experimentalFeaturesTitle).not.toBeInTheDocument();
    });
  });
});
