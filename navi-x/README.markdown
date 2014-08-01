## Changelog
### 1.1:
- Add: Initial support for List processors
- Add: Support for list processors in search requests
- Add: When entering TMDb View give media URL so TMDb can show Play Now button (needs at least TMDb 1.1)
- Add: Allow user add items to Home Page (adding item via page menu)
- Add: Label entries as Video processor or List processor if the entry will use processor
- Add: Setting to enable custom views Navi-X
- Add: Clean local playlists individually
- Add: Settings to enable/disable login in future sessions
- Fix: When adding playlists to local store, the store would become corrupted
- Fix: Playlists would not show error when something unexpected happen
- Fix: Verbose mode
- Fix: Issue with not correctly closed color tags in titles
- Enhancement: Redirect TMDb requests to TMDb plugin
- Remove: Report processors and tracking stats

### 1.0.6:
- Fix: Continuous login requests

### 1.0.5:
- Add: Allow user set the source for playlist search in settings
- Add: New default source for playlist search (in TMDB View)
- Add: Support for IMDB Lists
- Add: Search for entries from Item Menu
- Add: Stats system
- Fix: IMDB's Parents Guide would not show up
- Fix: Parser PLX would join the last two items of a playlist wrongly
- Enhacement: Improve reporting system

### 1.0.1:
- Fix: wrong imports in views

### 1.0
#### General:
- Add: Allow user to disable History Tracking
- Add: Notifications for important things (such as reporting)
- Fix: Reinitialize server variable in forced reload
- Enhancement: Use notifications instead of messages that require user interaction

#### Playlists:
- Add: Set number of elements in X axis
- Add: Set number of elements in Y axis
- Add: Store items in local Favorites playlist
- Add: Item Menu
- Add: Playlists with IMDB/TMDB type redirect to TMDB view
- Add: Support for subtitles in playlists (see Note 5/6)
- Fix: Entries with no title would fail to load page in PS3 platform
- Fix: Titles with colors would be wrongly parsed
- Enhancement: Set view in playlists upon entrance to avoid "screen transformation"

#### Processors:
- Add: Report processors that don't work (see Note 2/3)
- Add: Display current status of processing (including countdown timer)
- Add: Cache processors that have cacheable flag equal to 1
- Add: Nested if statements
- Fix: Subvariables in which the main class didn't exist would return error when trying to get it's result

#### Speed:
- Enhancement: Improve plugin startup response time
- Enhancement: Improve response time when browsing

#### TMDB:
- Add: TMDB View
- Add: Trailers
- Add: Similar Movies
- Add: Search in several networks for a movie
- Add: Get Full Cast of a movie
- Add: Get Full Crew of a movie
- Add: Get movies in which a person appeared in the cast
- Add: Use IMDB variable in PLX playlists to identify a movie (see Note 6)
- Add: Use TMDB variable in PLX playlists to identify a movie (see Note 6)
- Add: IMDB's Parents Guide

#### User Account:
- Add: Save playlists IDs for user in local store
- Enhancement: Use local History/Favorites playlist instead of online solution
- Fix: When adding an item to a playlist that contained that item already, it would add again the item making it twice -> Remove the old one and add the fresh one
- Fix: My Playlists

Note 5: The support for subtitles should be easy to use by anyone. In addition to the other information you may provide in a plx file, to add a subtitle 
(you have no limits in the number of subtitles) type like the following:

subtitle.<title of subtitle>=<link to subtitle>

for example:

subtitle.pt=http://example.com

Note 6: These features work only in the Showtime Plugin Navi-X, there's not support for those features in any other platform, including XBMC and Boxee.

## TODO
- Add: While statements
- Add: Multiple variable if conditions
- Add: List scraping features
- Add: IMDB View (?)
- Add: Popups on the fly (?)

## FAQ
### 1. Live Streams from playlists are supported in Showtime?
Yes they are, but they should be in rtmp protocol, there is no support for mms or http live streaming in Showtime. You can watch even TV Channels added from other Navi-X user but I'll 
not tell you where, search Navi-X and you might find it.

### 2. There are some sections that says "XBMC Only", I can't use them in Showtime?
Some of them you can, those entries are labelled like that because the videos contained in those playlists are rtmp link, that XBMC supports while other platforms can't support, 
but Showtime supports it and you can use it as well, you're free to navigate these playlists.

### 3. There are some sections that says "Boxee Only", I can't use them in Showtime?
During development, I faced myself with some playlists labelled like these and some of them didn't work since the feature behind that makes the playlist only supportable for Boxee 
is the HTML support that Showtime can't support, you might try these playlists but most possibly the plugin will not be able to get you the playlist, in these cases you'll get an empty 
playlist.

### 4. You talk about Processors in this plugin several time, what are they?
Well to quote from http://www.navixtreme.com/:
"The purpose of the processor is to function as an online plugin for Navi-X which produces media playback parameters for a single item, 
normally starting with only the URL of the web page which contains the item. In other words, if a web page has a flash player embedded in it, 
the processor teaches Navi-X how to emulate that site's flash player to get the media in the page to play in Showtime."

### 6. What is the status of WatchTV plugin?
With this new plugin, WatchTV plugin became obsoleted, there's no reason to use anymore the system that WatchTV provided, in this plugin you can watch too Live Streams normally and with 
the advantage of viewing those that were added by other users without having work of setting up a server or using a keyboard to enter a link.

### 7. Where can I find facanferff to talk about Showtime?
facanferff is sometimes in Efnet on channel #showtime, you might try to find him there. There will be there some other helpful people ready to assist you.

### 8. How can I give feedback, suggest or report bugs?
To report bugs you can create a ticket in the official bug tracking managed by facanferff and running in andoma's website (http://www.lonelycoder.com/redmine/projects/navix/issues/new).
If the problem is a processor that is throwing any error and if you enabled Report Processors, then it will automatically be reported and you don't need to do anything.