module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-recess');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-html2js');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-if');

    // Default task.
    grunt.registerTask('default', ['jshint', 'build', 'karma:unit']);
    grunt.registerTask('build', [
        'clean:app',
        'if:binaryNotExist',
        'html2js',
        'concat',
        'clean:tmpl',
        'recess:build',
        'copy'
    ]);
    grunt.registerTask('release', [
        'clean:all',
        'if:binaryNotExist',
        'html2js',
        'uglify',
        'clean:tmpl',
        'jshint',
        //'karma:unit',
        'concat:index',
        'recess:min',
        'copy'
    ]);
    grunt.registerTask('lint', ['jshint']);
    grunt.registerTask('test-watch', ['karma:watch']);
    grunt.registerTask('run', ['if:binaryNotExist', 'build', 'shell:buildImage', 'shell:run']);
    grunt.registerTask('run-swarm', ['if:binaryNotExist', 'build', 'shell:buildImage', 'shell:runSwarm', 'watch:buildSwarm']);
    grunt.registerTask('run-dev', ['if:binaryNotExist', 'shell:buildImage', 'shell:run', 'watch:build']);
    grunt.registerTask('clear', ['clean:app']);

    // Print a timestamp (useful for when watching)
    grunt.registerTask('timestamp', function () {
        grunt.log.subhead(Date());
    });

    var karmaConfig = function (configFile, customOptions) {
        var options = {configFile: configFile, keepalive: true};
        var travisOptions = process.env.TRAVIS && {browsers: ['Firefox'], reporters: 'dots'};
        return grunt.util._.extend(options, customOptions, travisOptions);
    };

    // Project configuration.
    grunt.initConfig({
        distdir: 'dist',
        pkg: grunt.file.readJSON('package.json'),
        remoteApiVersion: 'v1.20',
        banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? " * " + pkg.homepage + "\\n" : "" %>' +
        ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;\n' +
        ' * Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>\n */\n',
        src: {
            js: ['app/**/*.js', '!app/**/*.spec.js'],
            jsTpl: ['<%= distdir %>/templates/**/*.js'],
            jsVendor: [
                'bower_components/jquery/dist/jquery.min.js',
                'assets/js/jquery.gritter.js', // Using custom version to fix error in minified build due to "use strict"
                'bower_components/bootstrap/dist/js/bootstrap.min.js',
                'bower_components/Chart.js/Chart.min.js',
                'bower_components/lodash/dist/lodash.min.js',
                'bower_components/oboe/dist/oboe-browser.js',
                'assets/js/legend.js' // Not a bower package
            ],
            specs: ['test/**/*.spec.js'],
            scenarios: ['test/**/*.scenario.js'],
            html: ['index.html'],
            tpl: ['app/components/**/*.html'],
            css: ['assets/css/app.css'],
            cssVendor: [
                'bower_components/bootstrap/dist/css/bootstrap.css',
                'bower_components/jquery.gritter/css/jquery.gritter.css',
                'bower_components/font-awesome/css/font-awesome.min.css',
                'bower_components/rdash-ui/dist/css/rdash.min.css',
                'bower_components/angular-ui-select/dist/select.min.css'
            ]
        },
        clean: {
            all: ['<%= distdir %>/*'],
            app: ['<%= distdir %>/*', '!<%= distdir %>/ui-for-docker'],
            tmpl: ['<%= distdir %>/templates']
        },
        copy: {
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
        karma: {
            unit: {options: karmaConfig('test/unit/karma.conf.js')},
            watch: {options: karmaConfig('test/unit/karma.conf.js', {singleRun: false, autoWatch: true})}
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
                    banner: "<%= banner %>",
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
                    'bower_components/angular-ui-router/release/angular-ui-router.min.js',
                    'bower_components/angular-resource/angular-resource.min.js',
                    'bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
                    'bower_components/angular-oboe/dist/angular-oboe.min.js',
                    'bower_components/angular-ui-select/dist/select.min.js'],
                dest: '<%= distdir %>/js/angular.js'
            }
        },
        uglify: {
            dist: {
                options: {
                    banner: "<%= banner %>"
                },
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
                files: ['<%= src.js %>', '<%= src.specs %>', '<%= src.css %>', '<%= src.tpl %>', '<%= src.html %>'],
                tasks: ['default', 'timestamp']
            },
            build: {
                files: ['<%= src.js %>', '<%= src.specs %>', '<%= src.css %>', '<%= src.tpl %>', '<%= src.html %>'],
                tasks: ['build', 'shell:buildImage', 'shell:run', 'shell:cleanImages']
                /*
                 * Why don't we just use a host volume
                 * http.FileServer uses sendFile which virtualbox hates
                 * Tried using a host volume with -v, copying files with `docker cp`, restating container, none worked
                 * Rebuilding image on each change was only method that worked, takes ~4s per change to update
                 */
            },
            buildSwarm: {
                files: ['<%= src.js %>', '<%= src.specs %>', '<%= src.css %>', '<%= src.tpl %>', '<%= src.html %>'],
                tasks: ['build', 'shell:buildImage', 'shell:runSwarm', 'shell:cleanImages']
            }
        },
        jshint: {
            files: ['gruntFile.js', '<%= src.js %>', '<%= src.specs %>', '<%= src.scenarios %>'],
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
                command: 'docker build --rm -t ui-for-docker .'
            },
            buildBinary: {
                command: [
                    'docker run --rm -v $(pwd):/src centurylink/golang-builder',
                    'shasum ui-for-docker > ui-for-docker-checksum.txt',
                    'mkdir -p dist',
                    'mv ui-for-docker dist/'
                ].join(' && ')
            },
            run: {
                command: [
                    'docker stop ui-for-docker',
                    'docker rm ui-for-docker',
                    'docker run --privileged -d -p 9000:9000 -v /tmp/docker-ui:/data -v /var/run/docker.sock:/var/run/docker.sock --name ui-for-docker ui-for-docker -d /data'
                ].join(';')
            },
            runSwarm: {
                command: [
                    'docker stop ui-for-docker',
                    'docker rm ui-for-docker',
                    'docker run --privileged -d -p 9000:9000 -v /tmp/docker-ui:/data --name ui-for-docker ui-for-docker -e http://10.0.7.10:4000 --swarm -d /data'
                ].join(';')
            },
            cleanImages: {
                command: 'docker rmi $(docker images -q -f dangling=true)'
            }
        },
        'if': {
            binaryNotExist: {
                options: {
                    executable: 'dist/ui-for-docker'
                },
                ifFalse: ['shell:buildBinary']
            }
        }
    });
};
