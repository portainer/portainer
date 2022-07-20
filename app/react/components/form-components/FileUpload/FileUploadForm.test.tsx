import { render } from '@/react-tools/test-utils';

import { FileUploadForm } from './FileUploadForm';

test('render should include description', async () => {
  const onClick = jest.fn();
  const { findByText } = render(
    <FileUploadForm
      title="test button"
      onChange={onClick}
      description={<span>test description</span>}
    />
  );

  const button = await findByText('test button');
  expect(button).toBeVisible();

  const description = await findByText('test description');
  expect(description).toBeVisible();
});
