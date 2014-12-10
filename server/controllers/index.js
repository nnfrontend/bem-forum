var cache = {};

exports.get = function(action) {
    if(!cache[action]) {
        var Controller = require('./' + action + '.js');
        cache[action] = new Controller();
    }
    return cache[action];
};
