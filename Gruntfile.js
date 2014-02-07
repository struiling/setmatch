module.exports = function(grunt) {

    var docroot = 'parse/public';
    // 1. All configuration goes here 
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {   
            options: {
              separator: ';',
            },
            dist: {
                src: [
                    'js/lib/!(jquery.min.js)*.js' // All JS in the lib folder
                    //'js/global.js'  // This specific file
                ],
                dest: 'js/build/source.js',
            }
        },
        uglify: {
            build: {
                src: 'js/build/source.js',
                dest: 'js/build/source.min.js'
            }
        }

    });

    // 3. Where we tell Grunt we plan to use this plug-in.
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
    grunt.registerTask('default', ['concat', 'uglify']);

};