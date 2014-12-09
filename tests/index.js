var test = require('tape'),
    SeaLion = require('../');

function fakeRequest(url, method){
    return {
        url: url,
        method: method || 'GET'
    };
}

test('SeaLion is a function', function (t) {
    t.plan(1);
    t.equal(typeof SeaLion, 'function',  'SeaLion is a function');
});

test('new seaLion takes routes', function (t) {
    t.plan(2);

    var expectedRoutes = {
            '/foo': function(){}
        };

    var seaLion = new SeaLion({
        '/foo': expectedRoutes['/foo']
    });

    t.deepEqual(Object.keys(seaLion._routes), Object.keys(expectedRoutes), 'got expected routes');
    t.equal(seaLion._routes['/foo'], expectedRoutes['/foo'], '/foo route is correct');
});

test('can only add valid routes', function (t) {
    t.plan(1);

    var seaLion = new SeaLion();

    t.throws(function(){
        seaLion.add({
            '/foo': null
        });
    });
});

test('add routes using seaLion.add', function (t) {
    t.plan(2);
    var testRoutes = {
            foo: 'bar',
            stuff: 'meh'
        },
        expectedRoutes = {
            foo: 'bar',
            stuff: 'meh'
        },
        seaLion = new SeaLion();

    t.deepEqual(Object.keys(seaLion._routes), [],  'routes has no keys to start');

    seaLion.add(testRoutes);

    t.deepEqual(Object.keys(seaLion._routes), Object.keys(expectedRoutes),  'routes has correct keys after add');
});

test('matched route gets handled', function (t) {
    t.plan(1);

    var seaLion = new SeaLion({
        '/foo': function(request, response){
            t.pass();
        }
    });

    seaLion.handle(fakeRequest('/foo'));

});

test('matched route gets handled', function (t) {
    t.plan(1);

    var seaLion = new SeaLion({
        '/foo/new': function(request, response){
            t.pass();
        },
        '/foo/`id`': function(request, response){
            t.fail();
        }
    });

    seaLion.handle(fakeRequest('/foo/new'));
});

test('matched route gets handled', function (t) {
    t.plan(1);

    var seaLion = new SeaLion({
        '/foo/`id`': function(request, response, tokens){
            t.equal(tokens.id, 'new');
        }
    });

    seaLion.handle(fakeRequest('/foo/new'));
});

test('matched route gets handled', function (t) {
    t.plan(3);

    var seaLion = new SeaLion({
        '/foo/`1`/`2`/`3`': function(request, response, tokens){
            t.equal(tokens[1], 'a');
            t.equal(tokens[2], 'b');
            t.equal(tokens[3], 'c');
        }
    });

    seaLion.handle(fakeRequest('/foo/a/b/c'));
});

test('multi-rule route is matched', function (t) {
    t.plan(3);

    var seaLion = new SeaLion({
        '/foo /bar': function(request, response){
            t.pass();
        }
    });
    seaLion.notFound = function(request){
        t.equal(request.url, '/baz');
    };

    seaLion.handle(fakeRequest('/foo'));
    seaLion.handle(fakeRequest('/bar'));
    seaLion.handle(fakeRequest('/baz'));
});

test('multi-rule route with tokens is matched', function (t) {
    t.plan(3);

    var seaLion = new SeaLion({
        '/foo/`bar` /bar': function(request, response, tokens){
            if(Object.keys(tokens).length){
                t.equal(request.url, '/foo/bar');
                t.equal(tokens.bar, 'bar');
            }else{
                t.equal(request.url, '/bar');
            }
        }
    });

    seaLion.handle(fakeRequest('/foo/bar'));
    seaLion.handle(fakeRequest('/bar'));
});

test('matching stops on slashes', function (t) {
    t.plan(1);

    var seaLion = new SeaLion({
        '/foo/`id`': function(request, response, tokens){
            t.fail();
        },
        '/foo/`id`/bar': function(request, response, tokens){
            t.pass();
        }
    });

    seaLion.handle(fakeRequest('/foo/bar/bar'));
});

test('get rest of path', function (t) {
    t.plan(2);

    var seaLion = new SeaLion({
        '/foo/`thing...`': function(request, response, tokens){
            t.pass();
        }
    });
    seaLion.notFound = function(request){
        t.fail();
    };

    seaLion.handle(fakeRequest('/foo/thing/bar.svg'));
    seaLion.handle(fakeRequest('/foo/thing/bar.png'));
});

test('get lots of path', function (t) {
    t.plan(2);

    var seaLion = new SeaLion({
        '/foo/`thing...`.svg': function(request, response, tokens){
            t.equal(tokens.thing, 'thing/bar', 'Matches .svg');
        }
    });
    seaLion.notFound = function(request){
        t.pass('route didn\'t match .png');
    };

    seaLion.handle(fakeRequest('/foo/thing/bar.svg'));
    seaLion.handle(fakeRequest('/foo/thing/bar.png'));
});

test('method routing', function (t) {
    t.plan(1);

    var seaLion = new SeaLion({
        '/foo': {
            get: function(request, response, tokens){
                t.fail();
            },
            post: function(request, response, tokens){
                t.pass();
            }
        }
    });

    seaLion.handle(fakeRequest('/foo', 'POST'));
});

test('any method routing', function (t) {
    t.plan(1);

    var seaLion = new SeaLion({
        '/foo': {
            post: function(request, response, tokens){
                t.fail();
            },
            any: function(request, response, tokens){
                t.pass();
            }
        }
    });

    seaLion.handle(fakeRequest('/foo'));
});

test('any method routing to fn', function (t) {
    t.plan(1);

    var seaLion = new SeaLion({
        '/foo': function(request, response, tokens){
            t.pass();
        }
    });

    seaLion.handle(fakeRequest('/foo', 'POST'));
});

test('query strings', function (t) {
    t.plan(1);

    var seaLion = new SeaLion({
        '/foo': function(request, response, tokens){
            t.pass();
        }
    });

    seaLion.handle(fakeRequest('/foo?bar=baz'));
});

test('query strings with rest token', function (t) {
    t.plan(1);

    var seaLion = new SeaLion({
        '/`foo...`': function(request, response, tokens){
            t.pass();
        }
    });

    seaLion.handle(fakeRequest('/bar?bar=baz'));
});

require('./matchRule');
require('./matchRuleKeys');