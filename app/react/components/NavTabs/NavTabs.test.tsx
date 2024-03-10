import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';

import { withTestRouter } from '@/react/test-utils/withRouter';

import { NavTabs, Option } from './NavTabs';

test('should show titles', async () => {
  const options = [
    { children: 'Content 1', id: 'option1', label: 'Option 1' },
    { children: 'Content 2', id: 'option2', label: 'Option 2' },
  ];
  const { findByText } = renderComponent(options);

  const heading = await findByText(options[0].label);
  expect(heading).toBeTruthy();

  const heading2 = await findByText(options[1].label);
  expect(heading2).toBeTruthy();
});

test('should show selected id content', async () => {
  const options = [
    { children: 'Content 1', id: 'option1', label: 'Option 1' },
    { children: 'Content 2', id: 'option2', label: 'Option 2' },
  ];

  const selected = options[1];

  const { findByText } = renderComponent(options, selected.id);

  const content = await findByText(selected.children);
  expect(content).toBeTruthy();
});

test('should call onSelect when clicked with id', async () => {
  const user = userEvent.setup();
  const options = [
    { children: 'Content 1', id: 'option1', label: 'Option 1' },
    { children: 'Content 2', id: 'option2', label: 'Option 2' },
  ];

  const onSelect = vi.fn();

  const { findByText } = renderComponent(options, options[1].id, onSelect);

  const heading = await findByText(options[0].label);
  await user.click(heading);

  expect(onSelect).toHaveBeenCalledWith(options[0].id);
});

function renderComponent(
  options: Option[] = [],
  selectedId?: string | number,
  onSelect?: (id: string | number) => void
) {
  const Wrapped = withTestRouter(NavTabs);

  return render(
    <Wrapped options={options} selectedId={selectedId} onSelect={onSelect} />
  );
}
