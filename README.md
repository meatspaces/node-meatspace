# General Pod

## What it is

A general pod contains information that you can use to send through any social service that supports JSON.

## Pod format

    {
        username: 'ednapiranha',
        fullName: 'Edna Piranha',
        avatar: 'http://url/to/some/avatar.png',
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
        access: 'public',
        share: [
            'some_user_1',
            'some_user_2'
        ],
        meta: {
            'starred': false
        }
    }
