'use strict';

var meat = require('./lib/meatspace');

exports.create(function (message) {
  meat.create(message, function (err, status) {
    if (err) {
      callback(err);
    } else {
      callback(null, status);
    }
  });
});

exports.update(function (message) {
  meat.update(message, function (err, status) {
    if (err) {
      callback(err);
    } else {
      callback(null, status);
    }
  });
});

exports.get(function (id) {

});

exports.del(function (id) {

});

exports.star(function (id) {

});
