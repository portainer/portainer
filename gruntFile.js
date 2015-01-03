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

    // Default task.
    grunt.registerTask('default', ['jshint','build','karma:unit']);
    grunt.registerTask('build', ['clean','html2js','concat','recess:build', 'copy']);
    grunt.registerTask('release', ['clean','html2js','uglify','jshint','karma:unit','concat:index', 'recess:min', 'copy']);
    grunt.registerTask('test-watch', ['karma:watch']);

    // Print a timestamp (useful for when watching)
    grunt.registerTask('timestamp', function() {
        grunt.log.subhead(Date());
    });

    var karmaConfig = function(configFile, customOptions) {
        var options = { configFile: configFile, keepalive: true };
        var travisOptions = process.env.TRAVIS && { browsers: ['Firefox'], reporters: 'dots' };
        return grunt.util._.extend(options, customOptions, travisOptions);
    };

    // Project configuration.
    grunt.initConfig({
        distdir: 'dist',
        pkg: grunt.file.readJSON('package.json'),
        banner:
        '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? " * " + pkg.homepage + "\\n" : "" %>' +
        ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;\n' +
        ' * Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>\n */\n',
        src: {
            js: ['app/**/*.js'],
            jsTpl: ['<%= distdir %>/templates/**/*.js'],
            specs: ['test/**/*.spec.js'],
            scenarios: ['test/**/*.scenario.js'],
            html: ['index.html'],
            tpl: {
                app: ['app/components/**/*.html']
            },
            css: ['assets/css/app.css']
        },
        clean: ['<%= distdir %>/*'],
        copy: {
            assets: {
                files: [{ dest: '<%= distdir %>/assets', src : '**', expand: true, cwd: 'assets/' }]
            }
        },
        karma: {
            unit: { options: karmaConfig('test/config/unit.js') },
            watch: { options: karmaConfig('test/config/unit.js', { singleRun:false, autoWatch: true}) }
        },
        html2js: {
            app: {
                options: {
                    base: '.'
                },
                src: ['<%= src.tpl.app %>'],
                dest: '<%= distdir %>/templates/app.js',
                module: '<%= pkg.name %>.templates'
            }
        },
        concat:{
            dist:{
                options: {
                    banner: "<%= banner %>",
                    process: true
                },
                src:['<%= src.js %>', '<%= src.jsTpl %>'],
                dest:'<%= distdir %>/<%= pkg.name %>.js'
            },
            index: {
                src: ['index.html'],
                dest: '<%= distdir %>/index.html',
                options: {
                    process: true
                }
            },
            angular: {
                src:['assets/js/angularjs/1.2.6/angular.min.js',
                     'assets/js/angularjs/1.2.6/angular-route.min.js',
                     'assets/js/angularjs/1.2.6/angular-resource.min.js'],
                dest: '<%= distdir %>/angular.js'
            }
        },
        uglify: {
            dist:{
                options: {
                    banner: "<%= banner %>"
                },
                src:['<%= src.js %>' ,'<%= src.jsTpl %>'],
                dest:'<%= distdir %>/<%= pkg.name %>.js'
            },
            angular: {
                src:['<%= concat.angular.src %>'],
                dest: '<%= distdir %>/angular.js'
            }
        },
        recess: {
            build: {
                files: {
                    '<%= distdir %>/<%= pkg.name %>.css':
                    ['<%= src.css %>'] },
                options: {
                    compile: true,
                    noOverqualifying: false // TODO: Added because of .nav class, rename
                }
            },
            min: {
                files: {
                    '<%= distdir %>/<%= pkg.name %>.css': ['<%= src.css %>']
                },
                options: {
                    compress: true
                }
            }
        },
        watch:{
            all: {
                files:['<%= src.js %>', '<%= src.specs %>', '<%= src.css %>', '<%= src.tpl.app %>', '<%= src.tpl.common %>', '<%= src.html %>'],
                tasks:['default','timestamp']
            },
            build: {
                files:['<%= src.js %>', '<%= src.specs %>', '<%= src.css %>', '<%= src.tpl.app %>', '<%= src.tpl.common %>', '<%= src.html %>'],
                tasks:['build','timestamp']
            }
        },
        jshint:{
            files:['gruntFile.js', '<%= src.js %>', '<%= src.jsTpl %>', '<%= src.specs %>', '<%= src.scenarios %>'],
            options:{
                curly:true,
                eqeqeq:true,
                immed:true,
                latedef:true,
                newcap:true,
                noarg:true,
                sub:true,
                boss:true,
                eqnull:true,
                globals:{}
            }
        }
    });
};
