import { fireEvent, render } from '@/react-tools/test-utils';

import { FileUploadField } from './FileUploadField';

test('render should make the file button clickable and fie onChange event', async () => {
  const onClick = jest.fn();
  const { findByText } = render(
    <FileUploadField title="test button" onChange={onClick} />
  );

  const button = await findByText('test button');
  expect(button).toBeVisible();

  const input = button.previousElementSibling;
  expect(input).not.toBeNull();

  const mockFile = new File([], 'file.txt');
  if (input) {
    fireEvent.change(input, {
      target: { files: [mockFile] },
    });
  }
  expect(onClick).toHaveBeenCalledTimes(1);
});
