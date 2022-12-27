import { createMockEnvironment } from '@/react-tools/test-mocks';
import { renderWithQueryClient } from '@/react-tools/test-utils';

import { EdgeIndicator } from './EdgeIndicator';

test('when edge id is not set, should show unassociated label', async () => {
  const { queryByLabelText } = await renderComponent();

  const unassociatedLabel = queryByLabelText('unassociated');

  expect(unassociatedLabel).toBeVisible();
});

test('given edge id and last checkin is set, should show heartbeat', async () => {
  const { queryByLabelText } = await renderComponent('id', 1);

  expect(queryByLabelText('edge-heartbeat')).toBeVisible();
  expect(queryByLabelText('edge-last-checkin')).toBeVisible();
});

async function renderComponent(
  edgeId = '',
  lastCheckInDate = 0,
  checkInInterval = 0,
  queryDate = 0
) {
  const environment = createMockEnvironment();

  environment.EdgeID = edgeId;
  environment.LastCheckInDate = lastCheckInDate;
  environment.EdgeCheckinInterval = checkInInterval;
  environment.QueryDate = queryDate;

  const queries = renderWithQueryClient(
    <EdgeIndicator environment={environment} showLastCheckInDate />
  );

  await expect(queries.findByRole('status')).resolves.toBeVisible();

  return queries;
}
