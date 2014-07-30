(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['lodash', 'jquery'], function(_, $) {
      return factory(root, _, $);
    });
  } else if (typeof exports !== 'undefined') {
    var _ = require('lodash');
    var $ = require('jquery');
    module.exports = factory(root, _, $);
  } else {
    root.FormSyphon = factory(root, root._, (root.jQuery || root.Zepto || root.ender || root.$));
  }
}(this, function(root, _, $) {

var FormSyphon, assignKeyValue, flattenData, getElementType, getter;

getter = function(obj, key) {
  if (obj[key]) {
    return obj[key];
  } else {
    return obj["default"];
  }
};

assignKeyValue = function(obj, keychain, value) {
  var key;
  if (!keychain) {
    return obj;
  }
  key = keychain.shift();
  if (!obj[key]) {
    obj[key] = _.isArray(key) ? [] : {};
  }
  if (keychain.length === 0) {
    if (_.isArray(obj[key])) {
      obj[key].push(value);
    } else {
      obj[key] = value;
    }
  }
  if (keychain.length > 0) {
    assignKeyValue(obj[key], keychain, value);
  }
  return obj;
};

flattenData = function(data, parentKey, keyJoiner) {
  var flatData;
  flatData = {};
  _.each(data, function(value, keyName) {
    var hash;
    hash = {};
    if (parentKey) {
      keyName = keyJoiner(parentKey, keyName);
    }
    if (_.isArray(value)) {
      keyName += "[]";
      hash[keyName] = value;
    } else if (_.isPlainObject(value)) {
      hash = flattenData(value, keyName, keyJoiner);
    } else {
      hash[keyName] = value;
    }
    return _.extend(flatData, hash);
  });
  return flatData;
};

getElementType = function($el) {
  var type;
  type = $el.prop("tagName").toLowerCase();
  if (type === "input") {
    type = $el.attr("type") || "text";
  }
  return type;
};

FormSyphon = {
  serialize: function($el) {
    var result;
    result = {};
    _.forEach($el.find(":input"), (function(_this) {
      return function(input) {
        var $input, keychain, type, value;
        $input = $(input);
        type = getElementType($input);
        keychain = _this.keySplitter(_this.keyExtractor($input));
        if (!keychain) {
          return;
        }
        value = getter(_this.readers, type)($input);
        if (getter(_this.keyAssignmentValidators, type)($input, keychain, value)) {
          return assignKeyValue(result, keychain, value);
        }
      };
    })(this));
    return result;
  },
  deserialize: function($el, data) {
    var flatData;
    flatData = flattenData(data, null, this.keyJoiner);
    _.forEach($el.find(":input"), (function(_this) {
      return function(input) {
        var $input, key, type;
        $input = $(input);
        type = getElementType($input);
        key = _this.keyExtractor($input);
        if (!key) {
          return;
        }
        return getter(_this.writers, type)($input, flatData[key]);
      };
    })(this));
  },
  keyAssignmentValidators: {
    "default": function() {
      return true;
    },
    radio: function($el, key, value) {
      return $el.prop("checked");
    }
  },
  readers: {
    "default": function($el) {
      return $el.val();
    },
    number: function($el) {
      return parseInt($el.val());
    },
    checkbox: function($el) {
      return $el.prop("checked");
    },
    date: function($el) {
      return new Date($el.val());
    }
  },
  writers: {
    "default": function($el, value) {
      return $el.val(value);
    },
    date: function($el, value) {
      return $el.val(value.toJSON().substring(0, 10));
    },
    checkbox: function($el, value) {
      return $el.prop("checked", value);
    },
    radio: function($el, value) {
      return $el.prop("checked", $(el).val() === value.toString());
    }
  },
  keyExtractor: function($el) {
    return $el.prop("name");
  },
  keyJoiner: function(parentKey, key) {
    return "" + parentKey + "[" + childKey + "]";
  },
  keySplitter: function(key) {
    var lastKey, matches;
    matches = key.match(/[^\[\]]+/g);
    if (key.length > 1 && key.indexOf("[]") === key.length - 2) {
      lastKey = matches.pop();
      matches.push([lastKey]);
    }
    return matches || null;
  }
};

return FormSyphon;
}));
