/*jslint node:true */
/*globals module:false */

"use strict";

module.exports = function (grunt) {

    var files = {
        allSource: ["Gruntfile.js", "package.json", "lib/**/*.js", "test/**/*.js"],
        tests: ["test/**/*.js"]
    };

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        jshint: {
            options: {
                jshintrc: true
            },
            all: ["Gruntfile.js", "lib/**/*.js", "test/**/*.js"]
        },
        simplemocha: {
            options: {
                reporter: "tap"
            },
            all: {
                src: files.tests
            }
        },
        watch: {
            files: files.allSource,
            tasks: ["jshint", "simplemocha"]
        }
    });

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-simple-mocha");
    grunt.loadNpmTasks("grunt-contrib-watch");

    grunt.registerTask("test", ["jshint", "simplemocha"]);

    grunt.registerTask("default", ["jshint", "simplemocha", "watch"]);

};
