import { render } from '@/react-tools/test-utils';

import { SidebarMenuItem } from './SidebarMenuItem';

test('should be visible & have expected class', () => {
  const { getByLabelText } = renderComponent('testClass');
  const listItem = getByLabelText('sidebarItem');
  expect(listItem).toBeVisible();
  expect(listItem).toHaveClass('testClass');
});

test('icon should with correct icon if iconClass is provided', () => {
  const { getByLabelText } = renderComponent('', 'testIconClass');
  const sidebarIcon = getByLabelText('itemIcon');
  expect(sidebarIcon).toBeVisible();
  expect(sidebarIcon).toHaveClass('testIconClass');
});

test('icon should not be rendered if iconClass is not provided', () => {
  const { queryByLabelText } = renderComponent();
  expect(queryByLabelText('itemIcon')).not.toBeInTheDocument();
});

test('should render children', () => {
  const { getByLabelText } = renderComponent('', '', 'Test');
  expect(getByLabelText('sidebarItem')).toHaveTextContent('Test');
});

test('li element should have correct accessibility label', () => {
  const { queryByLabelText } = renderComponent('', '', '', 'testItemLabel');
  expect(queryByLabelText('testItemLabel')).toBeInTheDocument();
});

function renderComponent(
  className = '',
  iconClass = '',
  linkText = '',
  itemName = 'sidebarItem'
) {
  return render(
    <SidebarMenuItem
      path=""
      pathParams={{ endpointId: 1 }}
      iconClass={iconClass}
      className={className}
      itemName={itemName}
    >
      {linkText}
    </SidebarMenuItem>
  );
}
