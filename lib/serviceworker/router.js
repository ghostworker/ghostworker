(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.HAPIRouter = factory());
}(this, (function () { 'use strict';

function interopDefault(ex) {
	return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var hoek = createCommonjsModule(function (module) {
    'use strict';
    // basic replacement for HAPI.js Hoek module


    module.exports = {

        applyToDefaults: function applyToDefaults(obj, src) {
            for (var key in src) {
                if (src.hasOwnProperty(key)) obj[key] = src[key];
            }
            return obj;
        },

        escapeRegex: function escapeRegex(string) {

            // Escape ^$.*+-?=!:|\/()[]{},
            return string.replace(/[\^\$\.\*\+\-\?\=\!\:\|\\\/\(\)\[\]\{\}\,]/g, '\\$&');
        },

        assert: function assert(condition, message) {
            if (!condition) {
                throw new Error(message);
            }
        }
    };
});

var hoek$1 = interopDefault(hoek);
var applyToDefaults = hoek.applyToDefaults;
var escapeRegex = hoek.escapeRegex;
var assert = hoek.assert;

var require$$0 = Object.freeze({
    default: hoek$1,
    applyToDefaults: applyToDefaults,
    escapeRegex: escapeRegex,
    assert: assert
});

var boom = createCommonjsModule(function (module) {
    'use strict';
    // basic replacement for HAPI.js Boom module


    module.exports = {

        notFound: function notFound() {

            return null;
        },

        badRequest: function badRequest() {

            return null;
        }
    };
});

var boom$1 = interopDefault(boom);
var notFound = boom.notFound;
var badRequest = boom.badRequest;

var require$$2 = Object.freeze({
    default: boom$1,
    notFound: notFound,
    badRequest: badRequest
});

var regex = createCommonjsModule(function (module, exports) {
    'use strict';

    // Load modules


    // Declare internals

    var internals = {};

    exports.generate = function () {

        /*
            /path/{param}/path/{param?}
            /path/{param*2}/path
            /path/{param*2}
            /path/x{param}x
            /{param*}
        */

        var empty = '(?:^\\/$)';

        var legalChars = '[\\w\\!\\$&\'\\(\\)\\*\\+\\,;\\=\\:@\\-\\.~]';
        var encoded = '%[A-F0-9]{2}';

        var literalChar = '(?:' + legalChars + '|' + encoded + ')';
        var literal = literalChar + '+';
        var literalOptional = literalChar + '*';

        var midParam = '(?:\\{\\w+(?:\\*[1-9]\\d*)?\\})'; // {p}, {p*2}
        var endParam = '(?:\\/(?:\\{\\w+(?:(?:\\*(?:[1-9]\\d*)?)|(?:\\?))?\\})?)?'; // {p}, {p*2}, {p*}, {p?}

        var partialParam = '(?:\\{\\w+\\??\\})'; // {p}, {p?}
        var mixedParam = '(?:(?:' + literal + partialParam + ')+' + literalOptional + ')|(?:' + partialParam + '(?:' + literal + partialParam + ')+' + literalOptional + ')|(?:' + partialParam + literal + ')';

        var segmentContent = '(?:' + literal + '|' + midParam + '|' + mixedParam + ')';
        var segment = '\\/' + segmentContent;
        var segments = '(?:' + segment + ')*';

        var path = '(?:^' + segments + endParam + '$)';

        //                1:literal               2:name   3:*  4:count  5:?
        var parseParam = '(' + literal + ')|(?:\\{(\\w+)(?:(\\*)(\\d+)?)?(\\?)?\\})';

        var expressions = {
            parseParam: new RegExp(parseParam, 'g'),
            validatePath: new RegExp(empty + '|' + path),
            validatePathEncoded: /%(?:2[146-9A-E]|3[\dABD]|4[\dA-F]|5[\dAF]|6[1-9A-F]|7[\dAE])/g
        };

        return expressions;
    };
});

var regex$1 = interopDefault(regex);
var generate = regex.generate;

var require$$1 = Object.freeze({
    default: regex$1,
    generate: generate
});

var segment = createCommonjsModule(function (module, exports) {
    'use strict';

    // Load modules

    var Hoek = interopDefault(require$$0);

    // Declare internals

    var internals = {};

    exports = module.exports = internals.Segment = function () {

        this._edge = null; // { segment, record }
        this._fulls = null; // { path: { segment, record }
        this._literals = null; // { literal: { segment, <node> } }
        this._param = null; // <node>
        this._mixed = null; // [{ segment, <node> }]
        this._wildcard = null; // { segment, record }
    };

    internals.Segment.prototype.add = function (segments, record) {

        /*
            { literal: 'x' }        -> x
            { empty: false }        -> {p}
            { wildcard: true }      -> {p*}
            { mixed: /regex/ }      -> a{p}b
        */

        var current = segments[0];
        var remaining = segments.slice(1);
        var isEdge = !remaining.length;

        var literals = [];
        var isLiteral = true;
        for (var i = 0; i < segments.length && isLiteral; ++i) {
            isLiteral = segments[i].literal !== undefined;
            literals.push(segments[i].literal);
        }

        if (isLiteral) {
            this._fulls = this._fulls || {};
            var literal = '/' + literals.join('/');
            if (!record.settings.isCaseSensitive) {
                literal = literal.toLowerCase();
            }

            Hoek.assert(!this._fulls[literal], 'New route', record.path, 'conflicts with existing', this._fulls[literal] && this._fulls[literal].record.path);
            this._fulls[literal] = { segment: current, record: record };
        } else if (current.literal !== undefined) {
            // Can be empty string

            // Literal

            this._literals = this._literals || {};
            var currentLiteral = record.settings.isCaseSensitive ? current.literal : current.literal.toLowerCase();
            this._literals[currentLiteral] = this._literals[currentLiteral] || new internals.Segment();
            this._literals[currentLiteral].add(remaining, record);
        } else if (current.wildcard) {

            // Wildcard

            Hoek.assert(!this._wildcard, 'New route', record.path, 'conflicts with existing', this._wildcard && this._wildcard.record.path);
            Hoek.assert(!this._param || !this._param._wildcard, 'New route', record.path, 'conflicts with existing', this._param && this._param._wildcard && this._param._wildcard.record.path);
            this._wildcard = { segment: current, record: record };
        } else if (current.mixed) {

            // Mixed

            this._mixed = this._mixed || [];

            var mixed = this._mixedLookup(current);
            if (!mixed) {
                mixed = { segment: current, node: new internals.Segment() };
                this._mixed.push(mixed);
                this._mixed.sort(internals.mixed);
            }

            if (isEdge) {
                Hoek.assert(!mixed.node._edge, 'New route', record.path, 'conflicts with existing', mixed.node._edge && mixed.node._edge.record.path);
                mixed.node._edge = { segment: current, record: record };
            } else {
                mixed.node.add(remaining, record);
            }
        } else {

            // Parameter

            this._param = this._param || new internals.Segment();

            if (isEdge) {
                Hoek.assert(!this._param._edge, 'New route', record.path, 'conflicts with existing', this._param._edge && this._param._edge.record.path);
                this._param._edge = { segment: current, record: record };
            } else {
                Hoek.assert(!this._wildcard || !remaining[0].wildcard, 'New route', record.path, 'conflicts with existing', this._wildcard && this._wildcard.record.path);
                this._param.add(remaining, record);
            }
        }
    };

    internals.Segment.prototype._mixedLookup = function (segment) {

        for (var i = 0; i < this._mixed.length; ++i) {
            if (internals.mixed({ segment: segment }, this._mixed[i]) === 0) {
                return this._mixed[i];
            }
        }

        return null;
    };

    internals.mixed = function (a, b) {

        var aFirst = -1;
        var bFirst = 1;

        var as = a.segment;
        var bs = b.segment;

        if (as.length !== bs.length) {
            return as.length > bs.length ? aFirst : bFirst;
        }

        if (as.first !== bs.first) {
            return as.first ? bFirst : aFirst;
        }

        for (var i = 0; i < as.segments.length; ++i) {
            var am = as.segments[i];
            var bm = bs.segments[i];

            if (am === bm) {
                continue;
            }

            if (am.length === bm.length) {
                return am > bm ? bFirst : aFirst;
            }

            return am.length < bm.length ? bFirst : aFirst;
        }

        return 0;
    };

    internals.Segment.prototype.lookup = function (path, segments, options) {

        var match = null;

        // Literal edge

        if (this._fulls) {
            match = this._fulls[options.isCaseSensitive ? path : path.toLowerCase()];
            if (match) {
                return { record: match.record, array: [] };
            }
        }

        // Literal node

        var current = segments[0];
        var nextPath = path.slice(current.length + 1);
        var remainder = segments.length > 1 ? segments.slice(1) : null;

        if (this._literals) {
            var literal = options.isCaseSensitive ? current : current.toLowerCase();
            match = this._literals.hasOwnProperty(literal) && this._literals[literal];
            if (match) {
                var record = internals.deeper(match, nextPath, remainder, [], options);
                if (record) {
                    return record;
                }
            }
        }

        // Mixed

        if (this._mixed) {
            for (var i = 0; i < this._mixed.length; ++i) {
                match = this._mixed[i];
                var params = current.match(match.segment.mixed);
                if (params) {
                    var array = [];
                    for (var j = 1; j < params.length; ++j) {
                        array.push(params[j]);
                    }

                    var _record = internals.deeper(match.node, nextPath, remainder, array, options);
                    if (_record) {
                        return _record;
                    }
                }
            }
        }

        // Param

        if (this._param) {
            if (current || this._param._edge && this._param._edge.segment.empty) {

                var _record2 = internals.deeper(this._param, nextPath, remainder, [current], options);
                if (_record2) {
                    return _record2;
                }
            }
        }

        // Wildcard

        if (this._wildcard) {
            return { record: this._wildcard.record, array: [path.slice(1)] };
        }

        return null;
    };

    internals.deeper = function (match, path, segments, array, options) {

        if (!segments) {
            if (match._edge) {
                return { record: match._edge.record, array: array };
            }

            if (match._wildcard) {
                return { record: match._wildcard.record, array: array };
            }
        } else {
            var result = match.lookup(path, segments, options);
            if (result) {
                return { record: result.record, array: array.concat(result.array) };
            }
        }

        return null;
    };
});

var segment$1 = interopDefault(segment);

var require$$0$1 = Object.freeze({
    default: segment$1
});

var index = createCommonjsModule(function (module, exports) {
    'use strict';

    // Load modules

    var Hoek = interopDefault(require$$0);
    var Boom = interopDefault(require$$2);
    var Regex = interopDefault(require$$1);
    var Segment = interopDefault(require$$0$1);

    // Declare internals

    var internals = {
        pathRegex: Regex.generate(),
        defaults: {
            isCaseSensitive: true
        }
    };

    exports.Router = internals.Router = function (options) {

        this.settings = Hoek.applyToDefaults(internals.defaults, options || {});

        this.routes = {}; // Key: HTTP method or * for catch-all, value: sorted array of routes
        this.ids = {}; // Key: route id, value: record
        this.vhosts = null; // {} where Key: hostname, value: see this.routes

        this.specials = {
            badRequest: null,
            notFound: null,
            options: null
        };
    };

    internals.Router.prototype.add = function (config, route) {

        var method = config.method.toLowerCase();

        var vhost = config.vhost || '*';
        if (vhost !== '*') {
            this.vhosts = this.vhosts || {};
            this.vhosts[vhost] = this.vhosts[vhost] || {};
        }

        var table = vhost === '*' ? this.routes : this.vhosts[vhost];
        table[method] = table[method] || { routes: [], router: new Segment() };

        var analysis = config.analysis || this.analyze(config.path);
        var record = {
            path: config.path,
            route: route || config.path,
            segments: analysis.segments,
            params: analysis.params,
            fingerprint: analysis.fingerprint,
            settings: this.settings
        };

        // Add route

        table[method].router.add(analysis.segments, record);
        table[method].routes.push(record);
        table[method].routes.sort(internals.sort);

        var last = record.segments[record.segments.length - 1];
        if (last.empty) {
            table[method].router.add(analysis.segments.slice(0, -1), record);
        }

        if (config.id) {
            Hoek.assert(!this.ids[config.id], 'Route id', config.id, 'for path', config.path, 'conflicts with existing path', this.ids[config.id] && this.ids[config.id].path);
            this.ids[config.id] = record;
        }

        return record;
    };

    internals.Router.prototype.special = function (type, route) {

        Hoek.assert(Object.keys(this.specials).indexOf(type) !== -1, 'Unknown special route type:', type);

        this.specials[type] = { route: route };
    };

    internals.Router.prototype.route = function (method, path, hostname) {

        var segments = path.split('/').slice(1);

        var vhost = this.vhosts && hostname && this.vhosts[hostname];
        var route = vhost && this._lookup(path, segments, vhost, method) || this._lookup(path, segments, this.routes, method) || method === 'head' && vhost && this._lookup(path, segments, vhost, 'get') || method === 'head' && this._lookup(path, segments, this.routes, 'get') || method === 'options' && this.specials.options || vhost && this._lookup(path, segments, vhost, '*') || this._lookup(path, segments, this.routes, '*') || this.specials.notFound || Boom.notFound();

        return route;
    };

    internals.Router.prototype._lookup = function (path, segments, table, method) {

        var set = table[method];
        if (!set) {
            return null;
        }

        var match = set.router.lookup(path, segments, this.settings);
        if (!match) {
            return null;
        }

        var assignments = {};
        var array = [];
        for (var i = 0; i < match.array.length; ++i) {
            var name = match.record.params[i];
            var value = match.array[i];
            if (value) {
                value = internals.decode(value);
                if (value.isBoom) {
                    return this.specials.badRequest || value;
                }

                if (assignments[name] !== undefined) {
                    assignments[name] = assignments[name] + '/' + value;
                } else {
                    assignments[name] = value;
                }

                if (i + 1 === match.array.length || name !== match.record.params[i + 1]) {

                    array.push(assignments[name]);
                }
            }
        }

        return { params: assignments, paramsArray: array, route: match.record.route };
    };

    internals.decode = function (value) {

        try {
            return decodeURIComponent(value);
        } catch (err) {
            return Boom.badRequest('Invalid request path');
        }
    };

    internals.Router.prototype.normalize = function (path) {

        if (path && path.indexOf('%') !== -1) {

            // Uppercase %encoded values

            var uppercase = path.replace(/%[0-9a-fA-F][0-9a-fA-F]/g, function (encoded) {
                return encoded.toUpperCase();
            });

            // Decode non-reserved path characters: a-z A-Z 0-9 _!$&'()*+,;=:@-.~
            // ! (%21) $ (%24) & (%26) ' (%27) ( (%28) ) (%29) * (%2A) + (%2B) , (%2C) - (%2D) . (%2E)
            // 0-9 (%30-39) : (%3A) ; (%3B) = (%3D)
            // @ (%40) A-Z (%41-5A) _ (%5F) a-z (%61-7A) ~ (%7E)

            var decoded = uppercase.replace(/%(?:2[146-9A-E]|3[\dABD]|4[\dA-F]|5[\dAF]|6[1-9A-F]|7[\dAE])/g, function (encoded) {
                return String.fromCharCode(parseInt(encoded.substring(1), 16));
            });

            path = decoded;
        }

        return path;
    };

    internals.Router.prototype.analyze = function (path) {

        Hoek.assert(internals.pathRegex.validatePath.test(path), 'Invalid path:', path);
        Hoek.assert(!internals.pathRegex.validatePathEncoded.test(path), 'Path cannot contain encoded non-reserved path characters:', path);

        var pathParts = path.split('/');
        var segments = [];
        var params = [];
        var fingers = [];

        for (var i = 1; i < pathParts.length; ++i) {
            // Skip first empty segment
            var segment = pathParts[i];

            // Literal

            if (segment.indexOf('{') === -1) {
                segment = this.settings.isCaseSensitive ? segment : segment.toLowerCase();
                fingers.push(segment);
                segments.push({ literal: segment });
                continue;
            }

            // Parameter

            var parts = internals.parseParams(segment);
            if (parts.length === 1) {

                // Simple parameter

                var item = parts[0];
                Hoek.assert(params.indexOf(item.name) === -1, 'Cannot repeat the same parameter name:', item.name, 'in:', path);
                params.push(item.name);

                if (item.wilcard) {
                    if (item.count) {
                        for (var j = 0; j < item.count; ++j) {
                            fingers.push('?');
                            segments.push({});
                            if (j) {
                                params.push(item.name);
                            }
                        }
                    } else {
                        fingers.push('#');
                        segments.push({ wildcard: true });
                    }
                } else {
                    fingers.push('?');
                    segments.push({ empty: item.empty });
                }
            } else {

                // Mixed parameter

                var seg = {
                    length: parts.length,
                    first: typeof parts[0] !== 'string',
                    segments: []
                };

                var finger = '';
                var regex = '^';
                for (var _j = 0; _j < parts.length; ++_j) {
                    var part = parts[_j];
                    if (typeof part === 'string') {
                        finger = finger + part;
                        regex = regex + Hoek.escapeRegex(part);
                        seg.segments.push(part);
                    } else {
                        Hoek.assert(params.indexOf(part.name) === -1, 'Cannot repeat the same parameter name:', part.name, 'in:', path);
                        params.push(part.name);

                        finger = finger + '?';
                        regex = regex + '(.' + (part.empty ? '*' : '+') + ')';
                    }
                }

                seg.mixed = new RegExp(regex + '$', !this.settings.isCaseSensitive ? 'i' : '');
                fingers.push(finger);
                segments.push(seg);
            }
        }

        return {
            segments: segments,
            fingerprint: '/' + fingers.join('/'),
            params: params
        };
    };

    internals.parseParams = function (segment) {

        var parts = [];
        segment.replace(internals.pathRegex.parseParam, function (match, literal, name, wilcard, count, empty) {

            if (literal) {
                parts.push(literal);
            } else {
                parts.push({
                    name: name,
                    wilcard: !!wilcard,
                    count: count && parseInt(count, 10),
                    empty: !!empty
                });
            }

            return '';
        });

        return parts;
    };

    internals.Router.prototype.table = function (host) {

        var result = [];
        var collect = function collect(table) {

            if (!table) {
                return;
            }

            Object.keys(table).forEach(function (method) {

                table[method].routes.forEach(function (record) {

                    result.push(record.route);
                });
            });
        };

        if (this.vhosts) {
            var vhosts = host ? [].concat(host) : Object.keys(this.vhosts);
            for (var i = 0; i < vhosts.length; ++i) {
                collect(this.vhosts[vhosts[i]]);
            }
        }

        collect(this.routes);

        return result;
    };

    internals.sort = function (a, b) {

        var aFirst = -1;
        var bFirst = 1;

        var as = a.segments;
        var bs = b.segments;

        if (as.length !== bs.length) {
            return as.length > bs.length ? bFirst : aFirst;
        }

        for (var i = 0;; ++i) {
            if (as[i].literal) {
                if (bs[i].literal) {
                    if (as[i].literal === bs[i].literal) {
                        continue;
                    }

                    return as[i].literal > bs[i].literal ? bFirst : aFirst;
                }
                return aFirst;
            } else if (bs[i].literal) {
                return bFirst;
            }

            return as[i].wildcard ? bFirst : aFirst;
        }
    };
});

var CallRouter = interopDefault(index);

// pulls in node module and export with rollup

function urltoPath(url) {

    if (!url || url.trim() === '') {
        throw new Error('No url provided');
    }
    return new URL(url).pathname;
}

function normalisePath(path, options) {

    checkStructure(path, 'path');
    var url = new URL('http://example.org' + path);
    if (endsWith(url.pathname, '/')) {
        url.pathname = url.pathname.slice(0, -1);
    }
    return url.pathname;
}

function normaliseRoute(route) {

    checkStructure(route, 'route');
    if (endsWith(route, '/')) {
        route = route.slice(0, -1);
    }
    return route;
}

function checkStructure(str, name) {

    if (!str || str.trim() === '') {
        throw new Error('No ' + name + ' provided');
    }
    if (str.indexOf('/') !== 0) {
        throw new Error('The ' + name + ' does not start with a backslash');
    }
}

function endsWith(str, match, position) {
    if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > str.length) {
        position = str.length;
    }
    position -= match.length;
    var lastIndex = str.lastIndexOf(match, position);
    return lastIndex !== -1 && lastIndex === position;
}

CallRouter.urltoPath = urltoPath;
CallRouter.normaliseRoute = normaliseRoute;
CallRouter.normalisePath = normalisePath;

return CallRouter;

})));
//# sourceMappingURL=hapi-router.js.map
