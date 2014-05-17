/*jslint node:true */
/*globals module:false */

"use strict";

module.exports = function (grunt) {

    var files = {
        allSource: ['Gruntfile.js', 'package.json', 'lib/**/*.js', 'test/**/*.js'],
        tests: ['test/**/*.js']
    };

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jslint: {
            allSource: {
                src: files.allSource,
                directives: {
                    todo: true
                },
                options: {
                    errorsOnly: true
                }
            }
        },
        simplemocha: {
            options: {
                reporter: 'tap'
            },
            all: {
                src: files.tests
            }
        },
        watch: {
            files: files.allSource,
            tasks: ['jslint', 'simplemocha']
        }
    });

    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-simple-mocha');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('test', ['jslint', 'simplemocha']);

    grunt.registerTask('default', ['jslint', 'simplemocha', 'watch']);

};
