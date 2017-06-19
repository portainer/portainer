var autoprefixer = require('autoprefixer');
var cssnano = require('cssnano');

module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('gruntify-eslint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-html2js');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-filerev');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-config');
  grunt.loadNpmTasks('grunt-postcss');
  grunt.registerTask('default', ['eslint', 'build']);
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
    'shell:buildBinary:linux:amd64',
    'html2js',
    'useminPrepare:dev',
    'concat',
    'clean:tmpl',
    'replace',
    'copy',
    'after-copy'
  ]);
  grunt.registerTask('before-copy', [
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
  grunt.task.registerTask('release', 'release:platform:arch', function(p, a) {
	var cp = 'copy';
	if ( p === 'linux' && ( a === '386' || a === 'amd64' ) ) { cp = 'copy:assets'; }
	grunt.task.run(['config:prod', 'clean:all', 'shell:buildBinary:'+p+':'+a, 'before-copy', cp, 'after-copy' ]);
  });  
  grunt.registerTask('lint', ['eslint']);
  grunt.registerTask('run', ['if:linuxAmd64BinaryNotExist', 'build', 'shell:buildImage', 'shell:run']);
  grunt.registerTask('run-dev', ['if:linuxAmd64BinaryNotExist', 'shell:run', 'watch:build']);
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
      tpl: ['app/components/**/*.html', 'app/directives/**/*.html'],
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
      css: {
        src: ['<%= src.cssVendor %>', '<%= src.css %>'],
        dest: '<%= distdir %>/css/<%= pkg.name %>.css'
      },
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
    postcss: {
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
    },
    watch: {
      all: {
        files: ['<%= src.js %>', '<%= src.css %>', '<%= src.tpl %>', '<%= src.html %>'],
        tasks: ['default', 'timestamp']
      },
      build: {
        files: ['<%= src.js %>', '<%= src.css %>', '<%= src.tpl %>', '<%= src.html %>'],
        tasks: ['build']
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
	  buildBinary: {
		command: function (p, a) {
			       var file = 'dist/portainer';
				   
                   if ( p === 'windows' ) { file = 'dist/portainer.exe'; }
				   
                   if (grunt.file.isFile(file)) {
                     return 'echo \'BinaryExists\'';
                   } else {
                     return 'build/build_cross-platform.sh ' + p + ' ' + a;
                   }
			     }
	  },  
      run: {
        command: [
          'docker stop portainer',
          'docker rm portainer',
          'docker run -d -p 9000:9000 -v $(pwd)/dist:/app -v /tmp/portainer:/data -v /var/run/docker.sock:/var/run/docker.sock:z --name portainer centurylink/ca-certs /app/portainer --no-analytics -a /app'
        ].join(';')
      },
      cleanImages: {
        command: 'docker rmi $(docker images -q -f dangling=true)'
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
