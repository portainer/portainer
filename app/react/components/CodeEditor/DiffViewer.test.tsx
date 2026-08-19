import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { DiffViewer } from './DiffViewer';

// Mock CodeMirror
vi.mock('@uiw/react-codemirror', () => ({
  __esModule: true,
  default: () => <div data-cy="mock-editor" />,
  oneDarkHighlightStyle: {},
  keymap: {
    of: () => ({}),
  },
}));

// Mock react-codemirror-merge
vi.mock('react-codemirror-merge', () => {
  function CodeMirrorMerge({ children }: { children: React.ReactNode }) {
    return <div data-cy="mock-code-mirror-merge">{children}</div>;
  }
  function Original({ value }: { value: string }) {
    return <div data-cy="mock-original">{value}</div>;
  }
  function Modified({ value }: { value: string }) {
    return <div data-cy="mock-modified">{value}</div>;
  }

  CodeMirrorMerge.Original = Original;
  CodeMirrorMerge.Modified = Modified;

  return {
    __esModule: true,
    default: CodeMirrorMerge,
    CodeMirrorMerge,
  };
});

describe('DiffViewer', () => {
  beforeEach(() => {
    // Clear any mocks or state before each test
    vi.clearAllMocks();
  });

  it('should render with basic props', () => {
    const { getByText } = render(
      <DiffViewer
        originalCode="Original text"
        newCode="New text"
        id="test-diff-viewer"
        data-cy="test-diff-viewer"
      />
    );

    // Check if the component renders with the expected content
    expect(getByText('Original text')).toBeInTheDocument();
    expect(getByText('New text')).toBeInTheDocument();
  });

  it('should render with file name headers when provided', () => {
    const { getByText } = render(
      <DiffViewer
        originalCode="Original text"
        newCode="New text"
        id="test-diff-viewer"
        data-cy="test-diff-viewer"
        fileNames={{
          original: 'Original File',
          modified: 'Modified File',
        }}
      />
    );

    // Look for elements with the expected class structure
    const headerOriginal = getByText('Original File');
    const headerModified = getByText('Modified File');
    expect(headerOriginal).toBeInTheDocument();
    expect(headerModified).toBeInTheDocument();
  });

  it('should apply custom height when provided', () => {
    const customHeight = '800px';
    const { container } = render(
      <DiffViewer
        originalCode="Original text"
        newCode="New text"
        id="test-diff-viewer"
        data-cy="test-diff-viewer"
        height={customHeight}
      />
    );

    // Find the element with the style containing the height
    const divWithStyle = container.querySelector('[style*="height"]');
    expect(divWithStyle).toBeInTheDocument();

    // Check that the style contains the expected height
    expect(divWithStyle?.getAttribute('style')).toContain(
      `height: ${customHeight}`
    );
  });
});
