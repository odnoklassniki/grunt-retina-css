module.exports = function (grunt) {
    'use strict';

    var postcss = require('postcss');
    var fs = require('fs');

    grunt.file.defaultEncoding = 'utf8';

    grunt.registerMultiTask('retinify', 'Grunt task for generating CSS with 2x background-images', function () {
        var options = this.options({
            "retinaPrefix": '-x2',
            "resultsCSSFileName": undefined,
            "atRuleProperties": {
                "name": "media",
                "params": "(x2)"
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
                }
            }
        });

        var retinified = (function() {
            var Storage = function() {
                this.flush();
            };

            var _blocks = {};

            Storage.prototype = {
                "add": function(file, block) {
                    var tmp = _blocks[file] ? _blocks[file] : [];
                    tmp.push(block);
                    _blocks[file] = tmp;
                },

                "get": function(keys) {
                    if (keys instanceof Array) {
                        return keys.reduce(function(prev, curr) {
                            return _blocks[prev].concat(_blocks[curr] ? _blocks[curr] : []);
                        });
                    } else {
                        return _blocks[keys] ? _blocks[keys] : [];
                    }
                },

                "flush": function(file) {
                    if (file) {
                        _blocks[file] = [];
                    } else {
                        _blocks = {};
                    }
                }
            };

            return new Storage();
        })();

        var done = this.async();

        var getImageNameFromCssValue = function(cssValue, withPrefix) {
            var urlRegExResult = /[?]*url\([\s\"\']*([\w\-_\/\.]+)[\"\'\s]*\)/.exec(cssValue);
            var imageName = urlRegExResult && urlRegExResult[1] ? urlRegExResult[1] : undefined;

            if (imageName && withPrefix) {
                var nameParts = imageName.split('.');
                nameParts[0] += options.retinaPrefix;
                imageName = nameParts.join('.').slice(1);
            }
            return imageName;
        };

        var getRetinifiedCssValue = function(cssValue) {
            return cssValue.replace(
                getImageNameFromCssValue(cssValue, false),
                getImageNameFromCssValue(cssValue, true)
            );
        };

        var processRule = function(filePath, block) {

            var isRetinaImageExists = function(decl) {
                var imageName = getImageNameFromCssValue(decl.value, true);
                return imageName && fs.existsSync(imageName);
            };

            block.decls.forEach(function(decl) {
                var isBackgroundDecl = !!decl && !!decl.prop && !!decl.value
                    && !!~decl.prop.indexOf('background')
                    && !!~decl.value.indexOf('url');

                if (isBackgroundDecl && isRetinaImageExists(decl)) {
                    retinified.add(filePath, {"selector": decl.parent.selector, "prop": decl.prop, "value": decl.value});
                }
            });
        };

        var processCssFile = function(filePath, fileData) {
            var retinificator = postcss(function (css) {
                css.eachRule(function (rule) {
                    processRule(filePath, rule);
                });
            });
            retinificator.process(fileData).css;
        };

        var createDeclaration = function(property, value) {
            var spaces = options.whitespacing.declaration;
            return {
                "prop": property,
                "value": value,
                "before": spaces.before,
                "after": spaces.after,
                "between": spaces.between
            };
        };

        var createRule = function(selector) {
            var spaces = options.whitespacing.rule;
            return postcss.rule({
                "selector": selector,
                "before": spaces.before,
                "after": spaces.after,
                "between": spaces.between
            });
        };

        var createMedia = function(rules) {
            var spaces = options.whitespacing.atRule;
            var atRuleProps = options.atRuleProperties;
            var media = postcss.atRule({
                "name": atRuleProps.name,
                "params": atRuleProps.params,
                "rules": [],
                "before": spaces.before,
                "after": spaces.after,
                "between": spaces.between
            });
            Object.keys(rules).forEach(function(key) {
                media.rules.push(rules[key]);
            });
            return media && media.rules && media.rules.length ? media : undefined;
        };

        var createMediaBlock = function(fileKey) {
            var decls = retinified.get(fileKey);
            if (!decls) return;
            var rules = {};
            decls.forEach(function(item) {
                var rule = rules[item.selector] || createRule(item.selector);
                rule.append(createDeclaration(item.prop, getRetinifiedCssValue(item.value)));
                rules[item.selector] = rule;
            });
            var media = createMedia(rules);
            return media ? media.toString() : undefined;
        };

        var writeRetinifiedStyles = function(path, styles) {
            grunt.file.write(path, styles, {"encoding": "utf8"});
        };

        var cwd = this.data.cwd + (this.data.cwd.slice(-1) !== "/" ? "/" : "");
        var dest = this.data.dest + (this.data.cwd.slice(-1) !== "/" ? "/" : "");

        var filesCount = 0;

        this.files.forEach(function(file) {
            var filesList = file.src.filter(function(filepath) {
                if (!grunt.file.exists(cwd + filepath)) {
                    grunt.log.warn('Source file "' + filepath + '" not found.');
                    return false;
                } else {
                    return true;
                }
            });
            if (options.resultsCSSFileName) {
                var processedFileNames = filesList.map(function(filepath) {
                    var fullFilePath = cwd + filepath;
                    processCssFile(fullFilePath, grunt.file.read(fullFilePath));
                    return fullFilePath;
                });
                var media = createMediaBlock(processedFileNames);
                media && writeRetinifiedStyles(dest + options.resultsCSSFileName, media.toString());
                done();
            } else {
                filesList.map(function(filepath) {
                    var fullFilePath = cwd + filepath;
                    var fileData = grunt.file.read(fullFilePath);
                    processCssFile(fullFilePath, fileData);
                    var media = createMediaBlock(fullFilePath);
                    media && writeRetinifiedStyles(dest + filepath, [fileData, media.toString()].join("\n"));
                    if(filesCount >= filesList.length)  {
                        done();
                    }
                });
            }
        });
    });
};
