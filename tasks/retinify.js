module.exports = function (grunt) {
    'use strict';

    var postcss = require('postcss');

    grunt.file.defaultEncoding = 'utf8';

    grunt.registerMultiTask('retinaCSS', 'Grunt task for generating CSS with 2x background-images', function () {
        var options = this.options({
            "retinaPrefix": '-x2',
            "resultsCSSFileName": undefined,
            "atRuleProperties": {
                "name": "media",
                "params": "(x2)"
            },
            "processComments": function(commentText) {
                return commentText;
            },
            "whitespacing": {
                "declaration": {
                    "before": "\n    ",
                    "after": "",
                    "between": ": "
                },
                "rule": {
                    "before": "\n  ",
                    "after": ";\n  ",
                    "between": " "
                },
                "atRule": {
                    "before": "\n",
                    "after": "\n",
                    "between": " "
                },
                "comment": {
                    'left': "",
                    'right': "",
                    "between": "",
                    "before": " "
                }
            }
        });

        var done = this.async();

        var DS = require('./lib/storage'); // temporal storage with a specific items (comments and css blocks).
        var Utils = require('./lib/utils')(grunt); // small task helpers set
        var CSS = require('./lib/css-wrapper')(options, postcss); // wrapper, which uses postcss to create rules, blocks, etc.

        var processRule = function(filePath, block) {
            block.decls.forEach(function(decl) {
                var imageName = Utils.getImageName(decl.value, options.retinaPrefix);
                var isValidBackgroundBlock = Utils.isBackground(decl) && Utils.imageExists(imageName);

                if (isValidBackgroundBlock) {
                    DS.storeDeclaration(filePath, decl);
                    if (decl.hasOwnProperty('_value')) {
                        var comment = processIncorrectInlineComment(decl);
                        DS.storeComment(filePath, comment);
                    }
                } else if (decl.type === 'comment') {
                    decl.text = Utils.trim(decl.text);
                    decl.before = options.whitespacing.comment.before;
                    DS.storeComment(filePath, decl);
                }

            });
        };

        var processIncorrectInlineComment = function(decl) {
            var spaces = options.whitespacing.comment;
            var text = decl._value.raw
                .replace(decl._value.value, "")
                .replace("/*", "")
                .replace("*/", "");
            text = Utils.trim(text);
            return {
                "type": "comment",
                "source": decl.source,
                "text": text,
                "before": spaces.before,
                "left": spaces.left,
                "right": spaces.right
            };
        };

        var processCssFile = function(filePath, fileData) {
            postcss(function (css) {
                css.eachRule(function (rule) {
                    processRule(filePath, rule);
                });
            }).process(fileData).css;
        };

        var fillRules = function(rules, decls, fileName) {
            decls.forEach(function(item) {
                // we should add declaration into new rule or into existed.
                var rule = rules[item.selector] || CSS.Rule(item.selector);
                var commentData = DS.getCommentByLine(fileName, item.line);

                rule.append(CSS.Declaration(item.prop, Utils.withPrefix(item.value, options.retinaPrefix)));
                if (commentData) {
                    rule.append(CSS.Comment(commentData, rule));
                }
                rules[item.selector] = rule;
            });
            return rules;
        };

        var createMediaBlock = function(fileNames) {
            fileNames = fileNames instanceof Array ? fileNames : [fileNames];
            var rules = {};
            fileNames.forEach(function(fileName) {
                var decls = DS.getDeclarations(fileName);
                if (decls) {
                    rules = fillRules(rules, decls, fileName);
                }
            });
            var media = CSS.Media(rules);
            return media ? media.toString() : undefined;
        };

        var cwd = this.data.cwd
            ? this.data.cwd + (this.data.cwd.slice(-1) !== "/" ? "/" : "")
            : "";
        var dest = this.data.dest
            ? this.data.dest + (this.data.cwd.slice(-1) !== "/" && this.data.dest.length ? "/" : "")
            : "";
        var filesCount = 0;

        this.files.forEach(function(file) {
            var filesList = Utils.applyFileFilter(file, cwd);
            if(!filesList.length)  {
                grunt.log.errorlns("Nothing to process!");
                done();
            }
            if (options.resultsCSSFileName) {
                // processing css files to get styles for modification
                var processedFileNames = filesList.map(function(filepath) {
                    var fullFilePath = cwd + filepath;
                    processCssFile(fullFilePath, grunt.file.read(fullFilePath));
                    return fullFilePath;
                });
                // generating of media block according to target options
                var media = createMediaBlock(processedFileNames);
                // writing generated result into single file
                media && Utils.writeCSSFile(dest + options.resultsCSSFileName, media.toString());
                done();
            } else {
                filesList.map(function(filepath) {
                    var fullFilePath = cwd + filepath;
                    var fileData = grunt.file.read(fullFilePath);
                    processCssFile(fullFilePath, fileData);
                    var media = createMediaBlock(fullFilePath);
                    media && Utils.writeCSSFile(dest + filepath, [fileData, media.toString()].join("\n"));
                    filesCount++;
                    if(filesCount >= filesList.length)  {
                        done();
                    }
                });
            }
        });
    });
};
