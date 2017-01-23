module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-recess');
  grunt.loadNpmTasks('grunt-html2js');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-if');
  grunt.loadNpmTasks('grunt-filerev');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-usemin');

  // Default task.
  grunt.registerTask('default', ['jshint', 'build']);
  grunt.registerTask('build', [
    'clean:app',
    'if:unixBinaryNotExist',
    'html2js',
    'useminPrepare:dev',
    'recess:build',
    'concat',
    'clean:tmpl',
    'copy',
    'filerev',
    'usemin',
    'clean:tmp'
  ]);
  grunt.registerTask('release', [
    'clean:all',
    'if:unixBinaryNotExist',
    'html2js',
    'useminPrepare:release',
    'recess:build',
    'concat',
    'clean:tmpl',
    'cssmin',
    'uglify',
    'copy:assets',
    'filerev',
    'usemin',
    'clean:tmp'
  ]);
  grunt.registerTask('release-win', [
    'clean:all',
    'if:windowsBinaryNotExist',
    'html2js',
    'useminPrepare',
    'recess:build',
    'concat',
    'clean:tmpl',
    'cssmin',
    'uglify',
    'copy',
    'filerev',
    'usemin',
    'clean:tmp'
  ]);
  grunt.registerTask('release-arm', [
    'clean:all',
    'if:unixArmBinaryNotExist',
    'html2js',
    'useminPrepare',
    'recess:build',
    'concat',
    'clean:tmpl',
    'cssmin',
    'uglify',
    'copy',
    'filerev',
    'usemin',
    'clean:tmp'
  ]);
  grunt.registerTask('release-arm64', [
    'clean:all',
    'if:unixArm64BinaryNotExist',
    'html2js',
    'useminPrepare',
    'recess:build',
    'concat',
    'clean:tmpl',
    'cssmin',
    'uglify',
    'copy',
    'filerev',
    'usemin',
    'clean:tmp'
  ]);
  grunt.registerTask('release-macos', [
    'clean:all',
    'if:darwinBinaryNotExist',
    'html2js',
    'useminPrepare',
    'recess:build',
    'concat',
    'clean:tmpl',
    'cssmin',
    'uglify',
    'copy',
    'filerev',
    'usemin',
    'clean:tmp'
  ]);
  grunt.registerTask('lint', ['jshint']);
  grunt.registerTask('run', ['if:unixBinaryNotExist', 'build', 'shell:buildImage', 'shell:run']);
  grunt.registerTask('run-swarm', ['if:unixBinaryNotExist', 'build', 'shell:buildImage', 'shell:runSwarm', 'watch:buildSwarm']);
  grunt.registerTask('run-swarm-local', ['if:unixBinaryNotExist', 'build', 'shell:buildImage', 'shell:runSwarmLocal', 'watch:buildSwarm']);
  grunt.registerTask('run-dev', ['if:unixBinaryNotExist', 'shell:buildImage', 'shell:run', 'watch:build']);
  grunt.registerTask('run-ssl', ['if:unixBinaryNotExist', 'shell:buildImage', 'shell:runSsl', 'watch:buildSsl']);
  grunt.registerTask('clear', ['clean:app']);

  // Print a timestamp (useful for when watching)
  grunt.registerTask('timestamp', function () {
    grunt.log.subhead(Date());
  });

  // Project configuration.
  grunt.initConfig({
    distdir: 'dist',
    pkg: grunt.file.readJSON('package.json'),
    src: {
      js: ['app/**/*.js', '!app/**/*.spec.js'],
      jsTpl: ['<%= distdir %>/templates/**/*.js'],
      jsVendor: [
        'bower_components/jquery/dist/jquery.min.js',
        'bower_components/bootstrap/dist/js/bootstrap.min.js',
        'bower_components/Chart.js/Chart.min.js',
        'bower_components/lodash/dist/lodash.min.js',
        'bower_components/filesize/lib/filesize.min.js',
        'bower_components/moment/min/moment.min.js',
        'bower_components/xterm.js/dist/xterm.js',
        'assets/js/jquery.gritter.js', // Using custom version to fix error in minified build due to "use strict"
        'assets/js/legend.js' // Not a bower package
      ],
      html: ['index.html'],
      tpl: ['app/components/**/*.html'],
      css: ['assets/css/app.css'],
      cssVendor: [
        'bower_components/bootstrap/dist/css/bootstrap.css',
        'bower_components/jquery.gritter/css/jquery.gritter.css',
        'bower_components/font-awesome/css/font-awesome.min.css',
        'bower_components/rdash-ui/dist/css/rdash.min.css',
        'bower_components/angular-ui-select/dist/select.min.css',
        'bower_components/xterm.js/dist/xterm.css'
      ]
    },
    clean: {
      all: ['<%= distdir %>/*'],
      app: ['<%= distdir %>/*', '!<%= distdir %>/portainer'],
      tmpl: ['<%= distdir %>/templates'],
      tmp: ['<%= distdir %>/js/*', '!<%= distdir %>/js/app.*.js', '<%= distdir %>/css/*', '!<%= distdir %>/css/app.*.css']
    },
    useminPrepare: {
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
          root: '<%= distdir %>'
        }
      }
    },
    filerev: {
      files: {
        src: ['<%= distdir %>/js/*.js', '<%= distdir %>/css/*.css']
      }
    },
    usemin: {
      html: ['<%= distdir %>/index.html']
    },
    copy: {
      bundle: {
        files: [
          {
            dest: '<%= distdir %>/js/',
            src: ['app.js'],
            expand: true,
            cwd: '.tmp/concat/js/'
          },
          {
            dest: '<%= distdir %>/css/',
            src: ['app.css'],
            expand: true,
            cwd: '.tmp/concat/css/'
          }
        ]
      },
      assets: {
        files: [
          {dest: '<%= distdir %>/fonts/', src: '*.{ttf,woff,woff2,eof,svg}', expand: true, cwd: 'bower_components/bootstrap/fonts/'},
          {dest: '<%= distdir %>/fonts/', src: '*.{ttf,woff,woff2,eof,svg}', expand: true, cwd: 'bower_components/font-awesome/fonts/'},
          {dest: '<%= distdir %>/fonts/', src: '*.{ttf,woff,woff2,eof,svg}', expand: true, cwd: 'bower_components/rdash-ui/dist/fonts/'},
          {
            dest: '<%= distdir %>/images/',
            src: ['**', '!trees.jpg'],
            expand: true,
            cwd: 'bower_components/jquery.gritter/images/'
          },
          {
            dest: '<%= distdir %>/images/',
            src: ['**'],
            expand: true,
            cwd: 'assets/images/'
          },
          {dest: '<%= distdir %>/ico', src: '**', expand: true, cwd: 'assets/ico'}
        ]
      }
    },
    html2js: {
      app: {
        options: {
          base: '.'
        },
        src: ['<%= src.tpl %>'],
        dest: '<%= distdir %>/templates/app.js',
        module: '<%= pkg.name %>.templates'
      }
    },
    concat: {
      dist: {
        options: {
          process: true
        },
        src: ['<%= src.js %>', '<%= src.jsTpl %>'],
        dest: '<%= distdir %>/js/<%= pkg.name %>.js'
      },
      vendor: {
        src: ['<%= src.jsVendor %>'],
        dest: '<%= distdir %>/js/vendor.js'
      },
      index: {
        src: ['index.html'],
        dest: '<%= distdir %>/index.html',
        options: {
          process: true
        }
      },
      angular: {
        src: ['bower_components/angular/angular.min.js',
        'bower_components/angular-sanitize/angular-sanitize.min.js',
        'bower_components/angular-cookies/angular-cookies.min.js',
        'bower_components/angular-local-storage/dist/angular-local-storage.min.js',
        'bower_components/angular-jwt/dist/angular-jwt.min.js',
        'bower_components/angular-ui-router/release/angular-ui-router.min.js',
        'bower_components/angular-resource/angular-resource.min.js',
        'bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
        'bower_components/ng-file-upload/ng-file-upload.min.js',
        'bower_components/angular-utils-pagination/dirPagination.js',
        'bower_components/angular-ui-select/dist/select.min.js'],
        dest: '<%= distdir %>/js/angular.js'
      }
    },
    uglify: {
      dist: {
        // options: {
        // },
        src: ['<%= src.js %>', '<%= src.jsTpl %>'],
        dest: '<%= distdir %>/js/<%= pkg.name %>.js'
      },
      vendor: {
        options: {
          preserveComments: 'some' // Preserve license comments
        },
        src: ['<%= src.jsVendor %>'],
        dest: '<%= distdir %>/js/vendor.js'
      },
      angular: {
        options: {
          preserveComments: 'some' // Preserve license comments
        },
        src: ['<%= concat.angular.src %>'],
        dest: '<%= distdir %>/js/angular.js'
      }
    },
    recess: { // TODO: not maintained, unable to preserve license comments, switch out for something better.
      build: {
        files: {
          '<%= distdir %>/css/<%= pkg.name %>.css': ['<%= src.css %>'],
          '<%= distdir %>/css/vendor.css': ['<%= src.cssVendor %>']
        },
        options: {
          compile: true,
          noOverqualifying: false // TODO: Added because of .nav class, rename
        }
      },
      min: {
        files: {
          '<%= distdir %>/css/<%= pkg.name %>.css': ['<%= src.css %>'],
          '<%= distdir %>/css/vendor.css': ['<%= src.cssVendor %>']
        },
        options: {
          compile: true,
          compress: true,
          noOverqualifying: false // TODO: Added because of .nav class, rename
        }
      }
    },
    watch: {
      all: {
        files: ['<%= src.js %>', '<%= src.css %>', '<%= src.tpl %>', '<%= src.html %>'],
        tasks: ['default', 'timestamp']
      },
      build: {
        files: ['<%= src.js %>', '<%= src.css %>', '<%= src.tpl %>', '<%= src.html %>'],
        tasks: ['build', 'shell:buildImage', 'shell:run', 'shell:cleanImages']
        /*
        * Why don't we just use a host volume
        * http.FileServer uses sendFile which virtualbox hates
        * Tried using a host volume with -v, copying files with `docker cp`, restating container, none worked
        * Rebuilding image on each change was only method that worked, takes ~4s per change to update
        */
      },
      buildSwarm: {
        files: ['<%= src.js %>', '<%= src.css %>', '<%= src.tpl %>', '<%= src.html %>'],
        tasks: ['build', 'shell:buildImage', 'shell:runSwarm', 'shell:cleanImages']
      },
      buildSsl: {
        files: ['<%= src.js %>', '<%= src.css %>', '<%= src.tpl %>', '<%= src.html %>'],
        tasks: ['build', 'shell:buildImage', 'shell:runSsl', 'shell:cleanImages']
      }
    },
    jshint: {
      files: ['gruntfile.js', '<%= src.js %>'],
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        boss: true,
        eqnull: true,
        globals: {
          angular: false,
          '$': false
        }
      }
    },
    shell: {
      buildImage: {
        command: 'docker build --rm -t portainer -f build/linux/Dockerfile .'
      },
      buildBinary: {
        command: [
          'docker run --rm -v $(pwd)/api:/src portainer/golang-builder /src/cmd/portainer',
          'shasum api/cmd/portainer/portainer > portainer-checksum.txt',
          'mkdir -p dist',
          'mv api/cmd/portainer/portainer dist/'
        ].join(' && ')
      },
      buildUnixArmBinary: {
        command: [
          'docker run --rm -v $(pwd)/api:/src -e BUILD_GOOS="linux" -e BUILD_GOARCH="arm" portainer/golang-builder:cross-platform /src/cmd/portainer',
          'shasum api/cmd/portainer/portainer-linux-arm > portainer-checksum.txt',
          'mkdir -p dist',
          'mv api/cmd/portainer/portainer-linux-arm dist/portainer'
        ].join(' && ')
      },
        buildUnixArm64Binary: {
            command: [
                'docker run --rm -v $(pwd)/api:/src -e BUILD_GOOS="linux" -e BUILD_GOARCH="arm64" portainer/golang-builder:cross-platform /src/cmd/portainer',
                'shasum api/cmd/portainer/portainer-linux-arm64 > portainer-checksum.txt',
                'mkdir -p dist',
                'mv api/cmd/portainer/portainer-linux-arm64 dist/portainer'
            ].join(' && ')
        },
      buildDarwinBinary: {
        command: [
          'docker run --rm -v $(pwd)/api:/src -e BUILD_GOOS="darwin" -e BUILD_GOARCH="amd64" portainer/golang-builder:cross-platform /src/cmd/portainer',
          'shasum api/cmd/portainer/portainer-darwin-amd64 > portainer-checksum.txt',
          'mkdir -p dist',
          'mv api/cmd/portainer/portainer-darwin-amd64 dist/portainer'
        ].join(' && ')
      },
      buildWindowsBinary: {
        command: [
          'docker run --rm -v $(pwd)/api:/src -e BUILD_GOOS="windows" -e BUILD_GOARCH="amd64" portainer/golang-builder:cross-platform /src/cmd/portainer',
          'shasum api/cmd/portainer/portainer-windows-amd64 > portainer-checksum.txt',
          'mkdir -p dist',
          'mv api/cmd/portainer/portainer-windows-amd64 dist/portainer.exe'
        ].join(' && ')
      },
      run: {
        command: [
          'docker stop portainer',
          'docker rm portainer',
          'docker run --privileged -d -p 9000:9000 -v /tmp/portainer:/data -v /var/run/docker.sock:/var/run/docker.sock --name portainer portainer'
        ].join(';')
      },
      runSwarm: {
        command: [
          'docker stop portainer',
          'docker rm portainer',
          'docker run -d -p 9000:9000 --name portainer portainer -H tcp://ip10_0_18_3-2375.play-with-docker.com:80'
        ].join(';')
      },
      runSwarmLocal: {
        command: [
          'docker stop portainer',
          'docker rm portainer',
          'docker run -d -p 9000:9000 -v /var/run/docker.sock:/var/run/docker.sock --name portainer portainer'
        ].join(';')
      },
      runSsl: {
        command: [
          'docker stop portainer',
          'docker rm portainer',
          'docker run -d -p 9000:9000 -v /tmp/portainer:/data -v /tmp/docker-ssl:/certs --name portainer portainer -H tcp://10.0.7.10:2376 --tlsverify'
        ].join(';')
      },
      cleanImages: {
        command: 'docker rmi $(docker images -q -f dangling=true)'
      }
    },
    'if': {
      unixBinaryNotExist: {
        options: {
          executable: 'dist/portainer'
        },
        ifFalse: ['shell:buildBinary']
      },
      unixArmBinaryNotExist: {
        options: {
          executable: 'dist/portainer'
        },
        ifFalse: ['shell:buildUnixArmBinary']
      },
      unixArm64BinaryNotExist: {
        options: {
          executable: 'dist/portainer'
        },
        ifFalse: ['shell:buildUnixArm64Binary']
      },
      darwinBinaryNotExist: {
        options: {
          executable: 'dist/portainer'
        },
        ifFalse: ['shell:buildDarwinBinary']
      },
      windowsBinaryNotExist: {
        options: {
          executable: 'dist/portainer.exe'
        },
        ifFalse: ['shell:buildWindowsBinary']
      }
    }
  });
};
