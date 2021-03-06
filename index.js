'use strict';

var redis = require('redis');
var client = redis.createClient();
var request = require('request');

var KEY = 'meatspace:';

var Meatspace = function (options) {
  if (!options.fullName || !options.postUrl || !options.username) {
    throw new Error('fullName, username and postUrl are mandatory');
  }

  var self = this;

  this.fullName = options.fullName;
  this.username = options.username;
  this.postUrl = options.postUrl;
  this.db = options.db || 0;
  this.limit = options.limit - 1 || 9;
  this.keyId = '';

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

    if (self.ids.length > 0) {
      for (var i = 0; i < self.ids.length; i ++) {
        addToArray(self, i, callback);
      }
    } else {
      callback(null, self.messageArray);
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
          message.username = self.username;
          if (!message.postUrl) {
            message.postUrl = self.postUrl;
          }
          message.content.created = message.content.updated = Math.round(new Date() / 1000);

          client.lpush(KEY + 'all:ids' + self.keyId, id);

          if (message.meta.isPrivate) {
            client.lpush(KEY + 'priv:ids' + self.keyId, id);
          } else {
            client.lpush(KEY + 'public:ids' + self.keyId, id);
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

  this.share = function (message, url, callback) {
    if (message.shares.indexOf(this.postUrl) < 0) {
      message.meta.isShared = true;
      message.postUrl = url;
      message.shares.push(url);

      self.create(message, callback);
    } else {
      callback(new Error('Already shared'));
    }
  };

  this.subscribe = function (url, callback) {
    client.sadd(KEY + 'subscriptions' + this.keyId, url.toLowerCase().trim(), function (err) {
      if (err) {
        callback(err);
      } else {
        callback(null, url);
      }
    });
  };

  this.unsubscribe = function (url, callback) {
    client.srem(KEY + 'subscriptions' + this.keyId, url.toLowerCase().trim(), function (err) {
      if (err) {
        callback(err);
      } else {
        callback(null, true);
      }
    });
  }

  this.getSubscriptions = function (callback) {
    client.smembers(KEY + 'subscriptions' + this.keyId, function (err, subscriptions) {
      if (err) {
        callback(err);
      } else {
        callback(null, subscriptions);
      }
    });
  };

  this.getSubscriptionRecent = function (url, callback) {
    client.sismember(KEY + 'subscriptions' + this.keyId, url.toLowerCase().trim(), function (err, status) {
      if (err || !status) {
        callback(new Error('Subscription messages not found or you did not subscribe to this url'));
      } else {
        request(url, function (err, resp, body) {
          if (err) {
            callback(err);
          } else {
            if (typeof body !== 'object') {
              try {
                body = JSON.parse(body);
              } catch (e) {
                return callback(new Error('Could not parse JSON'));
              }
            }

            var recentArr = [];

            for (var i = 0; i < body.posts.length; i ++) {
              recentArr.push(body.posts[i]);

              if (recentArr.length === body.posts.length) {
                callback(null, recentArr);
              }
            }
          }
        });
      }
    });
  };

  this.update = function (message, callback) {
    self.get(message.id, function (err, msg) {
      if (err) {
        callback(err);
      } else {
        message.content.updated = Math.round(new Date() / 1000);

        client.lrem(KEY + 'priv:ids' + self.keyId, 0, message.id);
        client.lrem(KEY + 'public:ids' + self.keyId, 0, message.id);

        if (message.meta.isPrivate) {
          client.lpush(KEY + 'priv:ids' + self.keyId, message.id);
        } else {
          client.lpush(KEY + 'public:ids' + self.keyId, message.id);
        }

        client.set(KEY + message.id, JSON.stringify(message));
        callback(null, message);
      }
    });
  };

  this.del = function (id, callback) {
    client.del(KEY + id, function (err) {
      if (err) {
        callback(new Error('Error deleting'));
      } else {
        client.lrem(KEY + 'all:ids' + self.keyId, 0, id);
        client.lrem(KEY + 'priv:ids' + self.keyId, 0, id);
        client.lrem(KEY + 'public:ids' + self.keyId, 0, id);
        callback(null, true);
      }
    });
  };

  this.getAll = function (start, callback) {
    start = parseInt(start, 10);

    if (isNaN(start)) {
      start = 0;
    }

    client.lrange(KEY + 'all:ids' + this.keyId, 0, -1, function (err, cids) {
      if (err) {
        callback(err);
      } else {
        self.totalAll = cids.length;
        client.lrange(KEY + 'all:ids' + self.keyId, start, self.limit + start, function (err, ids) {
          loadAll(self, ids, callback);
        });
      }
    });
  };

  this.getAllIds = function (callback) {
    client.lrange(KEY + 'all:ids' + this.keyId, 0, -1, function (err, cids) {
      if (err) {
        callback(err);
      } else {
        callback(null, cids);
      }
    });
  };

  this.shareRecent = function (start, callback) {
    start = parseInt(start, 10);

    if (isNaN(parseInt(start, 10))) {
      start = 0;
    }

    client.lrange(KEY + 'public:ids' + this.keyId, 0, -1, function (err, cids) {
      if (err) {
        callback(err);
      } else {
        self.totalPublic = cids.length;
        client.lrange(KEY + 'public:ids' + self.keyId, start, self.limit + start, function (err, ids) {
          loadAll(self, ids, callback);
        });
      }
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
