/* Pass a visit's own UTM tags on to Google Play. Play Console counts store
   visitors and installs per tag, but only from the store link's `referrer`
   parameter, so tags on this page's address would otherwise be lost. A visit
   without tags is credited to this page, named by the script tag:

     <script src="/assets/js/play-referrer.js" data-medium="site" data-campaign="home"></script>

   `data-source` names the site (default watchland.app; the app pages on
   bailong.fyi say bailong.fyi).

   A page that sets its store link after load adds `data-manual` and calls
   WatchlandPlayReferrer.apply({ utm_content: '…' }) itself. Extra tags go first
   in the referrer: the Watchland app reads `watchface_<id>` out of it after
   install to open that face. */
(function () {
  var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  var script = document.currentScript;
  var data = (script && script.dataset) || {};
  var own = {
    utm_source: data.source || 'watchland.app',
    utm_medium: data.medium || 'site',
    utm_campaign: data.campaign || 'site'
  };

  function referrerFor(existing, extra) {
    var q = new URLSearchParams(location.search);
    var incoming = KEYS.filter(function (k) { return q.get(k); });
    var tags = {};
    if (incoming.length) {
      incoming.forEach(function (k) { tags[k] = q.get(k); });
    } else if (existing.get('utm_source')) {
      KEYS.forEach(function (k) { if (existing.get(k)) tags[k] = existing.get(k); });
    } else {
      Object.keys(own).forEach(function (k) { tags[k] = own[k]; });
    }
    var out = new URLSearchParams();
    Object.keys(extra || {}).forEach(function (k) { if (extra[k]) out.set(k, extra[k]); });
    KEYS.forEach(function (k) { if (tags[k] && !out.has(k)) out.set(k, tags[k]); });
    existing.forEach(function (v, k) { if (KEYS.indexOf(k) < 0 && !out.has(k)) out.set(k, v); });
    return out.toString();
  }

  function apply(extra) {
    var links = document.querySelectorAll('a[href*="play.google.com/store/apps/details"]');
    for (var i = 0; i < links.length; i++) {
      var u = new URL(links[i].href);
      u.searchParams.set('referrer', referrerFor(new URLSearchParams(u.searchParams.get('referrer') || ''), extra));
      links[i].href = u.toString();
    }
  }

  window.WatchlandPlayReferrer = { apply: apply };
  if ('manual' in data) return;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { apply(); });
  else apply();
})();
