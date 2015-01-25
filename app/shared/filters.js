angular.module('dockerui.filters', [])
    .filter('truncate', function() {
        'use strict';
        return function(text, length, end) {
            if (isNaN(length)) {
                length = 10;
            }

            if (end === undefined){
                end = '...';
            }

            if (text.length <= length || text.length - end.length <= length) {
                return text;
            }
            else {
                return String(text).substring(0, length - end.length) + end;
            }
        };
    })
    .filter('statusbadge', function() {
        'use strict';
        return function(text) {
            if (text === 'Ghost') {
                return 'important';
            } else if (text.indexOf('Exit') !== -1 && text !== 'Exit 0') {
                return 'warning';
            }
            return 'success';
        };
    })
    .filter('getstatetext', function() {
        'use strict';
        return function(state) {
            if (state === undefined) {
                return '';
            }
            if (state.Ghost && state.Running) {
                return 'Ghost';
            }
            if (state.Running && state.Paused) {
                return 'Running (Paused)';
            }
            if (state.Running) {
                return 'Running';
            }
            return 'Stopped';
        };
    })
    .filter('getstatelabel', function() {
        'use strict';
        return function(state) {
            if (state === undefined) {
                return '';
            }

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
        'use strict';
        return function(bytes) {
            var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            if (bytes === 0) {
                return 'n/a';
            }
            var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
            return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[[i]]; 
        };
    })
    .filter('containername', function() {
        'use strict';
        return function(container) {
            var name = container.Names[0];
            return name.substring(1, name.length);
        };
    })
    .filter('repotag', function() {
        'use strict';
        return function(image) {
            if (image.RepoTags && image.RepoTags.length > 0) {
                var tag = image.RepoTags[0];
                if (tag === '<none>:<none>') { tag = ''; }
                return tag;
            }
            return '';      
        };
    })
    .filter('getdate', function() {
        'use strict';
        return function(data) {
            //Multiply by 1000 for the unix format
            var date = new Date(data * 1000);
            return date.toDateString();
        };
    })
    .filter('errorMsg', function() {
        return function(object) {
            var idx = 0;
            var msg = '';
            while (object[idx] && typeof(object[idx]) === 'string') {
                msg += object[idx];
                idx++;
            }
            return msg;
        };
    });
