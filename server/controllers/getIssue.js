var util = require('util'),
    AjaxController = require('./ajax'),
    GetIssueController = function() {
        AjaxController.apply(this);

        this.getAction = function() {
            return this.constants.HANDLERS.GET_ISSUE;
        };

        this.getTemplate = function() {
            return { block: 'issue' };
        };

        this.beforeGetData = function(action, ownerToken, options) {
            // create issue without checked labels - default behaviors
            if(!options.labels || !ownerToken) {
                options.labels = [];
            }
        };
    };

util.inherits(GetIssueController, AjaxController);

module.exports = GetIssueController;
