# Meatspace

## What it is

Decentralized micrologging. A lightweight module to manage mini posts through your node app.

## How to use it

You can use curl to run all the commands below or you can create your own site and use the module as part of your micrologging setup.

## Setup

Install redis.

    > brew install redis
    > redis-server

## Meatspace format

    {
        id: 1,
        fullName: 'Edna Piranha',
        postUrl: 'http://url/to/this/meatspace.com/recent.json',
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
            isPrivate: false,
            isShared: false
        },
        shares: [
            'http://some.other.url.com/recent.json'
        ]
    }

## Meatspace actions

### Initialize

    var Meatspace = require('meatspace');

    var meat = new Meatspace({
      fullName: 'Edna Piranha',
      postUrl: 'http://meatspace.generalgoods.net/recent.json',
      db: 0,
      limit: 10
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

    meat.create(message, function (err, message) {
      if (!err) {
        console.log(message);
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

    meat.get(1, function (err, message) {
      if (!err) {
        meat.del(message.id, function (err, status) {
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

### Share a single public message that you authored

    meat.shareOne(1, function (err, message) {
      if (!err) {
        console.log(message);
      }
    });

### Share a public message that someone else authored

Assumptions: externalMessage is a meatspace message from a separate server.

    meat.share(externalMessage, function (err, message) {
      if (!err) {
        console.log(message);
      }
    });

### Get all subscriptions

    meat.getSubscriptions(function (err, subscriptoins) {
      if (!err) {
        console.log(subscriptions);
      }
    });

### Subscribe to someone else's meatspace

    meat.subscribe('http://some.other.url/recent.json', function (err, url) {
      if (!err) {
        console.log(url);
      }
    });

### Unsubscribe to a meatspace

    meat.unsubscribe('http://some.other.url/recent.json', function (err, status) {
      if (!err) {
        console.log(status);
      }
    });

### Get most recent micrologs from a subscribed meatspace

    meat.getSubscriptionRecent('http://some.other.url/recent.json', function (err, messages) {
      if (!err) {
        console.log(messages);
      }
    });

### Delete the database

    meat.flush();
