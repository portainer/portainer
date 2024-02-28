import $ from 'jquery';

/* @ngInject */
export function onStartupAngular($rootScope, $state, cfpLoadingBar, $transitions, HttpRequestHelper) {
  $rootScope.$state = $state;

  // Workaround to prevent the loading bar from going backward
  // https://github.com/chieffancypants/angular-loading-bar/issues/273
  const originalSet = cfpLoadingBar.set;
  cfpLoadingBar.set = function overrideSet(n) {
    if (n > cfpLoadingBar.status()) {
      originalSet.apply(cfpLoadingBar, arguments);
    }
  };

  $transitions.onBefore({}, () => {
    HttpRequestHelper.resetAgentHeaders();
  });

  // EE-6751: screens not loading  when switching quickly between side menu options
  // Known bug of @uirouter/angularjs
  // Fix found at https://github.com/angular-ui/ui-router/issues/3652#issuecomment-574499009
  // This hook is cleaning the internal viewConfigs list, removing leftover data unrelated to the current transition
  $transitions.onStart({}, (transition) => {
    const toList = transition.treeChanges().to.map((t) => t.state.name);
    const toConfigs = transition.router.viewService._viewConfigs.filter((vc) => toList.includes(vc.viewDecl.$context.name));
    transition.router.viewService._viewConfigs = toConfigs;
  });

  $(document).ajaxSend((event, jqXhr, jqOpts) => {
    const type = jqOpts.type === 'POST' || jqOpts.type === 'PUT' || jqOpts.type === 'PATCH';
    const hasNoContentType = jqOpts.contentType !== 'application/json' && jqOpts.headers && !jqOpts.headers['Content-Type'];
    if (type && hasNoContentType) {
      jqXhr.setRequestHeader('Content-Type', 'application/json');
    }
    const csrfCookie = window.cookieStore.get('_gorilla_csrf');
    jqXhr.setRequestHeader('X-CSRF-Token', csrfCookie);
  });
}
