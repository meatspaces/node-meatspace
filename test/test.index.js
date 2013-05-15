'use strict';

process.env.NODE_ENV = 'test';

var should = require('should');
var Meatspace = require('../index');

var meat = new Meatspace({
  fullName: 'test name',
  postUrl: 'http://test.com',
  db: 0
});
var id;

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
    it('creates an invalid message', function (done) {
      meat.fullName = null;
      meat.create(message, function (err, m) {
        should.exist(err);
        done();
      });
    });

    it('creates a valid message that times out after 1 second', function (done) {
      meat.fullName = 'test';
      message.meta.ttl = 1;
      meat.create(message, function (err, m) {
        id = m.id;

        setTimeout(function () {
          meat.get(id, function (err, m) {
            should.not.exist(m);
            done();
          });
        }, 2500);
      });
    });

    it('creates a valid message', function (done) {
      meat.create(message, function (err, m) {
        id = m.id;
        should.exist(m);
        m.content.should.equal(message.content);
        m.fullName.should.equal(meat.fullName);
        m.meta.should.equal(message.meta);
        done();
      });
    });
  });

  describe('.get', function () {
    it('gets a message', function (done) {
      meat.get(id, function (err, m) {
        should.exist(m);
        done();
      });
    });
  });

  describe('.update', function () {
    it('updates a message', function (done) {
      meat.get(id, function (err, m) {
       //console.log(m.content.message)
        m.content.message = 'new message';
        meat.update(m, function (err, mt) {
          mt.content.message.should.equal(m.content.message);
          done();
        });
      });
    });
  });
});
