# Meatspace

## What it is

Decentralized micrologging at the most basic form.

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

### Share
