var auth = require('../auth'),
    service = require('../service'),
    routes = require('../routes');

module.exports = function(pattern, options) {

    var baseUrl = pattern || '/forum/';
    routes.init(baseUrl);
    auth.init(options);
    service.init(options);

    return function(req, res, next) {
        var route = routes.getRoute(req.url, req.method),
            query,
            action,
            method,
            token,
            isGetRequest;

        query = route[1]; //params hash
        route = route[0]; //route object

        //get action that should be called
        action = route.getName();
        method = route.getData().method;

        isGetRequest = 'GET' === method;

        // get access token after redirect
        if('index' === action && query.code) {
            return auth.getAccessToken(req, res, query.code);
        }

        // for all non get requests and when forum token cookie is not exists
        // send request for user authorization
        if((!isGetRequest || 'auth' === action) && (!req.cookies || !req.cookies['forum_token'])) {
            return auth.sendAuthRequest(req, res);
        }

        token = req.cookies['forum_token'];
        token && service.addUserAPI(token);
        req.token = token;

        next();
    };
};

