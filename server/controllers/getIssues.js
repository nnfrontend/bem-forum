var util = require('util'),
    AjaxController = require('./ajax'),
    GetIssuesController = function() {
        AjaxController.apply(this);

        this.getAction = function() {
            return this.constants.HANDLERS.GET_ISSUES;
        };

        this.getTemplate = function() {
            return { block: 'forum-issues' };
        };

        this.responseData = function(res, html, result) {
            result.html = html;
            res.json(result);
        };

        this.addAdvancedData = function(result, data) {
            // check if current page is last for paginator
            result.isLastPage = (!data.length || data.length < 10);
        };

        this.beforeGetData = function(action, ownerToken, options) {
            // create issue without checked labels - default behaviors
            if(!options.labels || !ownerToken) {
                options.labels = [];
            }
        };
    };

util.inherits(GetIssuesController, AjaxController);

module.exports = GetIssuesController;
