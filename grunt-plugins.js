var request = require('request');
var _ = require('lodash');
var Q = require('q');


function condensePlugin(plugin) {
	var keywords = keywords = _.last(_.values(plugin.versions)).keywords;
	return {
		name: plugin.name,
		description: plugin.description,
		author: plugin.author,
		url: plugin.url,
		keywords: keywords,
		// only get created and modified date, leave out all of the version timestamps
		time: {modified: plugin.time.modified, created: plugin.time.created},
		gruntVersion: plugin.devDependencies && plugin.devDependencies.grunt
	};
}

function fetchPluginList() {
	return Q.fcall(function fetchPluginList() {
		var deferred = Q.defer();
		var keyword = 'gruntplugin';
		var url = 'http://isaacs.iriscouch.com/registry/_design/app/_view/byKeyword?startkey=[%22' +
			keyword + '%22]&endkey=[%22' + keyword + '%22,{}]&group_level=3';
		request({url: url, json: true}, function handlePluginList(error, response, body) {
			if(!error && response.statusCode == 200) {
				deferred.resolve(body.rows);
			} else {
				deferred.reject(new Error(error));
			}
		});
		return deferred.promise;
	}).then(function getPlugin(list) {
			var results = _.map(list, function(item) {
				var deferred = Q.defer();
				var name = item.key[1];
				var url = 'http://isaacs.iriscouch.com/registry/' + name;
				request({url: url, json: true}, function handlePlugin(error, response, body) {
					if(!error && response.statusCode == 200) {
						deferred.resolve(condensePlugin(body));
					} else {
						deferred.reject(new Error(error));
					}
				});
				return deferred.promise;
			});
			return Q.all(results);
		});
}

exports.fetchPluginList = fetchPluginList;
