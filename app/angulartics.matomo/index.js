import angular from 'angular';
import { setPortainerStatus, setUserRole, clearUserRole, setUserEndpointRole, clearUserEndpointRole, push, trackEvent } from './analytics-services';
const basePath = 'http://portainer-ce.app';

// forked from https://github.com/angulartics/angulartics-piwik/blob/master/src/angulartics-piwik.js

/**
 * @ngdoc overview
 * @name angulartics.piwik
 * Enables analytics support for Piwik/Matomo (http://piwik.org/docs/tracking-api/)
 */
export default angular.module('angulartics.matomo', ['angulartics']).config(config).name;

/* @ngInject */
function config($analyticsProvider, $windowProvider) {
  const $window = $windowProvider.$get();

  $analyticsProvider.settings.pageTracking.trackRelativePath = true;

  $analyticsProvider.api.setPortainerStatus = setPortainerStatus;

  $analyticsProvider.api.setUserRole = setUserRole;
  $analyticsProvider.api.clearUserRole = clearUserRole;

  $analyticsProvider.api.setUserEndpointRole = setUserEndpointRole;
  $analyticsProvider.api.clearUserEndpointRole = clearUserEndpointRole;

  // scope: visit or page. Defaults to 'page'
  $analyticsProvider.api.setCustomVariable = function (varIndex, varName, value, scope = 'page') {
    push('setCustomVariable', varIndex, varName, value, scope);
  };

  // scope: visit or page. Defaults to 'page'
  $analyticsProvider.api.deleteCustomVariable = function (varIndex, scope = 'page') {
    push('deleteCustomVariable', varIndex, scope);
  };

  // trackSiteSearch(keyword, category, [searchCount])
  $analyticsProvider.api.trackSiteSearch = function (keyword, category, searchCount) {
    // keyword is required
    if (keyword) {
      const params = ['trackSiteSearch', keyword, category || false];

      // searchCount is optional
      if (angular.isDefined(searchCount)) {
        params.push(searchCount);
      }

      push(params);
    }
  };

  // logs a conversion for goal 1. revenue is optional
  // trackGoal(goalID, [revenue]);
  $analyticsProvider.api.trackGoal = function (goalID, revenue) {
    push('trackGoal', goalID, revenue || 0);
  };

  // track outlink or download
  // linkType is 'link' or 'download', 'link' by default
  // trackLink(url, [linkType]);
  $analyticsProvider.api.trackLink = function (url, linkType) {
    const type = linkType || 'link';
    push('trackLink', url, type);
  };

  // Set default angulartics page and event tracking

  $analyticsProvider.registerSetUsername(function (username) {
    push('setUserId', username);
  });

  // locationObj is the angular $location object
  $analyticsProvider.registerPageTrack(function (path) {
    push('setDocumentTitle', $window.document.title);
    push('setReferrerUrl', '');
    push('setCustomUrl', basePath + path);
    push('trackPageView');
  });

  /**
   * @name eventTrack
   * Track a basic event in Piwik, or send an ecommerce event.
   *
   * @param {string} action A string corresponding to the type of event that needs to be tracked.
   * @param {object} properties The properties that need to be logged with the event.
   */
  $analyticsProvider.registerEventTrack(trackEvent);

  /**
   * @name exceptionTrack
   * Sugar on top of the eventTrack method for easily handling errors
   *
   * @param {object} error An Error object to track: error.toString() used for event 'action', error.stack used for event 'label'.
   * @param {object} cause The cause of the error given from $exceptionHandler, not used.
   */
  $analyticsProvider.registerExceptionTrack(function (error) {
    push('trackEvent', 'Exceptions', error.toString(), error.stack, 0);
  });
}
