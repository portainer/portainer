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
            expect(getdateFilter(1420424998)).toBe('Mon Jan 05 2015');
        }));
    });

    describe('errorMsgFilter', function() {
        it('should convert the $resource object to a string message',
            inject(function(errorMsgFilter) {
                var response = {'0':'C','1':'o','2':'n','3':'f','4':'l','5':'i','6':'c','7':'t','8':',','9':' ','10':'T','11':'h','12':'e','13':' ','14':'n','15':'a','16':'m','17':'e','18':' ','19':'u','20':'b','21':'u','22':'n','23':'t','24':'u','25':'-','26':'s','27':'l','28':'e','29':'e','30':'p','31':'-','32':'r','33':'u','34':'n','35':'t','36':'i','37':'m','38':'e','39':' ','40':'i','41':'s','42':' ','43':'a','44':'l','45':'r','46':'e','47':'a','48':'d','49':'y','50':' ','51':'a','52':'s','53':'s','54':'i','55':'g','56':'n','57':'e','58':'d','59':' ','60':'t','61':'o','62':' ','63':'b','64':'6','65':'9','66':'e','67':'5','68':'3','69':'a','70':'6','71':'2','72':'2','73':'c','74':'8','75':'.','76':' ','77':'Y','78':'o','79':'u','80':' ','81':'h','82':'a','83':'v','84':'e','85':' ','86':'t','87':'o','88':' ','89':'d','90':'e','91':'l','92':'e','93':'t','94':'e','95':' ','96':'(','97':'o','98':'r','99':' ','100':'r','101':'e','102':'n','103':'a','104':'m','105':'e','106':')','107':' ','108':'t','109':'h','110':'a','111':'t','112':' ','113':'c','114':'o','115':'n','116':'t','117':'a','118':'i','119':'n','120':'e','121':'r','122':' ','123':'t','124':'o','125':' ','126':'b','127':'e','128':' ','129':'a','130':'b','131':'l','132':'e','133':' ','134':'t','135':'o','136':' ','137':'a','138':'s','139':'s','140':'i','141':'g','142':'n','143':' ','144':'u','145':'b','146':'u','147':'n','148':'t','149':'u','150':'-','151':'s','152':'l','153':'e','154':'e','155':'p','156':'-','157':'r','158':'u','159':'n','160':'t','161':'i','162':'m','163':'e','164':' ','165':'t','166':'o','167':' ','168':'a','169':' ','170':'c','171':'o','172':'n','173':'t','174':'a','175':'i','176':'n','177':'e','178':'r','179':' ','180':'a','181':'g','182':'a','183':'i','184':'n','185':'.','186':'\n','$promise':{},'$resolved':true};
                var message = 'Conflict, The name ubuntu-sleep-runtime is already assigned to b69e53a622c8. You have to delete (or rename) that container to be able to assign ubuntu-sleep-runtime to a container again.\n';
                expect(errorMsgFilter(response)).toBe(message);
        }));
    });
});