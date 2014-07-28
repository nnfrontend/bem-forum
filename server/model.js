var path = require('path'),

    _ = require('lodash'),
    vow = require('vow'),
    vowFs = require('vow-fs'),
    github = require('./github');

var MAX_LIMIT = 100,
    DEFAULT = {
        page: 1,
        limit: 30,
        sort: {
            field: 'updated',
            direction: 'desc'
        }
    },
    archive;

/**
 * Archive module
 * @returns {{init: init, getIssues: getIssues, getComments: getComments}}
 */
var Archive = function(options) {
    this.init(options);
};

Archive.prototype = {
    model: {
        issues: [],
        comments: []
    },

    /**
     * Initializing archive
     * @param options
     * @returns {Object}
     */
    init: function(options) {
        return vowFs.read(path.join(process.cwd(), options.archive), 'utf-8')
            .then(function(data) {
                data = JSON.parse(data);
                this.model = Object.keys(data).reduce(function(prev, key) {
                    prev[key] = data[key];
                    return prev;
                }, {});
                return vow.resolve(this.model);
            }, this);
    },

    /**
     * Return issues array from archive
     * @returns {Array}
     */
    getIssues: function() {
        return this.model.issues;
    },

    getIssue: function(number) {
        return this.getIssues().filter(function(item) {
            return item.number == number;
        })[0];
    },

    /**
     * Returns comments array for issue with id
     * @param issueId - {Number} id of issue
     * @returns {Array}
     */
    getComments: function(issueId) {
        return this.model.comments
            .filter(function(item) {
                return item.number == issueId;
            })
            .sort(function(a, b) {
                var da = new Date(a['created_at']),
                    db = new Date(b['created_at']);

                return db.getTime() - da.getTime();
            });
    }
};

/**
 * Loads all issues for configured github repository and returns them
 * @returns {Promise}
 */
function loadAllGithubIssues(token) {
    return github.getRepoInfo(token, {})
        .then(function(res) {
            var count = res['open_issues'],
                promises = [],
                pages;

            //check for existed issues count for current repository
            if(!count) {
                return vow.resolve([]);
            }

            //calculate number of pages
            pages = ~~(count/MAX_LIMIT) + (count % MAX_LIMIT > 0 ? 1 : 0);

            //create promises for load all issues by pages
            for(var i = 1; i<= pages; i++) {
                promises.push(github.getIssues(token, { page: i, per_page: MAX_LIMIT }));
            }

            //after all load processes we should unite results and return common array of issues
            return vow.all(promises).then(function(res) {
                return res.reduce(function(prev, item) {
                    prev = prev.concat(item);
                    return prev;
                }, []);
            });
        });
}

/**
 * Returns name of function
 * @param fn - {Function}
 * @returns {*}
 * @private
 */
function getFnName(fn) {
    var _this = module.exports;

    return Object.keys(module.exports).filter(function(key) {
        return _this[key] == fn;
    })[0];
}

