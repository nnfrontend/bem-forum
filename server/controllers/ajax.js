var util = require('util'),
    _ = require('lodash'),
    BaseController = require('./base'),
    AjaxController = function() {
        BaseController.call(this);

        this.getTemplate = function () {
            //TODO implement in child classes
        };

        this.beforeGetData = function() {
            //TODO implement in child classes
        };

        this.addAdvancedData = function() {
            //TODO implement in child classes
        };

        this.getAction = function() {
            //TODO implement in child classes
        };

        this.responseData = function(res, html) {
            res.end(html);
        };

        this.run = function (req, res, query, ownerToken, options) {
            // ajax requests
            var result = {};

            // do something with owner right,
            // e.g. add labels when user create/edit issue
            if(query.__access === 'owner' && ownerToken) {
                req.token = ownerToken;
                this.service.addUserAPI(req.token);
            }

            this.beforeGetData(this.getAction(), ownerToken, options);

            // get data by ajax
            return this.service[this.getAction()](req.token, options)
                .then(function(data) {
                    if('json' === query.__mode) {
                        res.json(data);
                        return;
                    }

                    this.addAdvancedData(result, data);
                    return this.template.run(
                        _.extend(this.getTemplate(req, options) || {}, { data: data }), req);
                }, this)
                .then(function(html) {
                    this.responseData(res, html, result);
                }, this)
                .fail(function(err) {
                    res.end(err);
                });
        };
    };

util.inherits(AjaxController, BaseController);

module.exports = AjaxController;
