var util = require('util'),
    AjaxController = require('./ajax'),
    EditIssueController = function() {
        AjaxController.apply(this);

        this.getAction = function() {
            return this.constants.HANDLERS.EDIT_ISSUE;
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

util.inherits(EditIssueController, AjaxController);

module.exports = EditIssueController;



