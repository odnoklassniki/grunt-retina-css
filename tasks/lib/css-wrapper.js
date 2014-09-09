module.exports = function(options, postcss) {

'use strict';

var Wrapper = {};

Wrapper.Declaration = function(property, value) {
    var spaces = options.whitespacing.declaration;
    return postcss.decl({
        "prop": property,
        "value": value,
        "before": spaces.before,
        "after": spaces.after,
        "between": spaces.between
    });
};

Wrapper.Rule = function(selector) {
    var spaces = options.whitespacing.rule;
    return postcss.rule({
        "selector": selector,
        "before": spaces.before,
        "after": spaces.after,
        "between": spaces.between
    });
};

Wrapper.Media = function(rules) {
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

Wrapper.Comment = function(comment, parent) {
    var spaces = options.whitespacing.comment;
    return postcss.comment({
        "before": comment.before,
        "text": options.processComments(comment.text),
        "left": spaces.left,
        "right": spaces.right,
        "parent": parent
    });
};

return Wrapper;

};