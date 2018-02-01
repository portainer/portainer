var gruntfile_cfg = {};
var loadGruntTasks = require('load-grunt-tasks');
var os = require('os');
var arch = os.arch();
if ( arch === 'x64' ) arch = 'amd64';

module.exports = function (grunt) {

  loadGruntTasks(grunt, {
    pattern: ['grunt-*', 'gruntify-*']
  });

  grunt.registerTask('default', ['eslint', 'build']);
  grunt.registerTask('before-copy', [
    'vendor:',
    'html2js',
    'useminPrepare:release',
    'concat',
    'postcss:build',
    'clean:tmpl',
    'replace',
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
    'vendor:regular',
    'html2js',
    'useminPrepare:dev',
    'concat',
    'clean:tmpl',
    'replace',
    'copy',
    'after-copy'
  ]);
  grunt.task.registerTask('release', 'release:<platform>:<arch>', function(p, a) {
    grunt.task.run(['config:prod', 'clean:all', 'shell:buildBinary:'+p+':'+a, 'shell:downloadDockerBinary:'+p+':'+a, 'before-copy', 'copy:assets', 'after-copy' ]);
  });
  grunt.registerTask('lint', ['eslint']);
  grunt.registerTask('run-dev', ['build', 'shell:run:'+arch, 'watch:build']);
  grunt.registerTask('clear', ['clean:app']);

  // Load content of `vendor.yml` to src.jsVendor, src.cssVendor and src.angularVendor
  grunt.registerTask('vendor', 'vendor:<minified|regular>', function(min) {
      // Argument `min` defaults to 'minified'
      var minification = (min === '') ? 'minified' : min;
      var vendorFile = grunt.file.readYAML('vendor.yml');
      for (var filelist in vendorFile) {
          if (vendorFile.hasOwnProperty(filelist)) {
              var list = vendorFile[filelist][minification];
              // Check if any of the files is missing
              for (var itemIndex in list) {
                  if (list.hasOwnProperty(itemIndex)) {
                      var item = list[itemIndex];
                      if (!grunt.file.exists(item)) {
                          grunt.fail.warn('Dependency file ' + item + ' not found.');
                      }
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
var fs = require('fs');

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
  app: ['<%= distdir %>/*', '!<%= distdir %>/../portainer*', '!<%= distdir %>/../docker*'],
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
      {dest: '<%= distdir %>/fonts/',  src: '*.{ttf,woff,woff2,eof,svg}', expand: true, cwd: 'node_modules/font-awesome/fonts/'},
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
    files: { '<%= distdir %>/js/vendor.js': ['<%= src.jsVendor %>'] ,
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
    src: '<%= distdir %>/css/<%= pkg.name %>.css',
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
        { match: 'CONFIG_GA_ID', replacement: '<%= pkg.config.GA_ID %>' }
      ]
    },
    files: [
      {
        expand: true,
        flatten: true,
        src: ['.tmp/concat/js/app.js'],
        dest: '.tmp/concat/js'
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

function shell_run(arch) {
  return [
    'docker rm -f portainer',
    'docker run -d -p 9000:9000 -v $(pwd)/dist:/app -v /tmp/portainer:/data -v /var/run/docker.sock:/var/run/docker.sock:z --name portainer portainer/base /app/portainer-linux-' + arch + ' --no-analytics'
  ].join(';');
}

function shell_downloadDockerBinary(p, a) {
  var ps = { 'windows': 'win', 'darwin': 'mac' };
  var as = { 'amd64': 'x86_64', 'arm': 'armhf', 'arm64': 'aarch64' };
  var ip = ((ps[p] === undefined) ? p : ps[p]);
  var ia = ((as[a] === undefined) ? a : as[a]);
  return [
    'if [ -f '+(( p === 'win' ) ? 'dist/docker.exe' : 'dist/docker')+' ]; then',
      'echo "Docker binary exists";',
    'else',
      'build/download_docker_binary.sh ' + ip + ' ' + ia + ' <%= shippedDockerVersion %>;',
    'fi'
  ].join(' ');
}

gruntfile_cfg.shell = {
  buildBinary: { command: shell_buildBinary },
  run: { command: shell_run },
  downloadDockerBinary: { command: shell_downloadDockerBinary }
};
