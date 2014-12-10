var util = require('util'),
    AjaxController = require('./ajax'),
    GetCommentsController = function() {
        AjaxController.apply(this);

        this.getAction = function() {
            return this.constants.HANDLERS.GET_COMMENTS;
        };

        this.getTemplate = function(req, options) {
            return {
                block: 'comments',
                mods: { view: 'close' },
                issueNumber: options.number,
                forumUrl: req.forumUrl
            };
        };
    };

util.inherits(GetCommentsController, AjaxController);

module.exports = GetCommentsController;
