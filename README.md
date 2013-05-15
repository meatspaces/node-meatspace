# Meatspace

## What it is

Decentralized micrologging. A lightweight module to manage mini posts through your node app.

## Setup

Install redis.

    > brew install redis

    > redis-server

## Meatspace format

    {
        id: 1,
        fullName: 'Edna Piranha',
        postUrl: 'http://url/to/this/meatspace.com',
        content: {
            created: 1368383147,
            updated: 1368383147,
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
            isPrivate': false
        }
    }

## Meatspace actions

### Initialize

    var meat = new Meatspace({
      fullName: 'Edna Piranha',
      postUrl: 'http://meatspace.generalgoods.net',
      db: 0
    });

db is the Redis database you are using.

### Create

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

    meat.create(message, function (err, m) {
      if (!err) {
        console.log(m);
      }
    });

### Edit / Update

    meat.get(1, function (err, m) {
      if (!err) {
        m.content.message = 'new updated message';
        meat.update(m, function (err, m) {
          if (!err) {
            console.log(m)
          }
        });
      }
    });

### Delete

    meat.get(1, function (err, m) {
      if (!err) {
        meat.del(m.id, function (err, status) {
          if (status) {
            console.log('deleted!')
          }
        });
      }
    });

### Get all public and private

    meat.getAll(function (err, messages) {
      if (!err) {
        console.log(messages);
      }
    });

### Share all recent public

The default limit is set to 10. You can change this by setting `meat.limit = 15` as an example.

    meat.shareRecent(function (err, messages) {
      if (!err) {
        console.log(messages);
      }
    });

### Share a single public message

    meat.shareOne(function (err, message) {
      if (!err) {
        console.log(message);
      }
    });
