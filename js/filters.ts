'use strict';

declare var angular: any;

angular.module('dockerui.filters', [])
    .filter('truncate', () => {
        return (text: string, length:any, end:string) => {
            if (isNaN(length))
                length = 10;

            if (end === undefined)
                end = "...";

            if (text.length <= length || text.length - end.length <= length) {
                return text;
            }
            else {
                return String(text).substring(0, length-end.length) + end;
            }
        };
    })
    .filter('statusbadge', () => {
        return (text: string) => {
            if (text === 'Ghost') {
                return 'important';
            }
            return 'success';
        };
    })
    .filter('isactive', ($location: any) => {
        return (text: string) => {
            if (text == $location) {
                return 'active';
            }
            return '';
        };
    });

