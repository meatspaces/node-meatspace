'use strict';

var redis = require('redis');
var client = redis.createClient();

var KEY = 'meatspace:';

var Meatspace = function (options) {
  if (!options.fullName || !options.postUrl) {
    throw new Error('fullName and postUrl are mandatory');
  }

  var self = this;
  this.fullName = options.fullName;
  this.postUrl = options.postUrl;
  this.db = options.db || 0;
  this.limit = options.limit - 1 || 9;

  client.select(this.db || 0, function (err, res) {
    if (err) {
      throw new Error('Could not select dev/prod database');
    }
  });

  var addToArray = function (self, i, callback) {
    self.get(self.ids[i], function (err, m) {
      if (err) {
        callback(err);
      } else {
        self.messageArray.push(m);
      }

      if (self.messageArray.length === self.ids.length) {
        callback(null, self.messageArray);
      }
    });
  };

  var loadAll = function (self, ids, callback) {
    self.messageArray = [];
    self.ids = ids;

    for (var i = 0; i < self.ids.length; i ++) {
      addToArray(self, i, callback);
    }
  };

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

          client.lpush(KEY + 'all:ids', id);

          if (message.meta.isPrivate) {
            client.lpush(KEY + 'private:ids', id);
          } else {
            client.lpush(KEY + 'public:ids', id);
          }

          client.set(KEY + id, JSON.stringify(message));

          callback(null, message);
        }
      });
    }
  };

  this.get = function (id, callback) {
    client.get(KEY + id, function (err, message) {
      if (err || !message) {
        callback(new Error('Not found'));
      } else {
        if (typeof message === 'string') {
          callback(null, JSON.parse(message));
        } else {
          callback(new Error('Invalid JSON'));
        }
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

        client.set(KEY + message.id, JSON.stringify(message));
        callback(null, message);
      }
    });
  };

  this.del = function (id, callback) {
    client.del(KEY + id, function (err, status) {
      if (err) {
        callback(new Error('Error deleting'));
      } else {
        client.lrem(KEY + 'all:ids', 0, id);
        client.lrem(KEY + 'private:ids', 0, id);
        client.lrem(KEY + 'public:ids', 0, id);
        callback(null, true);
      }
    });
  };

  this.getAll = function (callback) {
    client.lrange(KEY + 'all:ids', 0, -1, function (err, ids) {
      loadAll(self, ids, callback);
    });
  };

  this.shareRecent = function (callback) {
    client.lrange(KEY + 'public:ids', 0, this.limit, function (err, ids) {
      loadAll(self, ids, callback);
    });
  };

  this.shareOne = function (id, callback) {
    this.get(id, function (err, message) {
      if (err) {
        callback(err);
      } else {
        if (message.meta.isPrivate) {
          callback(new Error('This is private'));
        } else {
          callback(null, message);
        }
      }
    });
  };

  // "this meat flush will never fail"
  this.flush = function () {
    client.flushdb();
  };
};

module.exports = Meatspace;
