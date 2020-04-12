describe('filters', function () {
  beforeEach(module('portainer.filters'));

  describe('truncate', function () {
    it('should truncate the string to 10 characters ending in "..." by default', inject(function (truncateFilter) {
      expect(truncateFilter('this is 20 chars long')).toBe('this is...');
    }));

    it('should truncate the string to 7 characters ending in "..."', inject(function (truncateFilter) {
      expect(truncateFilter('this is 20 chars long', 7)).toBe('this...');
    }));

    it('should truncate the string to 10 characters ending in "???"', inject(function (truncateFilter) {
      expect(truncateFilter('this is 20 chars long', 10, '???')).toBe('this is???');
    }));
  });

  describe('getstatetext', function () {
    it('should return an empty string when state is undefined', inject(function (getstatetextFilter) {
      expect(getstatetextFilter(undefined)).toBe('');
    }));

    it('should detect a Ghost state', inject(function (getstatetextFilter) {
      var state = {
        Ghost: true,
        Running: true,
        Paused: false,
      };
      expect(getstatetextFilter(state)).toBe('Ghost');
    }));

    it('should detect a Paused state', inject(function (getstatetextFilter) {
      var state = {
        Ghost: false,
        Running: true,
        Paused: true,
      };
      expect(getstatetextFilter(state)).toBe('Running (Paused)');
    }));

    it('should detect a Running state', inject(function (getstatetextFilter) {
      var state = {
        Ghost: false,
        Running: true,
        Paused: false,
      };
      expect(getstatetextFilter(state)).toBe('Running');
    }));

    it('should detect a Stopped state', inject(function (getstatetextFilter) {
      var state = {
        Ghost: false,
        Running: false,
        Paused: false,
      };
      expect(getstatetextFilter(state)).toBe('Stopped');
    }));
  });

  describe('getstatelabel', function () {
    it('should return default when state is undefined', inject(function (getstatelabelFilter) {
      expect(getstatelabelFilter(undefined)).toBe('label-default');
    }));

    it('should return label-important when a ghost state is detected', inject(function (getstatelabelFilter) {
      var state = {
        Ghost: true,
        Running: true,
        Paused: false,
      };
      expect(getstatelabelFilter(state)).toBe('label-important');
    }));

    it('should return label-success when a running state is detected', inject(function (getstatelabelFilter) {
      var state = {
        Ghost: false,
        Running: true,
        Paused: false,
      };
      expect(getstatelabelFilter(state)).toBe('label-success');
    }));
  });

  describe('containername', function () {
    it('should strip the leading slash from container name', inject(function (containernameFilter) {
      var container = {
        Names: ['/elegant_ardinghelli'],
      };

      expect(containernameFilter(container)).toBe('elegant_ardinghelli');
    }));
  });

  describe('repotag', function () {
    it('should not display empty repo tag', inject(function (repotagFilter) {
      var image = {
        RepoTags: ['<none>:<none>'],
      };
      expect(repotagFilter(image)).toBe('');
    }));

    it('should display a normal repo tag', inject(function (repotagFilter) {
      var image = {
        RepoTags: ['ubuntu:latest'],
      };
      expect(repotagFilter(image)).toBe('ubuntu:latest');
    }));
  });
});
