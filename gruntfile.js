module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        exec: {
            esbuild: {
                command: 'node esbuild',
            }
        },
        esbuild: {
            options: {
                buildFunction: require('esbuild').build
            },
            dist: {
                entryPoints: ['main.js'],
                outfile: 'client.min.js',
                bundle: true,
                minify: true
            }
        },
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
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-esbuild');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    // Default task(s).
    grunt.registerTask('watch', ['exec:esbuild']);
    grunt.registerTask('dist', ['esbuild', 'concat']);
};
