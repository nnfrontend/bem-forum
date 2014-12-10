var util = require('util'),
    AjaxController = require('./ajax'),
    EditCommentController = function() {
        AjaxController.apply(this);

        this.getAction = function() {
            return this.constants.HANDLERS.EDIT_COMMENT;
        };

        this.getTemplate = function(req, options) {
            return {
                block: 'comment',
                issueNumber: options.number,
                forumUrl: req.forumUrl,
                csrf: req.csrf
            };
        };
    };

util.inherits(EditCommentController, AjaxController);

module.exports = EditCommentController;


