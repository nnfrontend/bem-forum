var Susanin = require('susanin'),
    constants = require('./constants'),
    BaseRoute = function(baseUrl) {
        this.baseUrl = baseUrl;
        this.METHOD = {
            GET: 'GET',
            POST: 'POST',
            PUT: 'PUT',
            DELETE:'DELETE'
        };

        this.get = function (name, method, pattern) {
            return {
                name: name,
                data: { method: method },
                pattern: this.baseUrl + (pattern ? pattern : '')
            };
        };
    },
    susanin;

/**
 * Initialize all inner urls for forum module
 * @param baseUrl - {String} base url
 */
exports.init = function(baseUrl) {

    var url = baseUrl,
        route = new BaseRoute(url);
    susanin = [
        route.get(constants.HANDLERS.INDEX, route.METHOD.GET),
        route.get(constants.HANDLERS.GET_ISSUES, route.METHOD.GET, 'issues'),
        route.get(constants.HANDLERS.GET_ISSUE, route.METHOD.GET, 'issues/<number>'),
        route.get(constants.HANDLERS.CREATE_ISSUE, route.METHOD.POST, 'issues'),
        route.get(constants.HANDLERS.EDIT_ISSUE, route.METHOD.PUT, 'issues/<number>'),
        route.get(constants.HANDLERS.GET_COMMENTS, route.METHOD.GET, 'issues/<number>/comments'),
        route.get(constants.HANDLERS.CREATE_COMMENT, route.METHOD.POST, 'issues/<number>/comments'),
        route.get(constants.HANDLERS.EDIT_COMMENT, route.METHOD.PUT, 'issues/<number>/comments/<id>'),
        route.get(constants.HANDLERS.DELETE_COMMENT, route.METHOD.DELETE, 'issues/<number>/comments/<id>'),
        route.get(constants.HANDLERS.GET_LABELS, route.METHOD.GET, 'labels'),
        route.get(constants.HANDLERS.GET_AUTH_USER, route.METHOD.GET, 'user'),
        route.get(constants.HANDLERS.AUTH, route.METHOD.GET, 'auth'),
        route.get(constants.HANDLERS.GET_REPO_INFO, route.METHOD.GET, 'repo')
    ].reduce(function(_susanin, route) {
            route.pattern += '(/)';
            _susanin.addRoute(route);
            return _susanin;
        }, new Susanin()
    );
};

/**
 * Return matched route for url
 * @param url - {String} request url
 * @returns {*}
 */
exports.getRoute = function(url, method) {
    var result = susanin.find(url, method);
    if(!result.length) {
        return null;
    }

    return result.filter(function(route) {
        return method === route[0].getData().method;
    })[0];
};
