import { render } from '@/react-tools/test-utils';

import { LoadingButton } from './LoadingButton';

test('when isLoading is true should show spinner and loading text', async () => {
  const loadingText = 'loading';
  const children = 'not visible';

  const { queryByText, findByText, container } = render(
    <LoadingButton loadingText={loadingText} isLoading>
      {children}
    </LoadingButton>
  );

  const spinner = container.querySelector('svg');
  expect(spinner).toBeVisible();

  const buttonLabel = queryByText(children);
  expect(buttonLabel).toBeNull();

  const loadingTextElem = await findByText(loadingText);
  expect(loadingTextElem).toBeVisible();
});

test('should show children when false', async () => {
  const loadingText = 'loading';
  const children = 'visible';

  const { queryByText, container } = render(
    <LoadingButton loadingText={loadingText} isLoading={false}>
      {children}
    </LoadingButton>
  );

  const buttonLabel = queryByText(children);
  expect(buttonLabel).toBeVisible();

  const spinner = container.querySelector('svg');
  expect(spinner).toBeNull();

  const loadingTextElem = queryByText(loadingText);
  expect(loadingTextElem).toBeNull();
});
