module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('gruntify-eslint');
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
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-config');

  grunt.registerTask('default', ['eslint', 'build']);
  grunt.registerTask('build', [
    'config:dev',
    'clean:app',
    'if:linuxAmd64BinaryNotExist',
    'html2js',
    'useminPrepare:dev',
    'recess:build',
    'concat',
    'clean:tmpl',
    'replace',
    'copy',
    'filerev',
    'usemin',
    'clean:tmp'
  ]);
  grunt.registerTask('release-linux-386', [
    'config:prod',
    'clean:all',
    'if:linux386BinaryNotExist',
    'html2js',
    'useminPrepare:release',
    'recess:build',
    'concat',
    'clean:tmpl',
    'cssmin',
    'replace',
    'uglify',
    'copy:assets',
    'filerev',
    'usemin',
    'clean:tmp'
  ]);
  grunt.registerTask('release-linux-amd64', [
    'config:prod',
    'clean:all',
    'if:linuxAmd64BinaryNotExist',
    'html2js',
    'useminPrepare:release',
    'recess:build',
    'concat',
    'clean:tmpl',
    'cssmin',
    'replace',
    'uglify',
    'copy:assets',
    'filerev',
    'usemin',
    'clean:tmp'
  ]);
  grunt.registerTask('release-linux-arm', [
    'config:prod',
    'clean:all',
    'if:linuxArmBinaryNotExist',
    'html2js',
    'useminPrepare:release',
    'recess:build',
    'concat',
    'clean:tmpl',
    'cssmin',
    'replace',
    'uglify',
    'copy',
    'filerev',
    'usemin',
    'clean:tmp'
  ]);
  grunt.registerTask('release-linux-arm64', [
    'config:prod',
    'clean:all',
    'if:linuxArm64BinaryNotExist',
    'html2js',
    'useminPrepare:release',
    'recess:build',
    'concat',
    'clean:tmpl',
    'cssmin',
    'replace',
    'uglify',
    'copy',
    'filerev',
    'usemin',
    'clean:tmp'
  ]);
  grunt.registerTask('release-linux-ppc64le', [
    'config:prod',
    'clean:all',
    'if:linuxPpc64leBinaryNotExist',
    'html2js',
    'useminPrepare:release',
    'recess:build',
    'concat',
    'clean:tmpl',
    'cssmin',
    'replace',
    'uglify',
    'copy',
    'filerev',
    'usemin',
    'clean:tmp'
  ]);
  grunt.registerTask('release-windows-amd64', [
    'config:prod',
    'clean:all',
    'if:windowsAmd64BinaryNotExist',
    'html2js',
    'useminPrepare:release',
    'recess:build',
    'concat',
    'clean:tmpl',
    'cssmin',
    'replace',
    'uglify',
    'copy',
    'filerev',
    'usemin',
    'clean:tmp'
  ]);
  grunt.registerTask('release-darwin-amd64', [
    'config:prod',
    'clean:all',
    'if:darwinAmd64BinaryNotExist',
    'html2js',
    'useminPrepare:release',
    'recess:build',
    'concat',
    'clean:tmpl',
    'cssmin',
    'replace',
    'uglify',
    'copy',
    'filerev',
    'usemin',
    'clean:tmp'
  ]);
  grunt.registerTask('lint', ['eslint']);
  grunt.registerTask('run', ['if:linuxAmd64BinaryNotExist', 'build', 'shell:buildImage', 'shell:run']);
  grunt.registerTask('run-swarm', ['if:linuxAmd64BinaryNotExist', 'build', 'shell:buildImage', 'shell:runSwarm', 'watch:buildSwarm']);
  grunt.registerTask('run-swarm-local', ['if:linuxAmd64BinaryNotExist', 'build', 'shell:buildImage', 'shell:runSwarmLocal', 'watch:buildSwarm']);
  grunt.registerTask('run-dev', ['if:linuxAmd64BinaryNotExist', 'shell:buildImage', 'shell:run', 'watch:build']);
  grunt.registerTask('run-ssl', ['if:linuxAmd64BinaryNotExist', 'shell:buildImage', 'shell:runSsl', 'watch:buildSsl']);
  grunt.registerTask('clear', ['clean:app']);

  // Print a timestamp (useful for when watching)
  grunt.registerTask('timestamp', function () {
    grunt.log.subhead(Date());
  });

  // Project configuration.
  grunt.initConfig({
    distdir: 'dist',
    pkg: grunt.file.readJSON('package.json'),
    config: {
      dev: {
        options: {
          variables: {
            'environment': 'development'
          }
        }
      },
      prod: {
        options: {
          variables: {
            'environment': 'production'
          }
        }
      }
    },
    src: {
      js: ['app/**/*.js', '!app/**/*.spec.js'],
      jsTpl: ['<%= distdir %>/templates/**/*.js'],
      jsVendor: [
        'bower_components/jquery/dist/jquery.min.js',
        'bower_components/bootstrap/dist/js/bootstrap.min.js',
        'bower_components/Chart.js/Chart.min.js',
        'bower_components/lodash/dist/lodash.min.js',
        'bower_components/splitargs/src/splitargs.js',
        'bower_components/filesize/lib/filesize.min.js',
        'bower_components/moment/min/moment.min.js',
        'bower_components/xterm.js/dist/xterm.js',
        'bower_components/bootbox.js/bootbox.js',
        'bower_components/angular-multi-select/isteven-multi-select.js',
        'bower_components/toastr/toastr.min.js',
        'assets/js/legend.js' // Not a bower package
      ],
      html: ['index.html'],
      tpl: ['app/components/**/*.html'],
      css: ['assets/css/app.css'],
      cssVendor: [
        'bower_components/bootstrap/dist/css/bootstrap.css',
        'bower_components/font-awesome/css/font-awesome.min.css',
        'bower_components/rdash-ui/dist/css/rdash.min.css',
        'bower_components/angular-ui-select/dist/select.min.css',
        'bower_components/xterm.js/dist/xterm.css',
        'bower_components/angular-multi-select/isteven-multi-select.css',
        'bower_components/toastr/toastr.min.css'
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
        'bower_components/angular-google-analytics/dist/angular-google-analytics.min.js',
        'bower_components/angular-ui-select/dist/select.min.js'],
        dest: '<%= distdir %>/js/angular.js'
      }
    },
    uglify: {
      dist: {
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
    eslint: {
      src: ['gruntfile.js', '<%= src.js %>'],
      options: {
			  configFile: '.eslintrc.yml'
		  }
    },
    shell: {
      buildImage: {
        command: 'docker build --rm -t portainer -f build/linux/Dockerfile .'
      },
      buildLinuxAmd64Binary: {
        command: [
          'docker run --rm -v $(pwd)/api:/src portainer/golang-builder /src/cmd/portainer',
          'shasum api/cmd/portainer/portainer > portainer-checksum.txt',
          'mkdir -p dist',
          'mv api/cmd/portainer/portainer dist/'
        ].join(' && ')
      },
      buildLinux386Binary: {
        command: [
          'docker run --rm -v $(pwd)/api:/src -e BUILD_GOOS="linux" -e BUILD_GOARCH="386" portainer/golang-builder:cross-platform /src/cmd/portainer',
          'shasum api/cmd/portainer/portainer-linux-386 > portainer-checksum.txt',
          'mkdir -p dist',
          'mv api/cmd/portainer/portainer-linux-386 dist/portainer'
        ].join(' && ')
      },
      buildLinuxArmBinary: {
        command: [
          'docker run --rm -v $(pwd)/api:/src -e BUILD_GOOS="linux" -e BUILD_GOARCH="arm" portainer/golang-builder:cross-platform /src/cmd/portainer',
          'shasum api/cmd/portainer/portainer-linux-arm > portainer-checksum.txt',
          'mkdir -p dist',
          'mv api/cmd/portainer/portainer-linux-arm dist/portainer'
        ].join(' && ')
      },
      buildLinuxArm64Binary: {
        command: [
          'docker run --rm -v $(pwd)/api:/src -e BUILD_GOOS="linux" -e BUILD_GOARCH="arm64" portainer/golang-builder:cross-platform /src/cmd/portainer',
          'shasum api/cmd/portainer/portainer-linux-arm64 > portainer-checksum.txt',
          'mkdir -p dist',
          'mv api/cmd/portainer/portainer-linux-arm64 dist/portainer'
        ].join(' && ')
      },
      buildLinuxPpc64leBinary: {
        command: [
          'docker run --rm -v $(pwd)/api:/src -e BUILD_GOOS="linux" -e BUILD_GOARCH="ppc64le" portainer/golang-builder:cross-platform /src/cmd/portainer',
          'shasum api/cmd/portainer/portainer-linux-ppc64le > portainer-checksum.txt',
          'mkdir -p dist',
          'mv api/cmd/portainer/portainer-linux-ppc64le dist/portainer'
        ].join(' && ')
      },
      buildDarwinAmd64Binary: {
        command: [
          'docker run --rm -v $(pwd)/api:/src -e BUILD_GOOS="darwin" -e BUILD_GOARCH="amd64" portainer/golang-builder:cross-platform /src/cmd/portainer',
          'shasum api/cmd/portainer/portainer-darwin-amd64 > portainer-checksum.txt',
          'mkdir -p dist',
          'mv api/cmd/portainer/portainer-darwin-amd64 dist/portainer'
        ].join(' && ')
      },
      buildWindowsAmd64Binary: {
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
          'docker run --privileged -d -p 9000:9000 -v /tmp/portainer:/data -v /var/run/docker.sock:/var/run/docker.sock --name portainer portainer --no-analytics'
        ].join(';')
      },
      runSwarm: {
        command: [
          'docker stop portainer',
          'docker rm portainer',
          'docker run -d -p 9000:9000 --name portainer portainer -H tcp://10.0.7.10:2375 --no-analytics'
        ].join(';')
      },
      runSwarmLocal: {
        command: [
          'docker stop portainer',
          'docker rm portainer',
          'docker run -d -p 9000:9000 -v /var/run/docker.sock:/var/run/docker.sock --name portainer portainer --no-analytics'
        ].join(';')
      },
      runSsl: {
        command: [
          'docker stop portainer',
          'docker rm portainer',
          'docker run -d -p 9000:9000 -v /tmp/portainer:/data -v /tmp/docker-ssl:/certs --name portainer portainer -H tcp://10.0.7.10:2376 --tlsverify --no-analytics'
        ].join(';')
      },
      cleanImages: {
        command: 'docker rmi $(docker images -q -f dangling=true)'
      }
    },
    'if': {
      linuxAmd64BinaryNotExist: {
        options: {
          executable: 'dist/portainer'
        },
        ifFalse: ['shell:buildLinuxAmd64Binary']
      },
      linux386BinaryNotExist: {
        options: {
          executable: 'dist/portainer'
        },
        ifFalse: ['shell:buildLinux386Binary']
      },
      linuxArmBinaryNotExist: {
        options: {
          executable: 'dist/portainer'
        },
        ifFalse: ['shell:buildLinuxArmBinary']
      },
      linuxArm64BinaryNotExist: {
        options: {
          executable: 'dist/portainer'
        },
        ifFalse: ['shell:buildLinuxArm64Binary']
      },
      linuxPpc64leBinaryNotExist: {
        options: {
          executable: 'dist/portainer'
        },
        ifFalse: ['shell:buildLinuxPpc64leBinary']
      },
      darwinAmd64BinaryNotExist: {
        options: {
          executable: 'dist/portainer'
        },
        ifFalse: ['shell:buildDarwinAmd64Binary']
      },
      windowsAmd64BinaryNotExist: {
        options: {
          executable: 'dist/portainer.exe'
        },
        ifFalse: ['shell:buildWindowsAmd64Binary']
      }
    },
    replace: {
      concat: {
        options: {
          patterns: [
            {
              match: 'ENVIRONMENT',
              replacement: '<%= grunt.config.get("environment") %>'
            },
            {
              match: 'CONFIG_GA_ID',
              replacement: '<%= pkg.config.GA_ID %>'
            }
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
    }
  });
};
