import { isValidReturnUrl } from './url-utils';

describe('isValidReturnUrl', () => {
  const origin = 'http://localhost:9000';

  it('returns false for empty string', () => {
    expect(isValidReturnUrl('', origin)).toBe(false);
  });

  it('returns false for cross-origin URLs', () => {
    expect(isValidReturnUrl('https://evil.com', origin)).toBe(false);
    expect(isValidReturnUrl('http://evil.com/path', origin)).toBe(false);
    expect(isValidReturnUrl('//evil.com', origin)).toBe(false);
    expect(isValidReturnUrl('javascript:alert(1)', origin)).toBe(false);
  });

  it('rejects backslash / mixed slash-backslash authority tricks', () => {
    // Browsers (WHATWG URL) treat backslashes as forward slashes in the
    // authority, so these all resolve to evil.com and must be rejected.
    expect(isValidReturnUrl('/\\evil.com', origin)).toBe(false);
    expect(isValidReturnUrl('\\/evil.com', origin)).toBe(false);
    expect(isValidReturnUrl('\\\\evil.com', origin)).toBe(false);
    expect(isValidReturnUrl('/\\/evil.com', origin)).toBe(false);
    expect(isValidReturnUrl('https:\\\\evil.com', origin)).toBe(false);
  });

  it('treats percent-encoded slashes and single backslash as same-origin paths (not open redirects)', () => {
    // %2f stays encoded, so the origin remains the app origin — navigating to
    // http://localhost:9000/%2f%2fevil.com, never to evil.com.
    expect(isValidReturnUrl('%2f%2fevil.com', origin)).toBe(true);
    expect(isValidReturnUrl('/%2f%2fevil.com', origin)).toBe(true);
    // A single leading backslash resolves to /evil.com on the app origin.
    expect(isValidReturnUrl('\\evil.com', origin)).toBe(true);
  });

  it('returns true for same-origin paths', () => {
    expect(isValidReturnUrl('/home', origin)).toBe(true);
    expect(isValidReturnUrl('/run/page?foo=bar', origin)).toBe(true);
    expect(isValidReturnUrl('/run/page?foo=bar#section', origin)).toBe(true);
    expect(isValidReturnUrl('/home?redirect=https://example.com', origin)).toBe(
      true
    );
    expect(isValidReturnUrl('http://localhost:9000/run/page', origin)).toBe(
      true
    );
    expect(isValidReturnUrl('#!/home', origin)).toBe(true);
    expect(isValidReturnUrl('#!/environments/1/docker/dashboard', origin)).toBe(
      true
    );
  });
});
