const _paq = (window._paq = window._paq || []);
/* tracker methods like "setCustomDimension" should be called before "trackPageView" */
_paq.push(['enableLinkTracking']);

const u = '//188.166.250.54/';
_paq.push(['setTrackerUrl', u + 'matomo.php']);
_paq.push(['setSiteId', '1']);
const d = document,
  g = d.createElement('script'),
  s = d.getElementsByTagName('script')[0];
g.type = 'text/javascript';
g.async = true;
g.src = u + 'matomo.js';
s.parentNode.insertBefore(g, s);
