'use strict';

angular.module('dockerui.filters', [])
    .filter('truncate', function() {
        return function(text, length, end) {
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
    .filter('statusbadge', function() {
        return function(text) {
            if (text === 'Ghost') {
                return 'important';
            } else if (text.indexOf('Exit') != -1 && text !== 'Exit 0') {
                return 'warning';
            }
            return 'success';
        };
    })
    .filter('getstatetext', function() {
        return function(state) {
            if (state == undefined) return '';

            if (state.Ghost && state.Running) {
                return 'Ghost';
            }
            if (state.Running) {
                return 'Running';
            }
            return 'Stopped';
        };
    })
    .filter('getstatelabel', function() {
        return function(state) {
            if (state == undefined) return '';

            if (state.Ghost && state.Running) {
                return 'label-important';
            }
            if (state.Running) {
                return 'label-success';
            }
            return '';
        };
    })
    .filter('humansize', function() {
        return function(bytes) {
            var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            if (bytes == 0) {
                return 'n/a';
            }
            var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
            return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[[i]]; 
        };
    })
    .filter('getdate', function() {
        return function(data) {
            //Multiply by 1000 for the unix format
            var date = new Date(data * 1000);
            return date.toDateString();
        };
    });
