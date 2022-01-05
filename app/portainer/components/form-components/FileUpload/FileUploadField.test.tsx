import { fireEvent, render } from '@/react-tools/test-utils';

import { FileUploadField } from './FileUploadField';

test('render should make the file button clickable and fire onChange event after click', async () => {
  const onClick = jest.fn();
  const { findByText, findByLabelText } = render(
    <FileUploadField title="test button" onChange={onClick} />
  );

  const button = await findByText('test button');
  expect(button).toBeVisible();

  const input = await findByLabelText('file-input');
  expect(input).not.toBeNull();

  const mockFile = new File([], 'file.txt');
  if (input) {
    fireEvent.change(input, {
      target: { files: [mockFile] },
    });
  }
  expect(onClick).toHaveBeenCalledWith(mockFile);
});
