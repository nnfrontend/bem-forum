var util = require('util'),
    AjaxController = require('./ajax'),
    GetLabelsController = function() {
        AjaxController.apply(this);

        this.getAction = function() {
            return this.constants.HANDLERS.GET_LABELS;
        };

        this.getTemplate = function(req, options) {
            return {
                block: 'forum-labels',
                mods: { view: options.view }
            };
        };
    };

util.inherits(GetLabelsController, AjaxController);

module.exports = GetLabelsController;
