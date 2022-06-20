import { createMockEnvironment } from '@/react-tools/test-mocks';
import { renderWithQueryClient } from '@/react-tools/test-utils';

import { EdgeIndicator } from './EdgeIndicator';

test('when edge id is not set, should show unassociated label', () => {
  const { queryByLabelText } = renderComponent();

  const unassociatedLabel = queryByLabelText('unassociated');

  expect(unassociatedLabel).toBeVisible();
});

test('given edge id and last checkin is set, should show heartbeat', () => {
  const { queryByLabelText } = renderComponent('id', 1);

  expect(queryByLabelText('edge-heartbeat')).toBeVisible();
  expect(queryByLabelText('edge-last-checkin')).toBeVisible();
});

function renderComponent(
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

  return renderWithQueryClient(
    <EdgeIndicator environment={environment} showLastCheckInDate />
  );
}
