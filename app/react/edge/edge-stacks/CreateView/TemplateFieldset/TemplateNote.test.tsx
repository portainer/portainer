import { vi } from 'vitest';

import { render, screen } from '@/react-tools/test-utils';

import { TemplateNote } from './TemplateNote';

vi.mock('sanitize-html', () => ({
  default: (note: string) => note, // Mock the sanitize-html library to return the input as is
}));

test('renders template note', async () => {
  render(<TemplateNote note="Test note" />);

  const templateNoteElement = screen.getByText(/Information/);
  expect(templateNoteElement).toBeInTheDocument();

  const noteElement = screen.getByText(/Test note/);
  expect(noteElement).toBeInTheDocument();
});

test('does not render template note when note is undefined', async () => {
  render(<TemplateNote note={undefined} />);

  const templateNoteElement = screen.queryByText(/Information/);
  expect(templateNoteElement).not.toBeInTheDocument();
});
