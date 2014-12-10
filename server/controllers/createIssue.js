var util = require('util'),
    AjaxController = require('./ajax'),
    CreateIssueController = function() {
        AjaxController.apply(this);

        this.getAction = function() {
            return this.constants.HANDLERS.CREATE_ISSUE;
        };

        this.getTemplate = function(req) {
            return {
                block: 'issue',
                forumUrl: req.forumUrl,
                labelsRequired: req.labelsRequired,
                csrf: req.csrf
            };
        };
    };

util.inherits(CreateIssueController, AjaxController);

module.exports = CreateIssueController;


