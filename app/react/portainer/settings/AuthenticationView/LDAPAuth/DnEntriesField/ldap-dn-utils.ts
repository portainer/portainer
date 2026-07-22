export interface DnEntry {
  type: 'ou' | 'cn';
  value: string;
}

// Characters that RFC 4514 requires to be escaped anywhere inside a
// distinguished-name attribute value, mirroring go-ldap's EscapeDN (the
// library the backend authenticates with). Portainer's DN builder concatenates
// values into the DN string without escaping, so an unescaped occurrence would
// corrupt the DN — we reject them up front with a warning instead.
// Note: '=' is intentionally absent (it only needs escaping in the type, not
// the value) and non-ASCII characters are allowed (valid UTF-8 in a DN).
const RESERVED_DN_VALUE_CHARS = ['"', '+', ',', ';', '<', '>', '\\'];

const CONTROL_CHAR_MAX = 0x1f;
const DELETE_CHAR = 0x7f;

export function validateDnEntryValue(value: string): string | undefined {
  const reserved = RESERVED_DN_VALUE_CHARS.filter((char) =>
    value.includes(char)
  );
  if (reserved.length > 0) {
    return `These characters are not allowed in a DN entry value: ${reserved.join(
      ' '
    )}`;
  }

  // A leading '#' is read as a hex-encoded value, and leading/trailing spaces
  // are stripped, so both positions must be escaped (RFC 4514 §2.4).
  if (value.startsWith(' ') || value.startsWith('#')) {
    return 'A DN entry value cannot start with a space or "#".';
  }
  if (value.endsWith(' ')) {
    return 'A DN entry value cannot end with a space.';
  }

  const hasControlChar = [...value].some((char) => {
    const code = char.charCodeAt(0);
    return code <= CONTROL_CHAR_MAX || code === DELETE_CHAR;
  });
  if (hasControlChar) {
    return 'A DN entry value cannot contain control characters.';
  }

  return undefined;
}

export function parseDN(
  dn: string | undefined,
  domainSuffix: string
): DnEntry[] {
  const regex = /(\w+)=([^,]*),?/;
  const ouValues: DnEntry[] = [];
  let left = dn || '';
  let match = left.match(regex);

  while (match && left !== domainSuffix) {
    const [, type, value] = match;
    if (type === 'ou' || type === 'cn') {
      ouValues.push({ type: type as 'ou' | 'cn', value });
    }
    left = left.replace(regex, '');
    match = left.match(regex);
  }

  return ouValues;
}

export function buildDN(entries: DnEntry[], suffix: string): string {
  const dnParts = entries
    .filter(({ value }) => value)
    .map(({ type, value }) => `${type}=${value}`);

  if (suffix) {
    dnParts.push(suffix);
  }

  return dnParts.join(',');
}
