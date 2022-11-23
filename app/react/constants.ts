export const BROWSER_OS_PLATFORM = getOs();

function getOs() {
  const { userAgent } = navigator;

  if (userAgent.includes('Windows')) {
    return 'win';
  }

  return userAgent.includes('Mac') ? 'mac' : 'lin';
}
