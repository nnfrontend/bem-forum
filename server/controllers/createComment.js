var util = require('util'),
    AjaxController = require('./ajax'),
    CreateCommentController = function() {
        AjaxController.apply(this);

        this.getAction = function() {
            return this.constants.HANDLERS.CREATE_COMMENT;
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

util.inherits(CreateCommentController, AjaxController);

module.exports = CreateCommentController;

