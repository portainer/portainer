import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { ExpandableMessageByLines } from '@@/ExpandableMessageByLines';

describe('ExpandableMessageByLines', () => {
  // Mock scrollHeight and clientHeight for testing truncation
  const mockScrollHeight = vi.fn();
  const mockClientHeight = vi.fn();

  beforeEach(() => {
    // Mock the properties on HTMLDivElement prototype
    Object.defineProperty(HTMLDivElement.prototype, 'scrollHeight', {
      get: mockScrollHeight,
      configurable: true,
    });

    Object.defineProperty(HTMLDivElement.prototype, 'clientHeight', {
      get: mockClientHeight,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render text content', () => {
      const text = 'This is test content';
      // Mock non-truncated content (scrollHeight === clientHeight)
      mockScrollHeight.mockReturnValue(100);
      mockClientHeight.mockReturnValue(100);

      render(<ExpandableMessageByLines>{text}</ExpandableMessageByLines>);

      expect(screen.getByText(text)).toBeInTheDocument();
    });

    it('should show expand button only when text is truncated', () => {
      const text = 'This is test content that should be truncated';
      // Mock truncated content (scrollHeight > clientHeight)
      mockScrollHeight.mockReturnValue(300);
      mockClientHeight.mockReturnValue(200);

      render(<ExpandableMessageByLines>{text}</ExpandableMessageByLines>);

      expect(
        screen.getByRole('button', { name: 'Show more' })
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('expandable-message-lines-button')
      ).toBeInTheDocument();
    });

    it('should hide expand button when text is not truncated', () => {
      const text = 'Short text';
      // Mock non-truncated content (scrollHeight === clientHeight)
      mockScrollHeight.mockReturnValue(50);
      mockClientHeight.mockReturnValue(50);

      render(<ExpandableMessageByLines>{text}</ExpandableMessageByLines>);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('expandable-message-lines-button')
      ).not.toBeInTheDocument();
    });
  });

  describe('Expand/Collapse Functionality', () => {
    it('should toggle between Show more and Show less when button is clicked', async () => {
      const user = userEvent.setup();
      const text =
        'This is a long text that should be truncated and show the expand button';

      // Mock truncated content (scrollHeight > clientHeight)
      mockScrollHeight.mockReturnValue(400);
      mockClientHeight.mockReturnValue(200);

      render(<ExpandableMessageByLines>{text}</ExpandableMessageByLines>);

      const button = screen.getByRole('button');

      // Initially should show "Show more"
      expect(screen.getByText('Show more')).toBeInTheDocument();

      // Click to expand
      await user.click(button);
      expect(screen.getByText('Show less')).toBeInTheDocument();

      // Click to collapse
      await user.click(button);
      expect(screen.getByText('Show more')).toBeInTheDocument();
    });
  });

  describe('Text Content Handling', () => {
    it('should not show button for single space strings when not truncated', () => {
      // Mock non-truncated content (scrollHeight === clientHeight)
      mockScrollHeight.mockReturnValue(20);
      mockClientHeight.mockReturnValue(20);

      render(<ExpandableMessageByLines> </ExpandableMessageByLines>);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should show button for single space strings when truncated', () => {
      // Mock truncated content (scrollHeight > clientHeight)
      mockScrollHeight.mockReturnValue(100);
      mockClientHeight.mockReturnValue(50);

      render(<ExpandableMessageByLines> </ExpandableMessageByLines>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle different maxLines values', () => {
      const longText =
        'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10\nLine 11\nLine 12';
      // Mock truncated content for 5 lines (scrollHeight > clientHeight)
      mockScrollHeight.mockReturnValue(240);
      mockClientHeight.mockReturnValue(100);

      render(
        <ExpandableMessageByLines maxLines={5}>
          {longText}
        </ExpandableMessageByLines>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Show more')).toBeInTheDocument();
    });
  });
});
