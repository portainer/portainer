import 'vitest-dom/extend-expect';

import { mockCodeMirror } from './mock-codemirror';

// Initialize CodeMirror module mocks
mockCodeMirror();

// Mock Range APIs that CodeMirror needs but JSDOM doesn't provide
Range.prototype.getBoundingClientRect = () => ({
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0,
  x: 0,
  y: 0,
  toJSON: vi.fn(),
});

Range.prototype.getClientRects = () => ({
  item: () => null,
  length: 0,
  [Symbol.iterator]: vi.fn(),
});

// Mock createRange
document.createRange = () => {
  const range = new Range();
  range.getBoundingClientRect = vi.fn();
  range.getClientRects = () => ({
    item: () => null,
    length: 0,
    [Symbol.iterator]: vi.fn(),
  });
  return range;
};

// Mock selection APIs
const mockSelection = {
  rangeCount: 0,
  addRange: vi.fn(),
  getRangeAt: vi.fn(),
  removeAllRanges: vi.fn(),
};

window.getSelection = () => mockSelection as unknown as Selection;
