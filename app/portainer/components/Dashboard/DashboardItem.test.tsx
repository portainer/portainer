import { render } from '@/react-tools/test-utils';

import { DashboardItem } from './DashboardItem';

test('should show provided resource value', async () => {
  const { getByLabelText } = renderComponent(1);
  const value = getByLabelText('value');

  expect(value).toBeVisible();
  expect(value).toHaveTextContent('1');
});

test('should show provided icon', async () => {
  const { getByLabelText } = renderComponent(0, 'fa fa-th-list');
  const icon = getByLabelText('icon');
  expect(icon).toHaveClass('fa-th-list');
});

test('should show provided comment', async () => {
  const { getByLabelText } = renderComponent(0, '', 'Test');
  const title = getByLabelText('resourceType');

  expect(title).toBeVisible();
  expect(title).toHaveTextContent('Test');
});

test('should have provided accesibility label', async () => {
  const { getByLabelText } = renderComponent(0, '', '', 'test-label');

  expect(getByLabelText('test-label')).toBeTruthy();
});

function renderComponent(
  value = 0,
  icon = '',
  comment = '',
  accessibilityLabel = ''
) {
  return render(
    <DashboardItem
      value={value}
      icon={icon}
      comment={comment}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
