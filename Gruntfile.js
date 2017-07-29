module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        "cssmin": {
            "target": {
                "files": [{
                    "src": ['src/css/*.css'],
                    "dest": 'dist/css/main.min.css',
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
            "min": {
                "files": [{
                    "src": ['src/js/*.js'],
                    "dest": 'dist/js/app.min.js',
                }]
            }
        },
        "imagemin": {
            "dynamic": {
                "files": [{
                    "expand": true,
                    "cwd": "src/img/background",
                    "src": ["*.jpg", "*.svg"],
                    "dest": "dist/img/background"
                }]
            }
        },
        "processhtml": {
            "dist": {
                "files": {
                    'dist/index.html': ['src/index.html']
                }
            }
        }
    });

    grunt.registerTask('default', ['cssmin', 'htmlmin', 'uglify', 'processhtml']);
    grunt.registerTask('img', ['imagemin']);

};