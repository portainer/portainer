import userEvent from '@testing-library/user-event';
import { PropsWithChildren } from 'react';

import { render } from '@/react-tools/test-utils';

import { AppTemplatesListItem } from './AppTemplatesListItem';
import { TemplateViewModel } from './view-model';
import { TemplateType } from './types';

test('should render AppTemplatesListItem component', () => {
  const template: TemplateViewModel = {
    Title: 'Test Template',
    // provide necessary properties for the template object
  } as TemplateViewModel;

  const onSelect = vi.fn();
  const isSelected = false;

  const { getByText } = render(
    <AppTemplatesListItem
      template={template}
      onSelect={onSelect}
      isSelected={isSelected}
    />
  );

  expect(getByText(template.Title, { exact: false })).toBeInTheDocument();
});

const copyAsCustomTestCases = [
  {
    type: TemplateType.Container,
    expected: false,
  },
  {
    type: TemplateType.ComposeStack,
    expected: true,
  },
  {
    type: TemplateType.SwarmStack,
    expected: true,
  },
];

// TODO - remove after fixing workaround for UISref
vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  UISref: ({ children }: PropsWithChildren<unknown>) => children, // Mocking UISref to render its children directly
}));

copyAsCustomTestCases.forEach(({ type, expected }) => {
  test(`copy as custom button should ${
    expected ? '' : 'not '
  }be rendered for type ${type}`, () => {
    const onSelect = vi.fn();
    const isSelected = false;

    const { queryByText, unmount } = render(
      <AppTemplatesListItem
        template={
          {
            Type: type,
          } as TemplateViewModel
        }
        onSelect={onSelect}
        isSelected={isSelected}
      />
    );

    if (expected) {
      expect(queryByText('Copy as Custom')).toBeVisible();
    } else {
      expect(queryByText('Copy as Custom')).toBeNull();
    }

    unmount();
  });
});

test('should call onSelect when clicked', async () => {
  const user = userEvent.setup();
  const template: TemplateViewModel = {
    Title: 'Test Template',
    // provide necessary properties for the template object
  } as TemplateViewModel;

  const onSelect = vi.fn();
  const isSelected = false;

  const { getByLabelText } = render(
    <AppTemplatesListItem
      template={template}
      onSelect={onSelect}
      isSelected={isSelected}
    />
  );

  const button = getByLabelText(template.Title);
  await user.click(button);

  expect(onSelect).toHaveBeenCalledWith(template);
});
