var autoprefixer = require('autoprefixer');
var cssnano = require('cssnano');

module.exports = function (grunt) {

  var NpmTasks = [
    'grunt-contrib-concat',
    'gruntify-eslint',
    'grunt-contrib-uglify',
    'grunt-contrib-clean',
    'grunt-contrib-copy',
    'grunt-contrib-watch',
    'grunt-html2js',
    'grunt-shell',
    'grunt-filerev',
    'grunt-usemin',
    'grunt-replace',
    'grunt-config',
    'grunt-postcss'
  ];
  for (var n in NpmTasks)  { if (NpmTasks.hasOwnProperty(n)) {
    grunt.loadNpmTasks(NpmTasks[n]);
  }}

  grunt.registerTask('default', ['eslint', 'build']);
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
  grunt.task.registerTask('release', 'release:<platform>:<arch>', function(p, a) {
    grunt.task.run(['config:prod', 'clean:all', 'shell:buildBinary:'+p+':'+a, 'before-copy', 'copy:assets', 'after-copy' ]);
  });
  grunt.registerTask('lint', ['eslint']);
  grunt.registerTask('run-dev', ['build', 'shell:run', 'watch:build']);
  grunt.registerTask('clear', ['clean:app']);

  // Project configuration.
  grunt.initConfig({
    distdir: 'dist',
    pkg: grunt.file.readJSON('package.json'),
    config: {
      dev:  { options: { variables: { 'environment': 'development' }}},
      prod: { options: { variables: { 'environment': 'production'  }}}
    },
    src: {
      js: ['app/**/*.js', '!app/**/*.spec.js'],
      jsTpl: ['<%= distdir %>/templates/**/*.js'],
      html: ['index.html'],
      tpl: ['app/components/**/*.html', 'app/directives/**/*.html'],
      css: ['assets/css/app.css']
    },
    clean: {
      all: ['<%= distdir %>/*'],
      app: ['<%= distdir %>/*', '!<%= distdir %>/portainer*'],
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
    filerev: { files: { src: ['<%= distdir %>/js/*.js', '<%= distdir %>/css/*.css'] }},
    usemin: { html: ['<%= distdir %>/index.html'] },
    copy: {
      bundle: {
        files: [
          {dest:'<%= distdir %>/js/',  src: ['app.js'],  expand: true, cwd: '.tmp/concat/js/' },
          {dest:'<%= distdir %>/css/', src: ['app.css'], expand: true, cwd: '.tmp/concat/css/' }
        ]
      },
      assets: {
        files: [
          {dest:'<%= distdir %>/fonts/',  src: '*.{ttf,woff,woff2,eof,svg}', expand: true, cwd: 'bower_components/bootstrap/fonts/'},
          {dest:'<%= distdir %>/fonts/',  src: '*.{ttf,woff,woff2,eof,svg}', expand: true, cwd: 'bower_components/font-awesome/fonts/'},
          {dest:'<%= distdir %>/fonts/',  src: '*.{ttf,woff,woff2,eof,svg}', expand: true, cwd: 'bower_components/rdash-ui/dist/fonts/'},
          {dest:'<%= distdir %>/images/', src: '**',                         expand: true, cwd: 'assets/images/'},
          {dest:'<%= distdir %>/ico',     src: '**',                         expand: true, cwd: 'assets/ico'}
        ]
      }
    },
    eslint: {
      src: ['gruntfile.js', '<%= src.js %>'],
      options: { configFile: '.eslintrc.yml' }
    },
    html2js: {
      app: {
        options: { base: '.' },
        src: ['<%= src.tpl %>'],
        dest: '<%= distdir %>/templates/app.js',
        module: '<%= pkg.name %>.templates'
      }
    },
    concat: {
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
    },
    uglify: {
      dist: {
        files: { '<%= distdir %>/js/<%= pkg.name %>.js': ['<%= src.js %>', '<%= src.jsTpl %>'] }
      },
      vendor: {
        options: { preserveComments: 'some' }, // Preserve license comments
        files: { '<%= distdir %>/js/vendor.js': ['<%= src.jsVendor %>'] ,
                 '<%= distdir %>/js/angular.js': ['<%= src.angularVendor %>']
        }
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
      build: {
        files: ['<%= src.js %>', '<%= src.css %>', '<%= src.tpl %>', '<%= src.html %>'],
        tasks: ['build']
      }
    },
    shell: {
      buildBinary: {
        command: function (p, a) {
                   var binfile = 'dist/portainer-'+p+'-'+a;
                   if (grunt.file.isFile( ( p === 'windows' ) ? binfile+'.exe' : binfile )) {
                     return 'echo \'BinaryExists\'';
                   } else {
                     return 'build/build_in_container.sh ' + p + ' ' + a;
                   }
                 }
      },
      run: {
        command: [
          'docker rm -f portainer',
          'docker run -d -p 9000:9000 -v $(pwd)/dist:/app -v /tmp/portainer:/data -v /var/run/docker.sock:/var/run/docker.sock:z --name portainer centurylink/ca-certs /app/portainer-linux-amd64 --no-analytics -a /app'
        ].join(';')
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

  grunt.registerTask('vendor', 'vendor:<.min>', function(min) {

    function pre( v, type, obj ) { 
      if (type === 'both') {
        v.js.push(obj);
        v.css.push(obj);
        return v;
      }
      v[type].push(obj);
      return v;
    }

    function rec( v, type, prefix, obj ) {
      if ( 'object' === typeof obj ) {
        for (var x in obj) { if (obj.hasOwnProperty(x)) {
          v = rec( v, type, ((Array.isArray(obj)) ? prefix : prefix+x) , obj[x] );
        }}
        return v;
      }
      return pre( v, type, prefix+obj );
    }
    
    //Recursively process yml file
    var vendor = {};
    var v = grunt.file.readYAML('vendor.yml');
    for (var type in v) { if (v.hasOwnProperty(type)) {
      if ( type !== 'both' ) { vendor[type]=[]; }
      vendor = rec( vendor, type, '', v[type] );
    }}

    function addext( v, m, e ) {
      if (grunt.file.isFile(v + m + e)) { v += m + e; return v; }
      if (grunt.file.isFile(v + e)) { v += e; return v; }
      grunt.fail.warn(v+'[.min]'+e+' not found!');
      return v;
    }
    
    function ext( v, e ) {
      for(var x in v) { if (v.hasOwnProperty(x)) {
        v[x] = addext( v[x], m, e);
      }}
      grunt.config('src.'+type+'Vendor',vendor[type]);
      return v;
    }
    
    //Check if files exists, add extensions, and add to config
    var m = min;
    for (type in vendor) { if (vendor.hasOwnProperty(type)) {
      var e = '.'+((type === 'angular') ? 'js' : type);
      vendor[type] = ext( vendor[type], e );
    }}
  });
};
