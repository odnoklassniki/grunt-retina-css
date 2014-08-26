module.exports = function (grunt) {
    "use strict";

    grunt.loadTasks('tasks');
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-clean");

    var config = {
        "clean": {
            "src": ["demo/single-out/*.css", "demo/saved-out/*.css"]
        },
        "jshint": {
            "options": {
                "jshintrc": ".jshintrc"
            },
            "gruntfile": ["Gruntfile.js"],
            "gruntTasks": ["tasks/**/*.js"]
        },
        "retinify": {
            "single": {
                "options": {
                    "retinaPrefix": '-x2',
                    "resultsCSSFileName": 'x2.css'
                },
                "cwd": 'demo/src/single',
                "dest": 'demo/single-out',
                "src": ['first.css', 'second.css']
            },
            "saved": {
                "options": {
                    "retinaPrefix": '-retina'
                },
                "cwd": 'demo/src/saved',
                "dest": 'demo/saved-out',
                "src": ['third.css']
            }
        }
    };

    grunt.initConfig(config);

    grunt.registerTask('demo', ["clean", "retinify"]);
    grunt.registerTask("default", ["jshint", "demo"]);
};
