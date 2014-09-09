module.exports = function(grunt) {

'use strict';

var fs = require('fs');


return {
	"getImageName": function(cssValue, prefix) {
	    var urlRegExResult = /[?]*url\([\s\"\']*([\w\-_\/\.]+)[\"\'\s]*\)/.exec(cssValue);
	    var imageName = urlRegExResult && urlRegExResult[1] ? urlRegExResult[1] : undefined;

	    if (imageName && prefix) {
	        var nameParts = imageName.split('.');
	        nameParts[0] += prefix;
	        imageName = nameParts.join('.').slice(1);
	    }
	    return imageName;
	},

	"writeCSSFile": function(path, styles) {
	    grunt.file.write(path, styles, {"encoding": "utf8"});
	},

	"applyFileFilter": function(file, cwd) {
	    return file.src.filter(function(filepath) {
	        if (!grunt.file.exists(cwd + filepath)) {
	            grunt.log.warn('Source file "' + filepath + '" not found.');
	            return false;
	        } else {
	            return true;
	        }
	    });
	},

	"withPrefix": function(cssValue, prefix) {
        return cssValue.replace(
            this.getImageName(cssValue),
            this.getImageName(cssValue, prefix)
        );
    },

    "isBackground": function(decl) {
        return !!decl && !!decl.prop && !!decl.value
            && !!~decl.prop.indexOf('background')
            && !!~decl.value.indexOf('url');
    },

    "imageExists": function(imageName) {
        return imageName && fs.existsSync(imageName);
    }
};

};