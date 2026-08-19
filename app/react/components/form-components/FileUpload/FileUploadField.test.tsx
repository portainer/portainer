import { fireEvent, render } from '@testing-library/react';

import { FileUploadField } from './FileUploadField';

test('render should make the file button clickable and fire onChange event after click', async () => {
  const onClick = vi.fn();
  const { findByText, findByTestId } = render(
    <FileUploadField
      title="test button"
      data-cy="file-upload"
      onChange={onClick}
      inputId="file-field"
    />
  );

  const button = await findByText('test button');
  expect(button).toBeVisible();

  const input = await findByTestId('file-upload-input');
  expect(input).not.toBeNull();

  const mockFile = new File([], 'file.txt');
  if (input) {
    fireEvent.change(input, {
      target: { files: [mockFile] },
    });
  }
  expect(onClick).toHaveBeenCalledWith(mockFile);
});

describe('state icons', () => {
  test('renders a spinning icon when state is uploading', () => {
    const { getByTestId } = render(
      <FileUploadField
        inputId="file-field"
        onChange={() => {}}
        state="uploading"
        data-cy="file-upload"
      />
    );

    expect(getByTestId('file-upload-uploading-icon')).toBeVisible();
  });

  test('renders a success icon when state is success', () => {
    const { getByTestId } = render(
      <FileUploadField
        inputId="file-field"
        onChange={() => {}}
        state="success"
        data-cy="file-upload"
      />
    );

    expect(getByTestId('file-upload-success-icon')).toBeVisible();
  });

  test('shows state icon even when hideFilename is true', () => {
    const { getByTestId } = render(
      <FileUploadField
        inputId="file-field"
        onChange={() => {}}
        state="success"
        hideFilename
        data-cy="file-upload"
      />
    );

    expect(getByTestId('file-upload-success-icon')).toBeVisible();
  });

  test('shows danger icon when required and no state or file', () => {
    const { getByTestId } = render(
      <FileUploadField
        inputId="file-field"
        onChange={() => {}}
        required
        hideFilename
        data-cy="file-upload"
      />
    );

    expect(getByTestId('file-upload-required-icon')).toBeVisible();
  });
});

describe('disabled prop', () => {
  test('disables both the button and the hidden input when disabled is true', () => {
    const { getByRole, getByTestId } = render(
      <FileUploadField
        inputId="file-field"
        data-cy="file-upload"
        onChange={() => {}}
        disabled
        required
      />
    );

    expect(getByRole('button')).toBeDisabled();
    expect(getByTestId('file-upload-input')).toBeDisabled();
  });
});
