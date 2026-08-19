import { http, HttpResponse } from 'msw';
import { render } from '@testing-library/react';

import { server } from '@/setup-tests/server';
import { isoDate } from '@/portainer/filters/filters';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { BackupFailedPanel } from './BackupFailedPanel';

test('when backup failed, should show message', async () => {
  const timestamp = 1500;

  const { findByText } = renderComponent({ failed: true, timestamp });

  await expect(
    findByText(
      `The latest automated backup has failed at ${isoDate(
        timestamp
      )}. For details please see the log files and have a look at the`,
      { exact: false }
    )
  ).resolves.toBeVisible();
});

test("when user is using less nodes then allowed he shouldn't see message", async () => {
  const { findByText } = renderComponent({ failed: false });

  await expect(
    findByText('The latest automated backup has failed at', { exact: false })
  ).rejects.toBeTruthy();
});

function renderComponent({
  failed,
  timestamp,
}: {
  failed: boolean;
  timestamp?: number;
}) {
  server.use(
    http.get('/api/backup/s3/status', () =>
      HttpResponse.json({ Failed: failed, TimestampUTC: timestamp })
    )
  );

  const Wrapped = withTestQueryProvider(withTestRouter(BackupFailedPanel));

  return render(<Wrapped />);
}
