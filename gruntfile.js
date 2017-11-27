var loadGruntTasks = require('load-grunt-tasks');
var gruntfile_cfg = {};
var os = require('os');
var arch = os.arch();
if ( arch === 'x64' ) arch = 'amd64';

module.exports = function (grunt) {

  loadGruntTasks(grunt, {
    pattern: ['grunt-*', 'gruntify-*']
  });

  grunt.registerTask('default', ['eslint', 'build']);
  grunt.registerTask('before-copy', [
    'vendor',
    'html2js',
    'useminPrepare:release',
    'concat',
    'clean:tmpl',
    'replace',
    'postcss:build',
    'uglify'
  ]);
  grunt.registerTask('after-copy', [
    'filerev',
    'usemin',
    'clean:tmp'
  ]);
  grunt.registerTask('build-webapp', [
    'config:prod',
    'clean:all',
    'before-copy',
    'copy:assets',
    'after-copy'
  ]);
  grunt.registerTask('build', [
    'config:dev',
    'clean:app',
    'shell:buildBinary:linux:' + arch,
    'shell:downloadDockerBinary:linux:' + arch,
    'shell:extractDockerBinary:linux:' + arch,
    'vendor',
    'html2js',
    'useminPrepare:dev',
    'concat',
    'clean:tmpl',
    'replace',
    'copy',
    'after-copy'
  ]);
  grunt.task.registerTask('release', 'release:<platform>:<arch>', function(p, a) {
    grunt.task.run(['config:prod', 'clean:all', 'shell:buildBinary:'+p+':'+a, 'shell:downloadDockerBinary:'+p+':'+a, 'shell:extractDockerBinary:'+p+':'+a, 'before-copy', 'copy:assets', 'after-copy']);
  });
  grunt.registerTask('lint', ['eslint']);
  grunt.registerTask('run-dev', ['build', 'shell:rm', 'shell:run:'+arch, 'watch:build']);
  grunt.registerTask('clear', ['clean:app']);

  // Load content of `vendor.yml` to src.jsVendor, src.cssVendor and src.angularVendor
  grunt.registerTask('vendor', function() {
      var vendorFile = grunt.file.readYAML('vendor.yml');
      for (var filelist in vendorFile) {
          if (vendorFile.hasOwnProperty(filelist)) {
              var list = vendorFile[filelist];
              // Check if any of the files is missing
              for (var itemIndex in list) {
                  if (list.hasOwnProperty(itemIndex)) {
                      var item = 'node_modules/'+list[itemIndex];
                      if (!grunt.file.exists(item)) {
                          grunt.fail.warn('Dependency file ' + item + ' not found.');
                      }
                      list[itemIndex] = item;
                  }
              }
              // If none is missing, save the list
              grunt.config('src.' + filelist + 'Vendor', list);
          }
      }
  });

  // Project configuration.
  grunt.initConfig({
    distdir: 'dist/public',
    dockerdir: './docker_binaries/',  // Must include trailing slash
    shippedDockerVersion: '17.09.0-ce',
    pkg: grunt.file.readJSON('package.json'),
    config: gruntfile_cfg.config,
    src: gruntfile_cfg.src,
    clean: gruntfile_cfg.clean,
    useminPrepare: gruntfile_cfg.useminPrepare,
    filerev: { files: { src: ['<%= distdir %>/js/*.js', '<%= distdir %>/css/*.css'] }},
    usemin: { html: ['<%= distdir %>/index.html'] },
    copy: gruntfile_cfg.copy,
    eslint: gruntfile_cfg.eslint,
    html2js: gruntfile_cfg.html2js,
    concat: gruntfile_cfg.concat,
    uglify: gruntfile_cfg.uglify,
    postcss: gruntfile_cfg.postcss,
    watch: gruntfile_cfg.watch,
    shell: gruntfile_cfg.shell,
    replace: gruntfile_cfg.replace
  });

};

/***/

var autoprefixer = require('autoprefixer');
var cssnano = require('cssnano');

gruntfile_cfg.config = {
  dev:  { options: { variables: { 'environment': 'development' }}},
  prod: { options: { variables: { 'environment': 'production'  }}}
};

