var service = require('../service'),
    constants = require('../constants'),
    template = require('../template'),
    BaseController = function() {
        this.service = service;
        this.constants = constants;
        this.template = template;
        this.getAction = function() {};
        this.getTemplate = function () {};
        this.run = function () {};
    };

module.exports = BaseController;
