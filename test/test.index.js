'use strict';

process.env.NODE_ENV = 'test';

var should = require('should');
var Meatspace = require('../index');

var meat = new Meatspace({
  fullName: 'test name',
  postUrl: 'http://test.com',
  db: 0
});

var message = {
  content: {
    message: 'some message',
    urls: [
      {
        title: 'some url',
        url: 'http://some.url.com'
      }
    ]
  },
  meta: {
    location: '37.3882807, -122.0828559',
    ttl: false,
    isPrivate: false
  }
};

describe('meatspace', function () {
  after(function () {
    meat.flushdb();
  });

  describe('.create',  function () {
    it('creates a valid message', function (done) {
      meat.create(message, function (err, m) {
        should.exist(m);
        m.content.should.equal(message.content);
        m.fullName.should.equal(meat.fullName);
        m.meta.should.equal(message.meta);
        done();
      });
    });

    it('creates a valid message that times out after 1 second', function (done) {
      message.meta.ttl = 1;
      meat.create(message, function (err, m) {
        var id = m.id;

        setTimeout(function () {
          meat.get(id, function (err, m) {
            should.not.exist(m);
            done();
          });
        }, 1800);
      });
    });
  });
});