gruntfile_cfg.src = {
  js: ['app/**/__module.js', 'app/**/*.js', '!app/**/*.spec.js'],
  jsTpl: ['<%= distdir %>/templates/**/*.js'],
  html: ['index.html'],
  tpl: ['app/**/*.html'],
  css: ['assets/css/app.css', 'app/**/*.css']
};

gruntfile_cfg.clean = {
  all: ['<%= distdir %>/../*'],
  app: ['<%= distdir %>/*'],
  tmpl: ['<%= distdir %>/templates'],
  tmp: ['<%= distdir %>/js/*', '!<%= distdir %>/js/app.*.js', '<%= distdir %>/css/*', '!<%= distdir %>/css/app.*.css']
};

gruntfile_cfg.useminPrepare = {
  dev: {
    src: '<%= src.html %>',
    options: {
      root: '<%= distdir %>',
      flow: {
        steps: {
          js: ['concat'],
          css: ['concat']
        }
      }
    }
  },
  release: {
    src: '<%= src.html %>',
    options: {
      root: '<%= distdir %>',
      dest: '<%= distdir %>'
    }
  }
};

gruntfile_cfg.copy = {
  bundle: {
    files: [
      {dest:'<%= distdir %>/js/',  src: ['app.js'],  expand: true, cwd: '.tmp/concat/js/' },
      {dest:'<%= distdir %>/css/', src: ['app.css'], expand: true, cwd: '.tmp/concat/css/' }
    ]
  },
  assets: {
    files: [
      {dest: '<%= distdir %>/fonts/',  src: '*.{ttf,woff,woff2,eof,svg}', expand: true, cwd: 'node_modules/bootstrap/fonts/'},
      {dest: '<%= distdir %>/fonts/',  src: '*.{ttf,woff,woff2,eof,eot,svg}', expand: true, cwd: 'node_modules/@fortawesome/fontawesome-free-webfonts/webfonts/'},
      {dest: '<%= distdir %>/fonts/',  src: '*.{ttf,woff,woff2,eof,svg}', expand: true, cwd: 'node_modules/rdash-ui/dist/fonts/'},
      {dest: '<%= distdir %>/images/', src: '**',                         expand: true, cwd: 'assets/images/'},
      {dest: '<%= distdir %>/ico',     src: '**',                         expand: true, cwd: 'assets/ico'}
    ]
  }
};

gruntfile_cfg.eslint = {
  src: ['gruntfile.js', '<%= src.js %>'],
  options: { configFile: '.eslintrc.yml' }
};

gruntfile_cfg.html2js = {
  app: {
    options: { base: '.' },
    src: ['<%= src.tpl %>'],
    dest: '<%= distdir %>/templates/app.js',
    module: '<%= pkg.name %>.templates'
  }
};

gruntfile_cfg.concat = {
  vendor: {
    files: {
      '<%= distdir %>/css/<%= pkg.name %>.css': ['<%= src.cssVendor %>', '<%= src.css %>'],
      '<%= distdir %>/js/vendor.js': ['<%= src.jsVendor %>'],
      '<%= distdir %>/js/angular.js': ['<%= src.angularVendor %>']
    }
  },
  dist: {
    options: { process: true },
    files: {
      '<%= distdir %>/js/<%= pkg.name %>.js': ['<%= src.js %>', '<%= src.jsTpl %>'],
      '<%= distdir %>/index.html': ['index.html']
    }
  }
};

gruntfile_cfg.uglify = {
  dist: {
    files: { '<%= distdir %>/js/<%= pkg.name %>.js': ['<%= src.js %>', '<%= src.jsTpl %>'] }
  },
  vendor: {
    options: { preserveComments: 'some' }, // Preserve license comments
    files: { '<%= distdir %>/js/vendor.js': ['<%= src.jsVendor %>'],
             '<%= distdir %>/js/angular.js': ['<%= src.angularVendor %>']
    }
  }
};

