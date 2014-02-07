module.exports = function(grunt) {

    //var docroot = 'parse/public';
    // 1. All configuration goes here 
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        autoprefixer: {
            dist: {
                options: {
                // Target-specific options go here.
                },
                src: 'src/css/index.css',
                dest: 'build/css/index.css'
            }
        },
        clean: {
            clean: ['build/*']
        },
        concat: {   
            options: {
              separator: ';',
            },
            dist: {
                src: [
                    'src/js/lib/!(jquery.min.js)*.js' // All JS in the lib folder
                    //'src/js/foundation/*.js'  // Uncomment if paring down the Foundation JS and remove foundation.min.js in lib
                ],
                dest: 'src/js/source.js',
            }
        },
        copy: {
            target: {
                files: [{
                        dest: 'build/js/index.js',
                        src: 'src/js/index.js'},
                    {
                        dest: 'parse/public/js/index.js',
                        src: 'build/js/index.js'},
                    {
                        dest: 'parse/public/js/source.min.js',
                        src: 'build/js/source.min.js'},
                    {
                        dest: 'parse/public/css/index.css',
                        src: 'build/css/index.css'
                    }
                ]
            }
        },
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                unused: true,
                boss: true,
                eqnull: true,
                browser: true,
                globals: {
                    jQuery: false,
                    bQuery: false,
                    _gaq: false,
                    google: false,
                    console: false,
                    FB: false,
                    $: false,
                    _: false
                }
            },
            src: ['src/js/index.js']
        },
        sass: {
            dist: {
                files: {
                    'src/css/index.css': 'src/scss/styles.scss'
                }
            }
        },
        watch: {
            scripts: {
                files: ['js/*.js'],
                tasks: ['newer:concat', 'newer:uglify'],
                options: {
                    spawn: false,
                },
            },
            sass: {
                files: ['src/scss/*.scss'],
                tasks: ['sass']
            },
            styles: {
                files: ['src/css/index.css'],
                tasks: ['autoprefixer']
            }
        },
        uglify: {
            build: {
                src: 'src/js/source.js',
                dest: 'build/js/source.min.js'
            }
        }

    });

    // 3. Where we tell Grunt we plan to use this plug-in.
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-newer');
    grunt.loadNpmTasks('grunt-sass');

    // 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
    grunt.registerTask('default', ['common', 'watch']);

    grunt.registerTask('common', [/*'clean', *//*'jshint',*/ 'sass', 'newer:concat', 'newer:uglify']);

    grunt.registerTask('deploy', ['common', 'autoprefixer', 'newer:copy']);

};