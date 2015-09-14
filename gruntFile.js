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
    grunt.registerTask('build', ['clean:app', 'if:binaryNotExist', 'html2js', 'concat', 'clean:tmpl', 'recess:build', 'copy']);
    grunt.registerTask('release', ['clean:all', 'if:binaryNotExist', 'html2js', 'uglify', 'clean:tmpl', 'jshint', 'karma:unit', 'concat:index', 'recess:min', 'copy']);
    grunt.registerTask('test-watch', ['karma:watch']);
    grunt.registerTask('run', ['if:binaryNotExist', 'build', 'shell:buildImage', 'shell:run']);
    grunt.registerTask('run-dev', ['if:binaryNotExist', 'shell:buildImage', 'shell:run', 'watch:build']);

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
                'bower_components/jquery/dist/jquery.js',
                'bower_components/jquery.gritter/js/jquery.gritter.js',
                'bower_components/bootstrap/dist/js/bootstrap.js',
                'bower_components/spin.js/spin.js',
                'bower_components/vis/dist/vis.js',
                'bower_components/Chart.js/Chart.js',
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
                'bower_components/vis/dist/vis.css'
            ]
        },
        clean: {
            all: ['<%= distdir %>/*'],
            app: ['<%= distdir %>/*', '!<%= distdir %>/dockerui'],
            tmpl: ['<%= distdir %>/templates']
        },
        copy: {
            assets: {
                files: [
                    {dest: '<%= distdir %>/fonts/', src: '**', expand: true, cwd: 'bower_components/bootstrap/fonts/'},
                    {
                        dest: '<%= distdir %>/images/',
                        src: ['**', '!trees.jpg'],
                        expand: true,
                        cwd: 'bower_components/jquery.gritter/images/'
                    },
                    {
                        dest: '<%= distdir %>/img',
                        src: [
                            'network/downArrow.png',
                            'network/leftArrow.png',
                            'network/upArrow.png',
                            'network/rightArrow.png',
                            'network/minus.png',
                            'network/plus.png',
                            'network/zoomExtends.png'
                        ],
                        expand: true,
                        cwd: 'bower_components/vis/dist/img'
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
                dest: '<%= distdir %>/<%= pkg.name %>.js'
            },
            vendor: {
                src: ['<%= src.jsVendor %>'],
                dest: '<%= distdir %>/vendor.js'
            },
            index: {
                src: ['index.html'],
                dest: '<%= distdir %>/index.html',
                options: {
                    process: true
                }
            },
            angular: {
                src: ['bower_components/angular/angular.js',
                    'bower_components/angular-route/angular-route.js',
                    'bower_components/angular-resource/angular-resource.js',
                    'bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
                    'bower_components/angular-oboe/dist/angular-oboe.js',
                    'bower_components/angular-visjs/angular-vis.js'],
                dest: '<%= distdir %>/angular.js'
            }
        },
        uglify: {
            dist: {
                options: {
                    banner: "<%= banner %>"
                },
                src: ['<%= src.js %>', '<%= src.jsTpl %>'],
                dest: '<%= distdir %>/<%= pkg.name %>.js'
            },
            vendor: {
                options: {
                    preserveComments: 'some' // Preserve license comments
                },
                src: ['<%= src.jsVendor %>'],
                dest: '<%= distdir %>/vendor.js'
            },
            angular: {
                options: {
                    preserveComments: 'some' // Preserve license comments
                },
                src: ['<%= concat.angular.src %>'],
                dest: '<%= distdir %>/angular.js'
            }
        },
        recess: { // TODO: not maintained, unable to preserve license comments, switch out for something better.
            build: {
                files: {
                    '<%= distdir %>/<%= pkg.name %>.css': ['<%= src.css %>'],
                    '<%= distdir %>/vendor.css': ['<%= src.cssVendor %>']
                },
                options: {
                    compile: true,
                    noOverqualifying: false // TODO: Added because of .nav class, rename
                }
            },
            min: {
                files: {
                    '<%= distdir %>/<%= pkg.name %>.css': ['<%= src.css %>'],
                    '<%= distdir %>/vendor.css': ['<%= src.cssVendor %>']
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
                command: 'docker build --rm -t dockerui .'
            },
            buildBinary: {
                command: [
                    'docker run --rm -v $(pwd):/src centurylink/golang-builder',
                    'shasum dockerui > dockerui-checksum.txt',
                    'mkdir -p dist',
                    'mv dockerui dist/'
                ].join('&&')
            },
            run: {
                command: [
                    'docker stop dockerui',
                    'docker rm dockerui',
                    'docker run --privileged -d -p 9000:9000 -v /var/run/docker.sock:/var/run/docker.sock --name dockerui dockerui'
                ].join(';')
            },
            cleanImages: {
                command: 'docker rmi $(docker images -q -f dangling=true)'
            }
        },
        'if': {
            binaryNotExist: {
                options: {
                    executable: 'dist/dockerui'
                },
                ifFalse: ['shell:buildBinary']
            }
        }
    });
};
