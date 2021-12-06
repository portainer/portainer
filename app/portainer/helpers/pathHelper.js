/**
 * calculates baseHref
 *
 * return [string]
 *
 */
export function baseHref() {
  const base = document.getElementById('base');
  return base ? base.getAttribute('href') : '/';
}
