import { render } from '@testing-library/react';

import { FileUploadForm } from './FileUploadForm';

test('render should include description', async () => {
  const onClick = vi.fn();
  const { findByText } = render(
    <FileUploadForm
      value={undefined}
      title="test button"
      onChange={onClick}
      description={<span>test description</span>}
      data-cy="test"
    />
  );

  const button = await findByText('test button');
  expect(button).toBeVisible();

  const description = await findByText('test description');
  expect(description).toBeVisible();
});
