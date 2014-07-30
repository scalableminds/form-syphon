(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['lodash', 'jquery'], function(_, $) {
      factory(root, _, $);
    });
  } else if (typeof exports !== 'undefined') {
    var _ = require('lodash');
    module.exports = factory(root, _);
  } else {
    root.FormSyphon = factory(root, root._, (root.jQuery || root.Zepto || root.ender || root.$));
  }
}(this, function(root, _, $) {

