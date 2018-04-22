var loadGruntTasks = require('load-grunt-tasks');
var gruntfile_cfg = {};
var dwork = ( process.env.WORKDIR === '' ) ? './' : process.env.WORKDIR ; // Must include trailing slash
var host_dwork = ( process.env.HOST_WORKDIR === '' ) ? '/$(pwd)/' : process.env.HOST_WORKDIR;  // Must be absolute and include trailing slash
var os = require('os');
var harch = os.arch();
var harchs = {
  'arm': 'armhf',
  'arm64': 'aarch64',
  'ppc64': 'ppc64le',
  's390x': 's390x',
  'x64': 'amd64'
};

module.exports = function(grunt) {

  var hostarch = harchs[harch];
  if (hostarch === 'undefined') {
    grunt.fail.warn('Platform ' + harch + ' not supported for backend development.');
    hostarch = harch;
  }

  loadGruntTasks(grunt, {
    config: dwork + 'package.json',
    pattern: ['grunt*', '@*/grunt-*', 'gruntify-*']
  });
  grunt.registerTask('default', ['lint', 'frontend:dev']);
  grunt.registerTask('lint', ['eslint:nofix']);
  grunt.registerTask('clear', ['clean:app']);

  grunt.task.registerTask('fmt', 'build:app|api', function(a) {
    if (a!=='app') { grunt.task.run(['shell:gofmt']); }
    if (a!=='api') { grunt.task.run(['eslint:fix']); }
  });

  grunt.registerTask('dev', [
    'frontend:dev',
    'build-dev',
    'shell:extractDockerBinary:linux:' + hostarch,
    'shell:syncDist'
  ]);
  grunt.registerTask('run-dev', ['checkLocalDocker', 'dev', 'shell:rm', 'shell-run', 'watch']);
  grunt.task.registerTask('release', 'release:<platform>:<arch>', function(p, a) {
    grunt.task.run(['frontend:release', 'build:' + p + ':' + a]);
  });

  grunt.task.registerTask('shell-run', [ 'shell:run:'+hostarch ]);
  grunt.task.registerTask('build-dev', [ 'shell:buildBinary:linux:' + hostarch + ':dev' ]);

  grunt.task.registerTask('build', 'build:<platform>:<arch>', function(p, a) {
    grunt.task.run([
      'checkLocalDocker',
      'shell:buildBinary:' + p + ':' + a,
      'shell:extractDockerBinary:' + p + ':' + a
    ]);
  });

  grunt.task.registerTask('frontend', 'frontend:dev|release', function(d) {
    grunt.task.run([
      'config:' + d,
      'clean:' + ((d === 'dev') ? 'app' : 'all'),
      'vendor',
      'html2js',
      'useminPrepare:' + d,
      'concat'
    ]);
    if (d === 'release') { grunt.task.run('postcss:build'); }
    grunt.task.run(['clean:tmpl', 'replace']);
    if (d === 'release') { grunt.task.run('uglify'); }
    grunt.task.run([
      'copy' + ((d === 'dev') ? '' : ':assets'),
      'filerev',
      'usemin',
      'clean:tmp'
    ]);
  });

  grunt.registerTask('checkBuildBinary', 'checkBuildBinary:<platform>:<arch>', function(p, a) {
    var tag = p + '-' + a;
    if (grunt.file.isFile('dist/portainer-' + tag + ((p === 'windows') ? '.exe' : ''))) {
      console.log('BinaryExists');
    } else {
      grunt.task.run('shell:buildBinary:' + p + ':' + a);
    }
  });

  grunt.registerTask('checkLocalDocker', [ 'shell:extractDockerBinary:linux:' + hostarch, 'shell:Docker2Path' ]);

  // Check if any of the files is missing in each of the vendors lists
  var checkVendorList = function(list) {
    for (var itemIndex in list) {
        if (list.hasOwnProperty(itemIndex)) {
            var item = 'node_modules/'+list[itemIndex];
            if (!grunt.file.exists(item)) {
                grunt.fail.warn('Dependency file ' + item + ' not found.');
            }
            list[itemIndex] = item;
        }
    }
    return list;
  };

  // Load content of `vendor.yml` to src.jsVendor, src.cssVendor and src.angularVendor
  grunt.registerTask('vendor', function() {
      var vendorFile = grunt.file.readYAML(dwork + 'vendor.yml');
      for (var filelist in vendorFile) {
          if (vendorFile.hasOwnProperty(filelist)) {
              var list = vendorFile[filelist];
              list = checkVendorList(list);
              // If none is missing, save the list
              grunt.config('src.' + filelist + 'Vendor', list);
          }
      }
  });

  // Project configuration.
  grunt.initConfig({
    distdir: 'dist/public/', // Must include trailing slash
    workdir: dwork, // Must include trailing slash
    dockerdir: 'docker-binaries/',  // Must include trailing slash
    localdocker: 'bin/', // Must be in the PATH
    shippedDockerVersion: '17.09.0-ce',
    pkg: grunt.file.readJSON(dwork+'package.json'),
    config: gruntfile_cfg.config,
    src: gruntfile_cfg.src,
    clean: gruntfile_cfg.clean,
    useminPrepare: gruntfile_cfg.useminPrepare,
    filerev: { files: { src: ['<%= distdir %>js/*.js', '<%= distdir %>css/*.css'] }},
    usemin: { html: ['<%= distdir %>index.html'] },
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
  dev:     { options: { variables: { 'environment': 'development' }}},
  release: { options: { variables: { 'environment': 'production'  }}}
};

gruntfile_cfg.src = {
  js:   ['<%= workdir %>app/**/__module.js', '<%= workdir %>app/**/*.js', '!<%= workdir %>app/**/*.spec.js'],
  jsTpl:['<%= distdir %>templates/**/*.js'],
  go:   ['<%= workdir %>api/**/*.go'],
  html: ['<%= workdir %>index.html'],
  tpl:  ['<%= workdir %>app/**/*.html'],
  css:  ['<%= workdir %>assets/css/app.css', '<%= workdir %>app/**/*.css']
};

gruntfile_cfg.clean = {
  all: ['<%= distdir %>../*'],
  app: ['<%= distdir %>*'],
  tmpl:['<%= distdir %>templates'],
  tmp: ['<%= distdir %>js/*', '!<%= distdir %>js/app.*.js', '<%= distdir %>css/*', '!<%= distdir %>css/app.*.css']
};

gruntfile_cfg.useminPrepare = {
  dev: {
    src: '<%= src.html %>',
    options: {
      root: '<%= distdir %>',
      flow: { steps: { js: ['concat'], css: ['concat'] }}
    }
  },
  release: {
    src: '<%= src.html %>',
    options: { root: '<%= distdir %>', dest: '<%= distdir %>' }
  }
};

gruntfile_cfg.copy = {
  bundle: {
    files: [
      {dest:'<%= distdir %>js/',  src: ['app.js'],  expand: true, cwd: '.tmp/concat/js/'},
      {dest:'<%= distdir %>css/', src: ['app.css'], expand: true, cwd: '.tmp/concat/css/'}
    ]
  },
  assets: {
    files: [
      {dest:'<%= distdir %>fonts/',  src:'*.{ttf,woff,woff2,eof,svg}', expand:true, cwd:'node_modules/bootstrap/fonts/'},
      {dest:'<%= distdir %>fonts/',  src:'*.{ttf,woff,woff2,eof,svg}', expand:true, cwd:'node_modules/@fortawesome/fontawesome-free-webfonts/webfonts/'},
      {dest:'<%= distdir %>fonts/',  src:'*.{ttf,woff,woff2,eof,svg}', expand:true, cwd:'node_modules/rdash-ui/dist/fonts/'},
      {dest:'<%= distdir %>images/', src:'**',                         expand:true, cwd:'<%= workdir %>assets/images/'},
      {dest:'<%= distdir %>ico',     src:'**',                         expand:true, cwd:'<%= workdir %>assets/ico'}
    ]
  }
};

gruntfile_cfg.eslint = {
  nofix: {
    src: ['gruntfile.js', '<%= src.js %>'],
    options: { fix: false, configFile: '<%= workdir %>.eslintrc_default.yml' }
  },
  fix: {
    src: ['<%= src.js %>'],
    options: { fix: true,  configFile: '<%= workdir %>.eslintrc_default.yml' }
  }
};

gruntfile_cfg.html2js = {
  app: {
    options: { base: '<%= workdir %>' },
    src: ['<%= src.tpl %>'],
    dest: '<%= distdir %>templates/app.js',
    module: '<%= pkg.name %>.templates'
  }
};

gruntfile_cfg.concat = {
  vendor: {
    files: {
      '<%= distdir %>css/<%= pkg.name %>.css': ['<%= src.cssVendor %>', '<%= src.css %>'],
      '<%= distdir %>js/vendor.js': ['<%= src.jsVendor %>'],
      '<%= distdir %>js/angular.js': ['<%= src.angularVendor %>']
    }
  },
  dist: {
    options: { process: true },
    files: {
      '<%= distdir %>js/<%= pkg.name %>.js': ['<%= src.js %>', '<%= src.jsTpl %>'],
      '<%= distdir %>index.html': ['<%= src.html %>']
    }
  }
};

gruntfile_cfg.uglify = {
  dist: { files: { '<%= distdir %>js/<%= pkg.name %>.js': ['<%= src.js %>', '<%= src.jsTpl %>'] } },
  vendor: {
    options: { preserveComments: 'some' }, // Preserve license comments
    files: {
      '<%= distdir %>js/vendor.js': ['<%= src.jsVendor %>'],
      '<%= distdir %>js/angular.js': ['<%= src.angularVendor %>']
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
  frontend: {
    options: { spawn: false },
    files: ['<%= src.js %>', '<%= src.css %>', '<%= src.tpl %>', '<%= src.html %>'],
    tasks: ['frontend:dev', 'shell:syncDist']
  },
  backend: {
    options: { spawn: false },
    files: ['<%= src.go %>'],
    tasks: ['build-dev', 'shell:rm', 'shell:syncDist', 'shell:rm', 'shell-run']
  }
};

gruntfile_cfg.replace = {
  concat: {
    options: {
      patterns: [
        { match:'ENVIRONMENT',  replacement:'<%= grunt.config.get("environment") %>' },
        { match:'CONFIG_GA_ID', replacement:'<%= pkg.config.GA_ID %>' },
        { match: /..\/webfonts\//g, replacement: '../fonts/'}
      ]
    },
    files: [{
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

function shell_codeclimate(arg) {
  return [
    'docker run -t --rm',
    '-e CODECLIMATE_CODE="'+host_dwork+'"',
    '-e CONTAINER_TIMEOUT_SECONDS=1800',
    '-v "'+host_dwork+'":/code',
    '-v //var/run/docker.sock://var/run/docker.sock',
    '-v //tmp/cc://tmp/cc',
    'codeclimate/codeclimate '+arg
  ].join(' ');
}

function shell_buildBinary(p, a, d) {
  return [
    'rsync -avr --filter \'protect api/vendor\' --filter \'protect api/Godeps\' --delete-before <%= workdir %>api /src-volume' +
    ((d === 'dev') ? '; sed -i -e \'s/APIVersion = ".*/APIVersion = "run-dev"/g\' /src-volume/api/portainer.go' : ''),
    'sed -i -e \'s/Commit = ".*/Commit = "\'"$COMMIT_SHA"\'"/g\' /src-volume/api/portainer.go',
    '<%= workdir %>build/build_in_container.sh ' + p + '-' + a + ' ' + ((p === 'windows') ? '.exe' : '')
  ].join(';');
}

function shell_run(arch) {
  return [
    'docker run -d -p 9001:9000',
    '-v portainer-src-volume:/src',
    '-v /tmp/portainer:/data',
    '-v /var/run/docker.sock:/var/run/docker.sock:z',
    '--name portainer-dev',
    'portainer/base',
    '/src/dist/portainer-linux-' + arch + ' --no-analytics'
  ].join(' ');
}

function shell_downloadDockerBinary(p, a) {
  var ext = ((p === 'windows') ? '.zip' : '.tgz');
  var tarname = 'docker-<%= shippedDockerVersion %>';

  var ps = {
    'windows': 'win',
    'darwin': 'mac'
  };
  var as = {
    'amd64': 'x86_64',
    'arm': 'armhf',
    'arm64': 'aarch64'
  };
  var ip = ((ps[p] === undefined) ? p : ps[p]);
  var ia = ((as[a] === undefined) ? a : as[a]);

  return [
    'mkdir -pv <%= dockerdir %>',
    'wget "https://download.docker.com/' + ip + '/static/stable/' + ia + '/' + tarname + ext + '"',
    'mv ' + tarname + ext + ' <%= dockerdir %>' + tarname + '-' + p + '-' + a + ext
  ].join(';');
}

function shell_extractDockerBinary(p, a) {
  var tarname = 'docker-<%= shippedDockerVersion %>-' + p + '-' + a + ((p === 'windows') ? '.zip' : '.tgz');
  return [
    'rm -rf .tmp/docker-extract',
    'mkdir -pv .tmp/docker-extract',
    ((p === 'windows') ?
      'unzip <%= dockerdir %>'+tarname + ' -d ".tmp/docker-extract"'
    :
      'tar -xvf <%= dockerdir %>'+tarname + ' -C ".tmp/docker-extract"'
    ),
    'mv .tmp/docker-extract/docker/docker' + ((p === 'windows') ? '.exe' : '') + ' <%= distdir %>../'
  ].join(';');
}

gruntfile_cfg.shell = {
  codeclimate: { command: shell_codeclimate },
  gofmt: { command: 'docker run --rm -tv '+host_dwork+':/api portainer/golang-builder gofmt -w /api' },
  buildBinary: { command: shell_buildBinary },
  syncDist: { command: 'rsync -avr --delete-before dist /src-volume' },
  rm: { command: 'if [ -z "$(docker container inspect portainer-dev 2>&1 | grep "Error:")" ]; then docker container rm -f portainer-dev; fi' },
  run: { command: shell_run },
  downloadDockerBinary: { command: shell_downloadDockerBinary },
  extractDockerBinary: { command: shell_extractDockerBinary },
  Docker2Path: {
      command: [
          'if [ -z "`command -v sudo`" ]; then mkdir -pv <%= localdocker %>',
          'mv <%= distdir %>../docker <%= localdocker %>; fi'
      ].join(';')
  }
};
