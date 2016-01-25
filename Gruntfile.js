module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        "cssmin": {
            "target": {
                "files": [{
                    "expand": true,
                    "cwd": 'src/',
                    "src": ['css/*.css'],
                    "dest": 'dist/',
                    "ext": '.min.css'
                }]
            }
        },
        "htmlmin": {
            "dist": {
                "options": {
                    "removeComments": true,
                    "collapseWhitespace": true
                },
                "files": {
                    "dist/index.html": "src/index.html"
                }
            }
        },
        "uglify": {
            "all": {
                "files": [{
                    "expand": true,
                    "cwd": 'src/',
                    "src": ['js/*.js'],
                    "dest": 'dist/',
                    "ext": '.min.js'
                }]
            }
        },
        "imagemin": {
            "dynamic": {
                "files": [{
                    "expand": true,
                    "cwd": "src/img/background",
                    "src": ["*.jpg"],
                    "dest": "dist/img/background"
                }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-usemin');

    grunt.registerTask('default', ['cssmin', 'htmlmin', 'uglify']);
    grunt.registerTask('img', ['imagemin']);

};