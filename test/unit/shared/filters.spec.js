describe('filters', function () {
    beforeEach(module('dockerui.filters'));

    describe('truncate', function () {
        it('should truncate the string to 10 characters ending in "..." by default', inject(function(truncateFilter) {
            expect(truncateFilter('this is 20 chars long')).toBe('this is...');
        }));

        it('should truncate the string to 7 characters ending in "..."', inject(function(truncateFilter) {
            expect(truncateFilter('this is 20 chars long', 7)).toBe('this...');
        }));

        it('should truncate the string to 10 characters ending in "???"', inject(function(truncateFilter) {
            expect(truncateFilter('this is 20 chars long', 10, '???')).toBe('this is???');
        }));
    });

    describe('statusbadge', function () {
        it('should be "important" when input is "Ghost"', inject(function(statusbadgeFilter) {
            expect(statusbadgeFilter('Ghost')).toBe('important');
        }));

        it('should be "success" when input is "Exit 0"', inject(function(statusbadgeFilter) {
            expect(statusbadgeFilter('Exit 0')).toBe('success');
        }));

        it('should be "warning" when exit code is non-zero', inject(function(statusbadgeFilter) {
            expect(statusbadgeFilter('Exit 1')).toBe('warning');
        }));
    });

    describe('getstatetext', function () {

        it('should return an empty string when state is undefined', inject(function(getstatetextFilter) {
            expect(getstatetextFilter(undefined)).toBe('');
        }));

        it('should detect a Ghost state', inject(function(getstatetextFilter) {
            var state = {
                Ghost: true,
                Running: true,
                Paused: false
            };
            expect(getstatetextFilter(state)).toBe('Ghost');
        }));

        it('should detect a Paused state', inject(function(getstatetextFilter) {
            var state = {
                Ghost: false,
                Running: true,
                Paused: true
            };
            expect(getstatetextFilter(state)).toBe('Running (Paused)');
        }));

        it('should detect a Running state', inject(function(getstatetextFilter) {
            var state = {
                Ghost: false,
                Running: true,
                Paused: false
            };
            expect(getstatetextFilter(state)).toBe('Running');
        }));

        it('should detect a Stopped state', inject(function(getstatetextFilter) {
            var state = {
                Ghost: false,
                Running: false,
                Paused: false
            };
            expect(getstatetextFilter(state)).toBe('Stopped');
        }));
    });

    describe('getstatelabel', function () {
        it('should return an empty string when state is undefined', inject(function(getstatelabelFilter) {
            expect(getstatelabelFilter(undefined)).toBe('');
        }));

        it('should return label-important when a ghost state is detected', inject(function(getstatelabelFilter) {
            var state = {
                Ghost: true,
                Running: true,
                Paused: false
            };
            expect(getstatelabelFilter(state)).toBe('label-important');
        }));

        it('should return label-success when a running state is detected', inject(function(getstatelabelFilter) {
            var state = {
                Ghost: false,
                Running: true,
                Paused: false
            };
            expect(getstatelabelFilter(state)).toBe('label-success');
        }));
    });

    describe('humansize', function () {
        it('should return n/a when size is zero', inject(function(humansizeFilter) {
            expect(humansizeFilter(0)).toBe('n/a');
        }));

        it('should handle Bytes values', inject(function(humansizeFilter) {
            expect(humansizeFilter(512)).toBe('512 Bytes');
        }));

        it('should handle KB values', inject(function(humansizeFilter) {
            expect(humansizeFilter(5120)).toBe('5 KB');
        }));

        it('should handle MB values', inject(function(humansizeFilter) {
            expect(humansizeFilter(5 * Math.pow(10, 6))).toBe('5 MB');
        }));

        it('should handle GB values', inject(function(humansizeFilter) {
            expect(humansizeFilter(5 * Math.pow(10, 9))).toBe('5 GB');
        }));

        it('should handle TB values', inject(function(humansizeFilter) {
            expect(humansizeFilter(5 * Math.pow(10, 12))).toBe('5 TB');
        }));
    });

    describe('containername', function () {
        it('should strip the leading slash from container name', inject(function(containernameFilter) {
            var container = {
                Names: ['/elegant_ardinghelli']
            };

            expect(containernameFilter(container)).toBe('elegant_ardinghelli');
        }));
    });

    describe('repotag', function () {
        it('should not display empty repo tag', inject(function(repotagFilter) {
            var image = {
                RepoTags: ['<none>:<none>']
            };
            expect(repotagFilter(image)).toBe('');
        }));

        it('should display a normal repo tag', inject(function(repotagFilter) {
            var image = {
                RepoTags: ['ubuntu:latest']
            };
            expect(repotagFilter(image)).toBe('ubuntu:latest');
        }));
    });

    describe('getdate', function () {
        it('should convert the Docker date to a human readable form', inject(function(getdateFilter) {
            expect(getdateFilter(1420424998)).toBe('Sun Jan 04 2015');
        }));
    });
});