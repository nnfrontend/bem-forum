var _ = require('lodash'),
    vow = require('vow'),

    service = require('../service'),
    template = require('../template'),
    controllers = require('../controllers'),
    routes = require('../routes'),
    util = require('../util'),

    baseUrl = '/forum/';

function setPageTitle(req) {
    // i18 object for page title
    var i18n = {
            ru: { title: 'Форум / БЭМ. Блок, Элемент, Модификатор' },
            en: { title: 'Forum / BEM. Block, Element, Modifier' }
        },
        headersLang = req.headers && req.headers['accept-language'],
        lang = headersLang ? headersLang.substr(0,2) : '',
        isLangSupport = lang ? ['ru', 'en'].some(function(supportLang) {
            return supportLang === lang;
        }) : false,
        baseTitle = isLangSupport ? i18n[lang].title : '',
        data = req.__data,
        forum = data.forum,
        issue = forum.issue;

    data.title = (forum.view === 'issue' ? '#' + issue.number + ' ' + issue.title + ' / ' : '' ) + baseTitle;
}

module.exports = function(pattern, options) {
    baseUrl = pattern || baseUrl;

    template.init(options);
    var ownerToken = options.owner_token,
        // for check, if user checked at least one label
        // for create/edit issue forms - knowledge is taken
        // from common config website
        labelsRequired = options.labelsRequired,
        forumDebug = options.debug;

    return function(req, res, next) {
        var route = routes.getRoute(req.url, req.method),
            query,
            action,
            method,
            options,
            isGetRequest,
            isDeleteRequest;

        query = route[1]; //params hash
        route = route[0]; //route object

        //get action that should be called
        action = route.getName();
        method = route.getData().method;

        isGetRequest = 'GET' === method;
        isDeleteRequest = 'DELETE' === method;

        if(!action) {
            res.writeHead(500);
            res.end('Action was not found');
            return;
        }

        options = (isGetRequest || isDeleteRequest ? query : req.body) || {};

        // for access in templates
        req = _.extend(req, {
            forumUrl: baseUrl,
            labelsRequired: labelsRequired,
            util: util,
            csrf: 'csrf'
        });

        // get full page from server on first enter
        if(!req.xhr) {
            // collect all required data for templates
            var promises = {
                user: service.getAuthUser(req.token, {}),
                labels: service.getLabels (req.token, {})
            };

            if(options.number) {
                // get issue data, that have a number option
                _.extend(promises, {
                    issue: service.getIssue(req.token, options),
                    comments: service.getComments(req.token, options),
                    view: 'issue'
                });
            } else {
                _.extend(promises, {
                    issues: service.getIssues(req.token, options),
                    view: 'issues'
                });
            }

            return vow.all(promises)
                .then(function(values) {

                    req.__data = req.__data || {};
                    req.__data.forum = values;

                    setPageTitle(req);

                    // set global params window.forum.{params}
                    req.__data.forum.global = {
                        debug: (forumDebug && options.debug === 'true')
                    };

                    return next();
                })
                .fail(function(err) {
                    console.err(err);
                });
        } else {
            return controllers.get(action).run(req, res, query, ownerToken, options);
        }
    };
};
