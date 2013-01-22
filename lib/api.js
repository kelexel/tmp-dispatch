// https://github.com/dinchak/node-blocks/blob/master/lib/api.js
var fs = require('fs');
var _ = require('underscore');

exports.create = function (app) {
  var api = [];
  versions = fs.readdirSync(__dirname + '/api');
  for (var i in versions) {
    var version = versions[i];
    api[version] = readFiles(__dirname + '/api/' + version, app);
  }
  createRoutes(api, app, '/api');
  return api;
};

function readFiles (dir, app) {
  var api = [];
  var files = fs.readdirSync(dir);
  for (var i in files) {
    var file = files[i];
    var stat = fs.statSync(dir + '/' + file);
    if (stat.isDirectory()) {
      api[file] = readFiles(dir + '/' + file, app);
    } else {
      var route = file.replace('.js', '');
      api[route] = require(dir + '/' + file);
    }
  }
  return api;
}

function createRoutes (api, app, url) {
  for (var route in api) {
    var obj = api[route];
    var routeUrl = url + '/' + route;
    if (_.isArray(obj)) {
      createRoutes(obj, app, url + '/' + route);
      continue;
    }
    if (obj.findAll) {
      app.get(routeUrl, obj.findAll);
    }
    if (obj.findById) {
      app.get(routeUrl + '/:id', obj.findById);
    }
    if (obj.create) {
      console.log('found create')
      app.post(routeUrl, obj.create);
    }
    if (obj.update) {
      app.put(routeUrl + '/:id', obj.update);
    }
    if (obj.destroy) {
      app.delete(routeUrl + '/:id', obj.destroy);
    }
  }
}