module.exports = {

    /**
     * Initialize forum model
     * @param options - {Object} forum options
     * @returns {*}
     */
    init: function(options) {
        github.init(options).addDefaultAPI();
        archive = new Archive(options);
    },

    /**
     * Returns list of issues
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - state {String} state of issue (open|closed)
     *  - labels {String} string of labels separated by comma
     *  - sort {String} sort criteria (created|updated|comments)
     *  - direction {String} sort direction (asc|desc)
     *  - since {Date}: date from (optional) YYYY-MM-DDTHH:MM:SSZ
     *  - page {Number} number of page for pagination
     *  - per_page {Number} number of records per one page
     * @returns {*}
     */
    getIssues: function(token, options) {
        return loadAllGithubIssues(token).then(function(issues) {
            var result = issues.concat(archive.getIssues()),
                sortField,
                sortDirection,
                order,
                page,
                limit;

            //show only open issues and issues from archive
            result = result.filter(function(item) {
                return item.state !== 'closed';
            });

            //filter by issue labels
            if(options.labels && options.labels.length) {
                var filterLabels = options.labels.split(',');

                result = result.filter(function(issueItem) {
                    var issueLabels = issueItem.labels.map(function(labelItem) {
                        return labelItem.name || labelItem;
                    });
                    return filterLabels.every(function(filterLabel) {
                        return issueLabels.indexOf(filterLabel) > -1;
                    });
                });
            }

            //filter by updated date
            if(options['since'] && _.isDate(options['since'])) {
                result = result.filter(function(item) {
                    return (new Date(item['created_at'])).getTime() >= options['since'].getTime();
                });
            }

            //sort results
            sortField = (options.sort && /^(created|updated|comments)$/.test(options.sort))
                ? options.sort : DEFAULT.sort.field;
            sortDirection = (options.direction && /^(asc|desc)$/.test(options.direction))
                ? options.direction : DEFAULT.sort.direction;
            order = DEFAULT.sort.direction === sortDirection ? -1 : 1;

            result = result.sort(function(a, b) {
                var an = +a.number,
                    bn = +b.number;

                //separate gh and archive issues
                if(an*bn < 0) {
                    return bn - an;
                }

                if('comments' === sortField) {
                    return order*(+a[sortField] - +b[sortField]);
                }else {
                    return order*((new Date(a[sortField + '_at'])).getTime() -
                        (new Date(b[sortField + '_at'])).getTime());
                }
            });

            page = options.page || DEFAULT.page;
            limit = options.per_page || DEFAULT.limit;

            result = result.filter(function(item, index) {
                return index >= limit*(page - 1) && index < limit*page
            });

            return vow.resolve(result);
        });
    },

    /**
     * Returns issue by it number
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - number {Number} unique number of issue
     * @returns {*}
     */
    getIssue: function(token, options) {
        var issueNumber = options.number;

        if(!issueNumber) {
            return null;
        }

        if(issueNumber < 0) {
            return vow.resolve(archive.getIssue(issueNumber));
        }

        return github[getFnName(arguments.callee)].call(github, token, options);
    },

    /**
     * Creates new issue
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - title {String} title of issue (required)
     *  - body {String} body of issue (optional)
     *  - labels {Array} array of string label names (required)
     * @returns {*}
     */
    createIssue: function(token, options) {
        return github[getFnName(arguments.callee)].call(github, token, options);
    },

    /**
     * Edit issue
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - number {Number} number of issue (required)
     *  - title {String} title of issue (optional)
     *  - body {String} body of issue (optional)
     *  - labels {Array} array of string label names (optional)
     *  - state {String} state of issue (open|closed) (optional)
     * @returns {*}
     */
    editIssue: function(token, options) {
        return github[getFnName(arguments.callee)].call(github, token, options);
    },

    /**
     * Returns list of comments for issue
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - number {Number} unique number of issue (required)
     *  - page {Number} number of page for pagination (optional)
     *  - per_page {Number} number of records on one page (optional)
     * @returns {*}
     */
    getComments: function(token, options) {
        if(!options.number) {
            return vow.resolve([]);
        }

        if(options.number < 0) {
            return vow.resolve(archive.getComments(options.number));
        }

        return github[getFnName(arguments.callee)].call(github, token, options);
    },

    /**
     * Returns comment by it id
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - id {String} unique id of comment (required)
     * @returns {*}
     */
    getComment: function(token, options) {
        return github[getFnName(arguments.callee)].call(github, token, options);
    },

    /**
     * Create new comment for issue
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - number {String} unique number of issue (required)
     *  - body {String} text for comment (required)
     * @returns {*}
     */
    createComment: function(token, options) {
        return github[getFnName(arguments.callee)].call(github, token, options);
    },

    /**
     * Edit issue comment
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - id {String} unique id of comment (required)
     *  - body {String} text of comment (required)
     * @returns {*}
     */
    editComment: function(token, options) {
        return github[getFnName(arguments.callee)].call(github, token, options);
    },

    /**
     * Removes comment from issue
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - id {String} unique id of comment (required)
     * @returns {*}
     */
    deleteComment: function(token, options) {
        return github[getFnName(arguments.callee)].call(github, token, options);
    },

    /**
     * Returns list of repository labels
     * @param token - {String} oauth user token
     * @param options - {Object} empty object literal
     * @returns {*}
     */
    getLabels: function(token, options) {
        return github[getFnName(arguments.callee)].call(github, token, options);
    },

    /**
     * Returns label from repository by it name
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - name {String} label name (required)
     * @returns {*}
     */
    getLabel: function(token, options) {
        return github[getFnName(arguments.callee)].call(github, token, options);
    },

    /**
     * Creates new label in repository
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - name {String} label name (required)
     *  - color {String} 6 symbol hex color of label (required)
     * @returns {*}
     */
    createLabel: function(token, options) {
        return github[getFnName(arguments.callee)].call(github, token, options);
    },

    /**
     * Updates label in repository
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - name {String} label name (required)
     *  - color {String} 6 symbol hex color of label (required)
     * @returns {*}
     */
    updateLabel: function(token, options) {
        return github[getFnName(arguments.callee)].call(github, token, options);
    },

    /**
     * Removes label from repository
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - name {String} label name (required)
     * @returns {*}
     */
    deleteLabel: function(token, options) {
        return github[getFnName(arguments.callee)].call(github, token, options);
    },

    /**
     * Returns authentificated user
     * @param token - {String} oauth user token
     * @param options - {Object} empty object
     * @returns {*}
     */
    getAuthUser: function(token, options) {
        return github[getFnName(arguments.callee)].call(github, token, options);
    },

    /**
     * Returns detail information about github repository
     * @param token - {String} oauth user token
     * @param options - {Object} empty object
     * @returns {*}
     */
    getRepoInfo: function(token, options) {
        return github[getFnName(arguments.callee)].call(github, token, options);
    },

    addUserAPI: function(token) {
        return github[getFnName(arguments.callee)].call(github, token);
    }
};
