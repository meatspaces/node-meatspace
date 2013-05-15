'use strict';

var redis = require('redis');
var client = redis.createClient();

var KEY = 'meatspace:';
var LIMIT = 10;

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
    if (!message || !this.fullName || !this.postUrl) {
      callback(new Error('Message invalid'));
    } else {
      client.incr(KEY + 'ids', function (err, id) {
        if (err) {
          callback(err);
        } else {
          message.id = id;
          message.fullName = self.fullName;
          message.postUrl = self.postUrl;

          var ttl = parseInt(message.meta.ttl, 10);

          client.lpush(KEY + 'all:ids', id);

          if (message.meta.isPrivate) {
            client.lpush(KEY + 'private:ids', id);
          } else {
            client.lpush(KEY + 'public:ids', id);
          }

          client.set(KEY + id, JSON.stringify(message));

          if (!isNaN(ttl)) {
            client.expire(KEY + id, ttl);
          }
          callback(null, message);
        }
      });
    }
  };

  this.get = function (id, callback) {
    client.get(KEY + id, function (err, message) {
      if (err) {
        callback(err);
      } else {
        callback(null, JSON.parse(message));
      }
    });
  };

  this.update = function (message, callback) {
    self.get(message.id, function (err, msg) {
      if (err) {
        callback(err);
      } else {
        client.lrem(KEY + 'private:ids', 0, message.id);
        client.lrem(KEY + 'public:ids', 0, message.id);

        if (message.isPrivate) {
          client.lpush(KEY + 'private:ids', message.id);
        } else {
          client.lpush(KEY + 'public:ids', message.id);
        }

        client.set(KEY + message.id, message);
        callback(null, message);
      }
    });
  };

  this.del = function (id, callback) {
    self.get(id, function (err, msg) {
      if (err) {
        callback(err);
      } else {
        client.del(KEY + id);
        client.lrem(KEY + 'all:ids', 0, id);
        client.lrem(KEY + 'private:ids', 0, id);
        client.lrem(KEY + 'public:ids', 0, id);
        callback(null, true);
      }
    });
  };

  this.getAll = function (options, callback) {
    var messageArray = [];

    client.lrange(KEY + 'ids', 0, -1, function (err, ids) {
      for (var i = 0; i < ids.length; i ++) {
        client.hmget(ids[i], function (err, m) {
          if (err) {
            callback(err);
          } else {
            messageArray.push(JSON.parse(m));
          }
        });

        if (messageArray.length === ids.length) {
          callback(null, messageArray);
        }
      }
    });
  };

  this.shareRecent = function (options, callback) {
    var messageArray = [];

    client.lrange(KEY + 'public:ids', 0, LIMIT, function (err, ids) {
      for (var i = 0; i < ids.length; i ++) {
        client.get(KEY + ids[i], function (err, m) {
          if (err) {
            callback(err);
          } else {
            messageArray.push(JSON.parse(m));
          }
        });

        if (messageArray.length === ids.length) {
          callback(null, messageArray);
        }
      }
    });
  };

  this.shareOne = function (id, callback) {
    client.hmget(id, function (err, message) {
      if (err) {
        callback(err);
      } else {
        if (message.isPrivate) {
          callback(new Error('This is private'));
        } else {
          callback(null, message);
        }
      }
    });
  };

  // "this meat flush will never fail"
  this.flushdb = function () {
    client.flushdb();
  };
};

module.exports = Meatspace;
