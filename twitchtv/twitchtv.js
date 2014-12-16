/**
 * TwitchTV plugin for Showtime Media Center
 *
 *  Copyright (C) 2012-2014 Fábio Ferreira (facanferff), lprot
 *  Adapted from https://github.com/StateOfTheArt89/Twitch.tv-on-XBMC
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function(plugin) {
    var logo = plugin.path + "logo.png", API = 'https://api.twitch.tv/kraken';

    var service = plugin.createService(plugin.getDescriptor().title, plugin.getDescriptor().id + ":start", "video", true, logo);

    var settings = plugin.createSettings(plugin.getDescriptor().title, logo, plugin.getDescriptor().synopsis);

    function setPageHeader(page, title) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.logo = logo;
	page.metadata.title = title;
	page.loading = false;
    }

    settings.createInfo("info", logo,
                 "Plugin developed by facanferff, creator of Youtube, Navi-X and TMDB plugins.");

    settings.createDivider('Browser Settings');

    settings.createInt("itemsPerPage", "Number of items per page", 20, 1, 100, 1, '', function(v) {
        service.itemsPerPage = v;
    });

    var titleFormats = [
        ['0', '<streamer> - <title>', true], ['1', '<viewers> - <streamers> - <title>'], ['2', '<title>'], ['3', '<streamer>']
    ];
    settings.createMultiOpt("titleFormat", "Title format", titleFormats, function (v) {
        service.titleFormat = v;
    });

    settings.createDivider("Video Playback");

    var videoQualities = [
        ['0', 'Source', true], ['1', 'High'], ['2', 'Medium'], ['3', 'Low'], ['4', 'Mobile']
    ];
    settings.createMultiOpt("videoQuality", "Video Quality", videoQualities, function(v) {
        service.videoQuality = v;
    });

    var following_users = plugin.createStore('following_users', true);
    if (!following_users.users)
        following_users.users = '';

    plugin.addURI(plugin.getDescriptor().id + ":start", function (page) {
        page.type = "directory";
        page.contents = "items";
        page.metadata.title = "TwitchTV - Home Page";
        page.metadata.logo = logo;
        page.loading = false;

        page.appendItem(plugin.getDescriptor().id + ":list:streams:featured:0", "directory", { title: "Featured Streams" });
        page.appendItem(plugin.getDescriptor().id + ":list:games:0", "directory", { title: "Games" });
        page.appendItem(plugin.getDescriptor().id + ":list:following", "directory", { title: "Following" });
        page.appendItem(plugin.getDescriptor().id + ":list:teams:0", "directory", { title: "Teams" });
    });

    function getTitle(streamer, title, viewers) {
        if (!streamer)
            streamer = '-';
        if (!title)
            title = 'no title';
        if (!viewers)
            viewers = '0';

        var streamTitle = streamer + ' - ' + title;
        if (service.titleFormat == '1') {
            // Viewers - Streamer - Stream Title
            streamTitle = viewers + ' - ' + streamer + ' - ' + title
        }
        else if (service.titleFormat == '2') {
            // Stream Title
            streamTitle = title
        }
        else if (service.titleFormat == '3') {
            // Streamer
            streamTitle = streamer
        }
        return streamTitle;
    }

    plugin.addURI(plugin.getDescriptor().id + ":list:streams:featured:(.*)", function (page, index) {
        page.type = "directory";
        page.contents = "items";
        page.metadata.logo = logo;
        page.metadata.title = "TwitchTV - Featured Streams";
        page.loading = false;

        try {
            index = parseInt(index);
            var json = showtime.JSONDecode(showtime.httpReq(API + '/streams/featured?limit=' + service.itemsPerPage  + '&offset=' + (index * service.itemsPerPage)).toString());
            
            for (var i in json.featured) {
                var stream = json.featured[i].stream;
                var channel = json.featured[i].stream.channel;
                var loginName = channel.name;
                var title = getTitle(channel.name, channel.status, channel.viewers);
                page.appendItem(plugin.getDescriptor().id + ":play:live:" + loginName, "video", {
                    title: title,
                    icon: channel.logo
                });
            }

            try {
                var json2 = showtime.JSONDecode(showtime.httpReq(API + '/streams/featured?limit=' + service.itemsPerPage  + '&offset=' + ((index + 1) * service.itemsPerPage)).toString());
                if (json2._links.next) {
                    page.appendItem(plugin.getDescriptor().id + ":list:streams:featured:" + (index + 1), "directory", {
                        title: "Next Page"
                    });
                }
            }
            catch(ex) {
                e(ex);
            }
        }
        catch (ex) {
            page.error("Failed to process page");
            e(ex);
        }
    });

    plugin.addURI(plugin.getDescriptor().id + ":list:following", function (page) {
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
        page.metadata.logo = logo;
        page.metadata.title = "TwitchTV - Following Users";

        var users = following_users.users.split("|");
        if (users.length == 1 && users[0] == "")
            page.appendItem(plugin.getDescriptor().id + ":start", "directory", {
                title: "No users in list"
            });
        else {
            for (var i in users) {
                var user = users[i];
                page.appendItem(plugin.getDescriptor().id + ":user:" + user, "directory", {
                    title: user
                });
            }
        }
    });

    plugin.addURI(plugin.getDescriptor().id + ":list:games:(.*)", function (page, index) {
        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        try {
            index = parseInt(index);
            var json = showtime.JSONDecode(showtime.httpReq(API + '/games/top?limit=' + service.itemsPerPage + '&offset=' + (index * service.itemsPerPage)).toString());
            if (!json) {
                throw new Exception("Failed to request page.");
            }
            for (var i in json.top) {
                if (!json.top[i].game || !json.top[i].game.name)
                    continue;
                var name = json.top[i].game.name;
                var image = '';
                try {
                    image = json.top[i].game.images.super;
                }
                catch (ex) {

                }
                page.appendItem(plugin.getDescriptor().id + ":list:game:" + encodeURIComponent(name) + ":0", "directory", {
                    title: name,
                    icon: image
                });
            }
            if (json['top'].length >= service.itemsPerPage) {
                page.appendItem(plugin.getDescriptor().id + ":list:games:" + (index + 1), "directory", {
                    title: "Next Page"
                });
            }
        }
        catch (ex) {
            page.error("Failed to process page");
            e(ex);
        }

        page.metadata.logo = logo;
        page.metadata.title = "TwitchTV - Featured Streams";
    });

    plugin.addURI(plugin.getDescriptor().id + ":list:game:(.*):(.*)", function (page, name, index) {
        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        try {
            index = parseInt(index);
            var json = showtime.JSONDecode(showtime.httpReq(API + '/streams?game=' + name + '&limit=' + service.itemsPerPage + '&offset=' + index * service.itemsPerPage).toString());
            if (!json) {
                throw new Exception("Failed to request page.");
            }
            for (var i in json.streams) {
                var channelData = json.streams[i].channel;
                var image = "";
                try {
                    image = channelData.logo;
                }
                catch (ex) {

                }
                var title = getTitle(channelData.name, channelData.status, channelData.viewers);
                page.appendItem(plugin.getDescriptor().id + ":play:live:" + json.streams[i].channel.name, "video", {
                    title: title,
                    icon: image
                });
            }

            if (json['streams'].length == 0) {
                page.appendItem(plugin.getDescriptor().id + ":list:game:" + name + ":" + index, "directory", {
                    title: "There are no entries in this page"
                });
            } 

            if (json['streams'].length >= service.itemsPerPage) {
                page.appendItem(plugin.getDescriptor().id + ":list:game:" + name + ":" + (index + 1), "directory", {
                    title: "Next Page"
                });
            }
        }
        catch (ex) {
            page.error("Failed to process page");
            e(ex);
        }

        page.metadata.logo = logo;
        page.metadata.title = "TwitchTV - Featured Streams";
    });

    plugin.addURI(plugin.getDescriptor().id + ":list:teams:(.*)", function (page, index) {
        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        try {
            index = parseInt(index);
            var json = showtime.JSONDecode(showtime.httpReq(API + '/teams/?limit=' + service.itemsPerPage + '&offset=' + (index * service.itemsPerPage)).toString());
            if (!json) {
                throw new Exception("Failed to request page.");
            }
            for (var i in json.teams) {
                var image = "";
                try {
                    image = json.teams[i].logo;
                }
                catch (ex) {

                }
                var name = json.teams[i].name;
                page.appendItem(plugin.getDescriptor().id + ":list:team:streams:" + encodeURIComponent(name), "directory", {
                    title: name,
                    icon: image
                });
            }

            try {
                var json2 = showtime.JSONDecode(showtime.httpReq(API + '/teams/?limit=' + service.itemsPerPage + '&offset=' + ((index + 1) * service.itemsPerPage)).toString());
                if (json2._links.next) {
                    page.appendItem(plugin.getDescriptor().id + ":list:teams:" + (index + 1), "directory", {
                        title: "Next Page"
                    });
                }
            }
            catch(ex) {
                e(ex);
            }
        }
        catch (ex) {
            page.error("Failed to process page");
            e(ex);
        }

        page.metadata.logo = logo;
        page.metadata.title = "TwitchTV - Featured Streams";
    });

    plugin.addURI(plugin.getDescriptor().id + ":add:(.*)", function (page, user) {
        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        if (following_users.users != "") following_users.users += "|";
        following_users.users += user;

        showtime.notify("Added user to Following list.", 2);

        page.redirect(plugin.getDescriptor().id + ":user:" + user);

        page.metadata.logo = logo;
    });

    function userStreams(page, team) {
        page.appendItem(plugin.getDescriptor().id + ":add:" + team, "directory", {
            title: "Add User to Following"
        });

        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        try {
            var json = showtime.JSONDecode(showtime.httpReq('http://api.twitch.tv/api/team/' + team + '/live_channels.json').toString());
            if (!json) {
                throw new Exception("Failed to request page.");
            }
            for (var i in json.channels) {
                var image = "";
                try {
                    image = json.channels[i].channel.image.size600;
                }
                catch (ex) {

                }
                var channelData = json.channels[i].channel;
                var title = getTitle(channelData.display_name, channelData.title, channelData.current_viewers);
                var channelName = json.channels[i].channel.name;
                page.appendItem(plugin.getDescriptor().id + ":play:live:" + channelName, "video", {
                    title: title,
                    icon: image
                });
            }

            if (json.channels.length == 0) {
                page.appendItem(plugin.getDescriptor().id + ":list:team:streams:" + team, "directory", {
                    title: "There are no entries in this page"
                });
            } 
        }
        catch (ex) {
            page.error("Failed to process page");
            e(ex);
        }

        page.metadata.logo = logo;
        page.metadata.title = "TwitchTV - Featured Streams";
    }

    plugin.addURI(plugin.getDescriptor().id + ":list:team:streams:(.*)", function (page, team) {
        userStreams(page, team);
    });

    plugin.addURI(plugin.getDescriptor().id + ":user:(.*)", function (page, team) {
        userStreams(page, team);
    });

    plugin.addURI(plugin.getDescriptor().id + ":play:live:(.*)", function (page, name) {
        page.type = "video";

        // Get Access Token (not necessary at the moment but could come into effect at any time)
        var tokenurl = 'http://api.twitch.tv/api/channels/' + name + '/access_token';
        var readstream = showtime.JSONDecode(showtime.httpReq(tokenurl));
        var channeltoken = readstream['token'];
        var channelsig = readstream['sig'];

        // Download Multiple Quality Stream Playlist and split into multilines
        var playlist = showtime.httpReq('http://usher.twitch.tv/api/channel/hls/' +
            name + '.m3u8?sig=' + channelsig + '&token=' + channeltoken +
            '&allow_source=true').toString().split('\n');

        var url = null;

        // Loop Through Multiple Quality Stream Playlist Until We Find Our Preferred Quality
        for (var line = 0; line < playlist.length; line++) {
            if (playlist[line].indexOf('EXT-X-MEDIA:TYPE=VIDEO') > -1) {
                var url = playlist[line + 2];
                if (playlist[line].indexOf(videoQualities[service.videoQuality].toString().split(',')[1]) > -1 || !service.videoQuality)
                    break;
            }
        }

        page.loading = false;

        if (!url) {
            page.error("Cannot find a valid stream.");
            return;
        }
        
        page.source = "videoparams:" + showtime.JSONEncode({
            title: name,
            sources: [{
                url: url
            }]
        });
    });

    function e(ex) {
        t(ex);
        t("Line #" + ex.lineNumber);
    }
    
    function t(message) {
        showtime.trace(message, plugin.getDescriptor().id);
    }
    
    function p(message) {
        showtime.print(message);
    }

    plugin.addSearcher(plugin.getDescriptor().title + ' - Streams', logo, function (page, query) {
        page.type="directory";
        page.contents="list";
        page.entries = 0;
        var tryToSearch = true;
        var url = API + '/search/streams?limit=50&q=' + encodeURIComponent(query);
        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq(url));
            page.loading = false;
            for (var i in json.streams) {
                page.appendItem(plugin.getDescriptor().id + ":play:live:" + json.streams[i].channel.name, "video", {
                    title: (json.streams[i].game ? json.streams[i].game + ' - ' : '') + json.streams[i].channel.display_name + ' (' + json.streams[i].viewers + ')',
                    icon: json.streams[i].preview.large
                });
                page.entries++;
            }
            if (json.streams.length == 0)
                return tryToSearch = false;
            url = json['_links'].next;
            return true;
        }
        loader();
        page.paginator = loader;
    });

    plugin.addSearcher(plugin.getDescriptor().title + ' - Games', logo, function (page, query) {
        page.type="directory";
        page.contents="list";
        page.entries = 0;
        page.loading = true;
        var json = showtime.JSONDecode(showtime.httpReq(API + '/search/games?type=suggest&q=' + encodeURIComponent(query) + '&live=true'));
        page.loading = false;
        for (var i in json.games) {
            page.appendItem(plugin.getDescriptor().id + ":list:game:" + escape(json.games[i].name) + ':0', "directory", {
                title: json.games[i].name,
                icon: json.games[i].box.large
            });
            page.entries++;
        }
    });
})(this);