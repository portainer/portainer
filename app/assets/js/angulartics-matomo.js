import angular from 'angular';

// forked from https://github.com/angulartics/angulartics-piwik/blob/master/src/angulartics-piwik.js

/* global _paq */
/**
 * @ngdoc overview
 * @name angulartics.piwik
 * Enables analytics support for Piwik/Matomo (http://piwik.org/docs/tracking-api/)
 */
angular.module('angulartics.matomo', ['angulartics']).config([
  '$analyticsProvider',
  '$windowProvider',
  function ($analyticsProvider, $windowProvider) {
    var $window = $windowProvider.$get();

    $analyticsProvider.settings.pageTracking.trackRelativePath = true;

    // Add piwik specific trackers to angulartics API

    // Requires the CustomDimensions plugin for Piwik.
    $analyticsProvider.api.setCustomDimension = function (dimensionId, value) {
      if ($window._paq) {
        $window._paq.push(['setCustomDimension', dimensionId, value]);
      }
    };

    // Requires the CustomDimensions plugin for Piwik.
    $analyticsProvider.api.deleteCustomDimension = function (dimensionId) {
      if ($window._paq) {
        $window._paq.push(['deleteCustomDimension', dimensionId]);
      }
    };

    // scope: visit or page. Defaults to 'page'
    $analyticsProvider.api.setCustomVariable = function (varIndex, varName, value, scope) {
      if ($window._paq) {
        scope = scope || 'page';
        $window._paq.push(['setCustomVariable', varIndex, varName, value, scope]);
      }
    };

    // scope: visit or page. Defaults to 'page'
    $analyticsProvider.api.deleteCustomVariable = function (varIndex, scope) {
      if ($window._paq) {
        scope = scope || 'page';
        $window._paq.push(['deleteCustomVariable', varIndex, scope]);
      }
    };

    // trackSiteSearch(keyword, category, [searchCount])
    $analyticsProvider.api.trackSiteSearch = function (keyword, category, searchCount) {
      // keyword is required
      if ($window._paq && keyword) {
        var params = ['trackSiteSearch', keyword, category || false];

        // searchCount is optional
        if (angular.isDefined(searchCount)) {
          params.push(searchCount);
        }

        $window._paq.push(params);
      }
    };

    // logs a conversion for goal 1. revenue is optional
    // trackGoal(goalID, [revenue]);
    $analyticsProvider.api.trackGoal = function (goalID, revenue) {
      if ($window._paq) {
        _paq.push(['trackGoal', goalID, revenue || 0]);
      }
    };

    // track outlink or download
    // linkType is 'link' or 'download', 'link' by default
    // trackLink(url, [linkType]);
    $analyticsProvider.api.trackLink = function (url, linkType) {
      var type = linkType || 'link';
      if ($window._paq) {
        $window._paq.push(['trackLink', url, type]);
      }
    };

    // Set default angulartics page and event tracking

    $analyticsProvider.registerSetUsername(function (username) {
      if ($window._paq) {
        $window._paq.push(['setUserId', username]);
      }
    });

    // locationObj is the angular $location object
    $analyticsProvider.registerPageTrack(function (path) {
      if ($window._paq) {
        $window._paq.push(['setDocumentTitle', $window.document.title]);
        $window._paq.push(['setReferrerUrl', '']);
        $window._paq.push(['setCustomUrl', 'http://portainer.app' + path]);
        $window._paq.push(['trackPageView']);
      }
    });

    /**
     * @name eventTrack
     * Track a basic event in Piwik, or send an ecommerce event.
     *
     * @param {string} action A string corresponding to the type of event that needs to be tracked.
     * @param {object} properties The properties that need to be logged with the event.
     */
    $analyticsProvider.registerEventTrack(function (action, properties) {
      if ($window._paq) {
        properties = properties || {};

        switch (action) {
          /**
           * @description Sets the current page view as a product or category page view. When you call
           * setEcommerceView it must be followed by a call to trackPageView to record the product or
           * category page view.
           *
           * @link https://piwik.org/docs/ecommerce-analytics/#tracking-product-page-views-category-page-views-optional
           * @link https://developer.piwik.org/api-reference/tracking-javascript#ecommerce
           *
           * @property productSKU (required) SKU: Product unique identifier
           * @property productName (optional) Product name
           * @property categoryName (optional) Product category, or array of up to 5 categories
           * @property price (optional) Product Price as displayed on the page
           */
          case 'setEcommerceView':
            $window._paq.push(['setEcommerceView', properties.productSKU, properties.productName, properties.categoryName, properties.price]);
            break;

          /**
           * @description Adds a product into the ecommerce order. Must be called for each product in
           * the order.
           *
           * @link https://piwik.org/docs/ecommerce-analytics/#tracking-ecommerce-orders-items-purchased-required
           * @link https://developer.piwik.org/api-reference/tracking-javascript#ecommerce
           *
           * @property productSKU (required) SKU: Product unique identifier
           * @property productName (optional) Product name
           * @property categoryName (optional) Product category, or array of up to 5 categories
           * @property price (recommended) Product price
           * @property quantity (optional, default to 1) Product quantity
           */
          case 'addEcommerceItem':
            $window._paq.push(['addEcommerceItem', properties.productSKU, properties.productName, properties.productCategory, properties.price, properties.quantity]);
            break;

          /**
           * @description Tracks a shopping cart. Call this javascript function every time a user is
           * adding, updating or deleting a product from the cart.
           *
           * @link https://piwik.org/docs/ecommerce-analytics/#tracking-add-to-cart-items-added-to-the-cart-optional
           * @link https://developer.piwik.org/api-reference/tracking-javascript#ecommerce
           *
           * @property grandTotal (required) Cart amount
           */
          case 'trackEcommerceCartUpdate':
            $window._paq.push(['trackEcommerceCartUpdate', properties.grandTotal]);
            break;

          /**
           * @description Tracks an Ecommerce order, including any ecommerce item previously added to
           * the order. orderId and grandTotal (ie. revenue) are required parameters.
           *
           * @link https://piwik.org/docs/ecommerce-analytics/#tracking-ecommerce-orders-items-purchased-required
           * @link https://developer.piwik.org/api-reference/tracking-javascript#ecommerce
           *
           * @property orderId (required) Unique Order ID
           * @property grandTotal (required) Order Revenue grand total (includes tax, shipping, and subtracted discount)
           * @property subTotal (optional) Order sub total (excludes shipping)
           * @property tax (optional) Tax amount
           * @property shipping (optional) Shipping amount
           * @property discount (optional) Discount offered (set to false for unspecified parameter)
           */
          case 'trackEcommerceOrder':
            $window._paq.push(['trackEcommerceOrder', properties.orderId, properties.grandTotal, properties.subTotal, properties.tax, properties.shipping, properties.discount]);
            break;

          /**
           * @description Logs an event with an event category (Videos, Music, Games...), an event
           * action (Play, Pause, Duration, Add Playlist, Downloaded, Clicked...), and an optional
           * event name and optional numeric value.
           *
           * @link https://piwik.org/docs/event-tracking/
           * @link https://developer.piwik.org/api-reference/tracking-javascript#using-the-tracker-object
           *
           * @property category
           * @property action
           * @property name (optional, recommended)
           * @property value (optional)
           */
          default:
            // PAQ requires that eventValue be an integer, see: http://piwik.org/docs/event-tracking
            if (properties.value) {
              var parsed = parseInt(properties.value, 10);
              properties.value = isNaN(parsed) ? 0 : parsed;
            }

            $window._paq.push([
              'trackEvent',
              properties.category,
              action,
              properties.name || properties.label, // Changed in favour of Piwik documentation. Added fallback so it's backwards compatible.
              properties.value,
            ]);
        }
      }
    });

    /**
     * @name exceptionTrack
     * Sugar on top of the eventTrack method for easily handling errors
     *
     * @param {object} error An Error object to track: error.toString() used for event 'action', error.stack used for event 'label'.
     * @param {object} cause The cause of the error given from $exceptionHandler, not used.
     */
    $analyticsProvider.registerExceptionTrack(function (error) {
      if ($window._paq) {
        $window._paq.push(['trackEvent', 'Exceptions', error.toString(), error.stack, 0]);
      }
    });
  },
]);
