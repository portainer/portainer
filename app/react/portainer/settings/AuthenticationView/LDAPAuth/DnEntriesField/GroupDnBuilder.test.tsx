import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { GroupDnBuilder, parseGroupName, buildGroupDN } from './GroupDnBuilder';
import { DnEntry } from './ldap-dn-utils';

describe('GroupDnBuilder', () => {
  it('should parse and display group name from value', () => {
    render(
      <GroupDnBuilder
        value="cn=Admins,ou=Groups,dc=example,dc=com"
        suffix="dc=example,dc=com"
        onChange={vi.fn()}
        index={0}
      />
    );

    expect(screen.getByRole('textbox', { name: /group name/i })).toHaveValue(
      'Admins'
    );
  });

  it('should call onChange with index and updated DN when group name changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <GroupDnBuilder
        value=""
        suffix="dc=example,dc=com"
        onChange={onChange}
        index={0}
      />
    );

    await user.type(
      screen.getByRole('textbox', { name: /group name/i }),
      'Admins'
    );

    expect(onChange).toHaveBeenLastCalledWith(0, 'cn=Admins,dc=example,dc=com');
  });

  it('should render remove button when onRemoveClick is provided', () => {
    render(
      <GroupDnBuilder
        value="cn=Admins,dc=example,dc=com"
        suffix="dc=example,dc=com"
        onChange={vi.fn()}
        onRemoveClick={vi.fn()}
        index={0}
      />
    );

    expect(screen.getByTestId('group-dn-remove-button')).toBeInTheDocument();
  });
});

describe('parseGroupName', () => {
  it('should extract group name from a full DN', () => {
    expect(
      parseGroupName(
        'cn=Admins,ou=Groups,dc=example,dc=com',
        'dc=example,dc=com'
      )
    ).toBe('Admins');
  });

  it('should return empty string when value equals suffix', () => {
    expect(parseGroupName('dc=example,dc=com', 'dc=example,dc=com')).toBe('');
  });

  it('should return empty string for empty value', () => {
    expect(parseGroupName('', 'dc=example,dc=com')).toBe('');
  });
});

describe('buildGroupDN', () => {
  it('should build a full group DN with path entries', () => {
    const entries: DnEntry[] = [{ type: 'ou', value: 'Groups' }];
    expect(buildGroupDN('Admins', entries, 'dc=example,dc=com')).toBe(
      'cn=Admins,ou=Groups,dc=example,dc=com'
    );
  });

  it('should fall back to suffix when entries are empty', () => {
    expect(buildGroupDN('Admins', [], 'dc=example,dc=com')).toBe(
      'cn=Admins,dc=example,dc=com'
    );
  });

  it('should build DN without suffix when entries and suffix are empty', () => {
    expect(buildGroupDN('Admins', [], '')).toBe('cn=Admins');
  });

  it('should return suffix when group name is empty', () => {
    expect(buildGroupDN('', [], 'dc=example,dc=com')).toBe('dc=example,dc=com');
  });
});
