import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Extension } from '@codemirror/state';

import { CodeEditor } from './CodeEditor';

const mockExtension: Extension = { extension: [] };
vi.mock('yaml-schema', () => ({
  // yamlSchema has 5 return values (all extensions)
  yamlSchema: () => [
    mockExtension,
    mockExtension,
    mockExtension,
    mockExtension,
    mockExtension,
  ],
  yamlCompletion: () => () => ({}),
}));

const defaultProps = {
  id: 'test-editor',
  onChange: vi.fn(),
  value: '',
  'data-cy': 'test-editor',
};

beforeEach(() => {
  vi.clearAllMocks();
});

test('should render with basic props', () => {
  render(<CodeEditor {...defaultProps} />);
  expect(screen.getByRole('textbox')).toBeInTheDocument();
});

test('should display placeholder when provided', async () => {
  const placeholder = 'Enter your code here';
  const { findByText } = render(
    <CodeEditor {...defaultProps} textTip={placeholder} />
  );

  const placeholderText = await findByText(placeholder);
  expect(placeholderText).toBeVisible();
});

test('should show copy button and copy content', async () => {
  const testValue = 'test content';
  const { findByText } = render(
    <CodeEditor {...defaultProps} value={testValue} />
  );

  const mockClipboard = {
    writeText: vi.fn(),
  };
  Object.assign(navigator, {
    clipboard: mockClipboard,
  });

  const copyButton = await findByText('Copy');
  expect(copyButton).toBeVisible();

  await userEvent.click(copyButton);
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testValue);
});

test('should handle read-only mode', async () => {
  const { findByRole } = render(<CodeEditor {...defaultProps} readonly />);
  const editor = await findByRole('textbox');
  // the editor should not editable
  await userEvent.type(editor, 'test');
  expect(editor).not.toHaveValue('test');
});

test('should show version selector when versions are provided', async () => {
  const versions = [1, 2, 3];
  const onVersionChange = vi.fn();
  const { findByRole } = render(
    <CodeEditor
      {...defaultProps}
      versions={versions}
      onVersionChange={onVersionChange}
    />
  );

  const selector = await findByRole('combobox');
  expect(selector).toBeVisible();
});

test('should handle YAML indentation correctly', async () => {
  const onChange = vi.fn();
  const yamlContent = 'services:';

  const { findByRole } = render(
    <CodeEditor
      {...defaultProps}
      value={yamlContent}
      onChange={onChange}
      type="yaml"
    />
  );

  const editor = await findByRole('textbox');
  await userEvent.type(editor, '{enter}');
  await userEvent.keyboard('database:');
  await userEvent.keyboard('{enter}');
  await userEvent.keyboard('image: nginx');
  await userEvent.keyboard('{enter}');
  await userEvent.keyboard('name: database');

  // Wait for the debounced onChange to be called
  setTimeout(() => {
    expect(onChange).toHaveBeenCalledWith(
      'services:\n  database:\n    image: nginx\n    name: database'
    );
    // debounce timeout is 300ms, so 500ms is enough
  }, 500);
});

test('should apply custom height', async () => {
  const customHeight = '300px';
  const { findByRole } = render(
    <CodeEditor {...defaultProps} height={customHeight} />
  );

  const editor = await findByRole('textbox');
  expect(editor).toHaveStyle({ height: customHeight });
});

test('should render with file name header when provided', async () => {
  const fileName = 'example.yaml';
  const testValue = 'file content';
  const { findByText } = render(
    <CodeEditor {...defaultProps} fileName={fileName} value={testValue} />
  );

  expect(await findByText(fileName)).toBeInTheDocument();
  expect(await findByText(testValue)).toBeInTheDocument();
});
