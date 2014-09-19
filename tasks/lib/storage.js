module.exports = (function() {

'use strict';

var Storage = function() {
    this.flush();
};

var _blocks = {};
var _comments = {};

var add = function(key, content, container) {
    var tmp = container[key] ? container[key] : [];
    tmp.push(content);
    container[key] = tmp;
};

var get = function(keys, container) {
    if (keys instanceof Array) {
        return keys.reduce(function(prev, curr) {
            return container[prev].concat(container[curr] ? container[curr] : []);
        });
    } else {
        return container[keys] ? container[keys] : [];
    }
};

Storage.prototype = {
    "storeDeclaration": function(file, block) {
        add(file, {
            "selector": block.parent.selector,
            "prop": block.prop,
            "value": block.value,
            "line": block.source.start.line
        }, _blocks);
    },

    "storeComment": function(file, comment) {
        add(file, {
            "type": "comment",
            "line": comment.source.start.line,
            "text": comment.text,
            "before": comment.before,
            "left": comment.left,
            "right": comment.right
        }, _comments);
    },

    "getComments": function(keys) {
        return get(keys, _comments);
    },

    "getCommentByLine": function(keys, line) {
        var comments = this.getComments(keys);
        comments = comments instanceof Array ? comments : [comments];
        var result;
        comments.forEach(function(comment){
            if (comment.line && comment.line === line) {
                result = comment;
            }
        });
        return result;
    },

    "getDeclarations": function(keys) {
        return get(keys, _blocks);
    },

    "flush": function(file) {
        if (file) {
            _blocks[file] = [];
            _comments[file] = [];
        } else {
            _blocks = {};
            _comments = {};
        }
    }
};

return new Storage();

})();
