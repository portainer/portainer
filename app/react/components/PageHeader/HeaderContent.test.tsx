import { renderWithQueryClient } from '@/react-tools/test-utils';

import { HeaderContainer } from './HeaderContainer';
import { HeaderContent } from './HeaderContent';

test('should not render without a wrapping HeaderContainer', async () => {
  const consoleErrorFn = jest
    .spyOn(console, 'error')
    .mockImplementation(() => jest.fn());

  function renderComponent() {
    return renderWithQueryClient(<HeaderContent />);
  }

  expect(renderComponent).toThrowErrorMatchingSnapshot();

  consoleErrorFn.mockRestore();
});

test('should display a HeaderContent', async () => {
  const content = 'content';

  const { queryByText } = renderWithQueryClient(
    <HeaderContainer>
      <HeaderContent>{content}</HeaderContent>
    </HeaderContainer>
  );

  const contentElement = queryByText(content);
  expect(contentElement).toBeVisible();
});
