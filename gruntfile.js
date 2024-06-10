module.exports = function(grunt) {
    //var browserify = require('browserify');
    //var nanohtml = require('nanohtml');
    //var path = require('path');
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            js: {
                options: {
                    separator: ';\r\n',
                },
                src: [
                    'prism.js',
                    'prism-damon.js',
                    'client.min.js',
                ],
                dest: 'dist/space.min.js'
            }
        },
    });

    // Load the plugin that provides the tasks.
    grunt.loadNpmTasks('grunt-contrib-concat');

    // Default task(s).
    grunt.registerTask('default', ['concat']);
};
