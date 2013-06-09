'use strict';
angular.module('dockerui.filters', []).filter('truncate', function () {
    return function (text, length, end) {
        if(isNaN(length)) {
            length = 10;
        }
        if(end === undefined) {
            end = "...";
        }
        if(text.length <= length || text.length - end.length <= length) {
            return text;
        } else {
            return String(text).substring(0, length - end.length) + end;
        }
    };
}).filter('statusbadge', function () {
    return function (text) {
        if(text === 'Ghost') {
            return 'important';
        }
        return 'success';
    };
}).filter('isactive', function ($location) {
    return function (text) {
        if(text == $location) {
            return 'active';
        }
        return '';
    };
});
