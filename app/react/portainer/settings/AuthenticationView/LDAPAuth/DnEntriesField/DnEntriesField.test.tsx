import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { DnEntriesField } from './DnEntriesField';
import { DnEntry } from './ldap-dn-utils';

function StatefulDnEntriesField({
  initialEntries,
  onChange,
  label,
}: {
  initialEntries: DnEntry[];
  onChange: (entries: DnEntry[]) => void;
  label?: string;
}) {
  const [entries, setEntries] = useState(initialEntries);
  return (
    <DnEntriesField
      value={entries}
      onChange={(newEntries) => {
        setEntries(newEntries);
        onChange(newEntries);
      }}
      label={label}
    />
  );
}

describe('DnEntriesField', () => {
  it('should display DN entries', () => {
    const onChange = vi.fn();
    const entries: DnEntry[] = [
      { type: 'ou', value: 'Users' },
      { type: 'ou', value: 'Department' },
    ];

    render(
      <StatefulDnEntriesField
        initialEntries={entries}
        onChange={onChange}
        label="Test DN Builder"
      />
    );

    expect(screen.getByText('Test DN Builder')).toBeInTheDocument();

    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(2);
    expect(selects[0]).toHaveValue('ou');
    expect(selects[1]).toHaveValue('ou');

    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0]).toHaveValue('Users');
    expect(inputs[1]).toHaveValue('Department');
  });

  it('should call onChange with updated entries when an entry is modified', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <StatefulDnEntriesField
        initialEntries={[{ type: 'ou', value: 'Users' }]}
        onChange={onChange}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    await user.clear(inputs[0]);
    await user.type(inputs[0], 'TestUsers');

    expect(onChange).toHaveBeenLastCalledWith([
      { type: 'ou', value: 'TestUsers' },
    ]);
  });
});
