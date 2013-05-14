'use strict';

var redis = require('redis');
var client = redis.createClient();

var Meatspace = function (options) {
  if (!options.fullName || !options.postUrl) {
    throw new Error('fullName and postUrl are mandatory');
  }

  var self = this;
  this.fullName = options.fullName;
  this.postUrl = options.postUrl;
  this.db = options.db || 0;

  client.select(this.db || 0, function (err, res) {
    if (err) {
      throw new Error('Could not select dev/prod database');
    }
  });

  this.create = function (message, callback) {
    if (!message || !message) {
      callback(new Error('message invalid'));
    } else {
      client.incr('meatspace:ids', function (err, id) {
        if (err) {
          callback(err);
        } else {
          message.id = id;
          message.fullName = self.fullName;
          message.postUrl = self.postUrl;

          var ttl = parseInt(message.meta.ttl, 10);

          client.lpush('meatspace:posts', id);
          client.hmset('meatspace:' + id, message);

          if (!isNaN(ttl)) {
            client.expire('meatspace:' + id, ttl);
          }
          callback(null, message);
        }
      });
    }
  };

  this.get = function (id, callback) {
    client.hgetall('meatspace:' + id, function (err, message) {
      if (err) {
        callback(err);
      } else {
        callback(null, message);
      }
    });
  };

  this.flushdb = function () {
    client.flushdb();
  };
};

module.exports = Meatspace;
