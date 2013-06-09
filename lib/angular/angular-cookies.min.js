/*
 AngularJS v1.0.7
 (c) 2010-2012 Google, Inc. http://angularjs.org
 License: MIT
*/
(function(m,f,l){'use strict';f.module("ngCookies",["ng"]).factory("$cookies",["$rootScope","$browser",function(d,b){var c={},g={},h,i=!1,j=f.copy,k=f.isUndefined;b.addPollFn(function(){var a=b.cookies();h!=a&&(h=a,j(a,g),j(a,c),i&&d.$apply())})();i=!0;d.$watch(function(){var a,e,d;for(a in g)k(c[a])&&b.cookies(a,l);for(a in c)e=c[a],f.isString(e)?e!==g[a]&&(b.cookies(a,e),d=!0):f.isDefined(g[a])?c[a]=g[a]:delete c[a];if(d)for(a in e=b.cookies(),c)c[a]!==e[a]&&(k(e[a])?delete c[a]:c[a]=e[a])});return c}]).factory("$cookieStore",
["$cookies",function(d){return{get:function(b){return(b=d[b])?f.fromJson(b):b},put:function(b,c){d[b]=f.toJson(c)},remove:function(b){delete d[b]}}}])})(window,window.angular);
