import { render, screen } from '@testing-library/react';

import { BadgeListCell } from './BadgeListCell';

const THREE_VALUES = ['a=1', 'b=2', 'c=3'];
const FIVE_VALUES = [...THREE_VALUES, 'd=4', 'e=5'];

describe('BadgeListCell', () => {
  it('renders a dash when there are no values', () => {
    render(<BadgeListCell values={[]} />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('shows every value inline without an overflow badge at the limit', () => {
    render(<BadgeListCell values={THREE_VALUES} />);

    THREE_VALUES.forEach((value) => {
      expect(screen.getByText(value)).toBeInTheDocument();
    });
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the first three values and counts the rest', () => {
    render(<BadgeListCell values={FIVE_VALUES} />);

    THREE_VALUES.forEach((value) => {
      expect(screen.getByText(value)).toBeInTheDocument();
    });
    expect(screen.queryByText('d=4')).not.toBeInTheDocument();
    expect(screen.queryByText('e=5')).not.toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  // Opening the tooltip on hover and on focus is Tippy's behaviour, verified in
  // a browser rather than here: driving it in jsdom leaves the popup and its
  // hide timer alive past the end of the file. What this cell owes is a trigger
  // a keyboard user can reach, carrying the values the cell had to truncate.
  it('puts the overflowing values behind a focusable trigger', () => {
    render(<BadgeListCell values={FIVE_VALUES} />);

    const trigger = screen.getByRole('button');

    expect(trigger).toHaveTextContent('+2');
    expect(trigger).toContainElement(screen.getByLabelText('d=4, e=5'));
  });
});
