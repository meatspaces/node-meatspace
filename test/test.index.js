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
var secId;

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
    isPrivate: false
  }
};

describe('meatspace', function () {
  after(function () {
    meat.flush();
  });

  describe('.create',  function () {
    it('creates an invalid message', function (done) {
      meat.fullName = null;
      meat.create(message, function (err, m) {
        should.exist(err);
        done();
      });
    });

    it('creates a valid public message', function (done) {
      meat.fullName = 'test name';
      meat.postUrl = 'http://url.to.blog.com';
      meat.create(message, function (err, m) {
        id = m.id;
        should.exist(m);
        m.content.should.equal(message.content);
        m.fullName.should.equal(meat.fullName);
        m.meta.should.equal(message.meta);
        done();
      });
    });

    it('creates a valid private message', function (done) {
      message.meta.isPrivate = true;
      meat.create(message, function (err, m) {
        secId = m.id;
        should.exist(m);
        m.meta.isPrivate.should.equal(message.meta.isPrivate);
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
        m.content.message = 'new message';
        meat.update(m, function (err, mt) {
          mt.content.message.should.equal(m.content.message);
          done();
        });
      });
    });
  });

  describe('.getAll', function () {
    it('get all messages', function (done) {
      meat.getAll(function (err, mArr) {
        should.exist(mArr);
        mArr.length.should.equal(2);
        done();
      });
    });
  });

  describe('.shareRecent', function () {
    it('get all recent public messages', function (done) {
      meat.shareRecent(function (err, mArr) {
        should.exist(mArr);
        mArr.length.should.equal(1);
        done();
      });
    });
  });

  describe('.shareOne', function () {
    it('get a single valid public message', function (done) {
      meat.shareOne(id, function (err, m) {
        should.exist(m);
        m.meta.isPrivate.should.equal(false);
        done();
      });
    });

    it('get a single invalid public message', function (done) {
      meat.shareOne(secId, function (err, m) {
        should.exist(err);
        done();
      });
    });
  });

  describe('.del', function () {
    it('deletes a message', function (done) {
      meat.create(message, function (err, m) {
        id = m.id;
        meat.del(id, function (err, status) {
          meat.get(id, function (err, msg) {
            should.not.exist(msg);
            done();
          });
        });
      });
    });
  });
});