gruntfile_cfg.postcss = {
  build: {
    options: {
      processors: [
        autoprefixer({browsers: 'last 2 versions'}), // add vendor prefixes
        cssnano() // minify the result
      ]
    },
    src: '.tmp/concat/css/app.css',
    dest: '<%= distdir %>/css/app.css'
  }
};

gruntfile_cfg.watch = {
  build: {
    files: ['<%= src.js %>', '<%= src.css %>', '<%= src.tpl %>', '<%= src.html %>'],
    tasks: ['build']
  }
};

gruntfile_cfg.replace = {
  concat: {
    options: {
      patterns: [
        { match: 'ENVIRONMENT',  replacement: '<%= grunt.config.get("environment") %>' },
        { match: 'CONFIG_GA_ID', replacement: '<%= pkg.config.GA_ID %>' },
        { match: /..\/webfonts\//g, replacement: '../fonts/'}
      ]
    },
    files: [
      {
        expand: true,
        flatten: true,
        src: ['.tmp/concat/js/app.js'],
        dest: '.tmp/concat/js'
      },
      {
        expand: true,
        flatten: true,
        src: ['.tmp/concat/css/app.css'],
        dest: '.tmp/concat/css'
      }
    ]
  }
};

function shell_buildBinary(p, a) {
  var binfile = 'dist/portainer-'+p+'-'+a;
  return [
    'if [ -f '+(( p === 'windows' ) ? binfile+'.exe' : binfile)+' ]; then',
      'echo "Portainer binary exists";',
    'else',
      'build/build_in_container.sh ' + p + ' ' + a + ';',
    'fi'
  ].join(' ');
}

var shell_run = function(arch) {
  return [
    'docker run -d',
    '-p 9000:9000',
    '-v $(pwd)/dist:/app',
    '-v /tmp/portainer:/data',
    '-v /var/run/docker.sock:/var/run/docker.sock:z',
    '--name portainer',
    'portainer/base',
    '/app/portainer-linux-' + arch + ' --no-analytics'
  ].join(' ');
};

function shell_downloadDockerBinary(p, a) {
  var ext = ((p === 'windows') ? '.zip' : '.tgz');
  var tarname = 'docker-<%= shippedDockerVersion %>';
  var ps = { 'windows': 'win', 'darwin': 'mac' };
  var as = { 'amd64': 'x86_64', 'arm': 'armhf', 'arm64': 'aarch64' };
  var ip = ((ps[p] === undefined) ? p : ps[p]);
  var ia = ((as[a] === undefined) ? a : as[a]);
  return [
    'if [ -f '+(( p === 'win' ) ? '<%= distdir %>../docker.exe' : '<%= distdir %>../docker')+' ]; then',
      'echo "Docker binary exists";',
    'else',
      'mkdir -pv <%= dockerdir %>;',
      'wget "https://download.docker.com/' + ip + '/static/stable/' + ia + '/' + tarname + ext + '";',
      'mv ' + tarname + ext + ' <%= dockerdir %>' + tarname + '-' + p + '-' + a + ext +';',
    'fi'
  ].join(' ');
}

var shell_extractDockerBinary = function(p, a) {
  var tarname = 'docker-<%= shippedDockerVersion %>-' + p + '-' + a + ((p === 'windows') ? '.zip' : '.tgz');
  return [
    'rm -rf .tmp/docker-extract',
    'mkdir -pv .tmp/docker-extract',
    ((p === 'windows') ?
      'unzip <%= dockerdir %>' + tarname + ' -d ".tmp/docker-extract"'
    :
      'tar -xf <%= dockerdir %>' + tarname + ' -C ".tmp/docker-extract"'
    ),
    'mv .tmp/docker-extract/docker/docker' + ((p === 'windows') ? '.exe' : '') + ' <%= distdir %>/../'
  ].join(';');
};

gruntfile_cfg.shell = {
  buildBinary: { command: shell_buildBinary },
  rm: { command: 'if [ -z "$(docker container inspect portainer 2>&1 | grep "Error:")" ]; then docker container rm -f portainer; fi' },
  run: { command: shell_run },
  downloadDockerBinary: { command: shell_downloadDockerBinary },
  extractDockerBinary: { command: shell_extractDockerBinary }
};
