This is a plugin supporting Youtube for Showtime. The idea of the plugin is to allow users to do anything they can do with Youtube official website.

## Features currently supported:
- Login to Youtube
- Standard feeds (complete)
- Channel feeds (complete)
- Movie Feeds (not supporting yet paid content)
- Trailer Feeds (complete)
- User Feeds (Favorites, New subscriptions, Contacts, Watch History, etc.)
- Getting Video Information
- Every resolution supported (240p, 360p, 480p, 720p, 1080p)
- Search videos (see Note 1)
- Pagination (Powerful and fast!)
- Recommendations
- Get information about user
- Search for User Profile (see Note 2)
- Related videos (if Advanced Youtube is enabled)
- Response videos (if Advanced Youtube is enabled)
- Flexible Safe Search
- Limit entries per request (to avoid for a bigger time memory fullness)
- Filter videos (format and resolution)
- User Actions (Like/Dislike video, Comment video, add Favorite, add Contact, add subscription (User and Channel))
- Subtitles (powered by Universal Subtitles)
- Others... (see Changelog)

##Notes
### Note:
To search for content (videos, playlists or channels), use the Search available in Showtime's homepage.

### Note 2:
To search for a specific user to see its profile, use the Search available in Showtime writing
youtube:user:username:<username>, where <username> is the nickname used by that user to be identified by others.

### Note 3:
At the moment, Showtime can't play HTTP Live Streams like the ones that Youtube uses, but you can view the videos that were live streams and were processed. 
Currently Live Streams despite being shown there, they will give you error 400 while Showtime can't support these links.

## Information for programmers
### Opening a video
Starting version 2.2, the plugin supports a few more URI routes:
- youtube:video:<id>
- youtube:video:simple:<id>
- youtube:video:advanced:<id>

In all above, id is the ID of the video to watch.
The first URI route is recommended because that way the plugin will use user preferences and play the video immediately (simple mode) 
or show video details (advanced mode).

You can still use the old URI routes but they are now deprecated and subject to be removed in the future:
- youtube:video:simple:<title>:<id>
- youtube:video:advanced:<title>:<id>