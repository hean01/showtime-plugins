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
        page.entries = 0;
        if (page.metadata) {
	    page.metadata.logo = logo;
	    page.metadata.title = title;
        };
	page.loading = false;
    }

    function trim(s) {
        return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ");
    }

    var blue = "6699CC", orange = "FFA500";

    function colorStr(str, color) {
        return '<font color="' + color + '">(' + str + ')</font>';
    }

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    settings.createInfo("info", logo,
                 "Plugin developed by facanferff, creator of Youtube, Navi-X and TMDB plugins.");

    settings.createDivider('Browser Settings');

    settings.createInt("itemsPerPage", "Number of items per request/page", 50, 1, 100, 1, '', function(v) {
        service.itemsPerPage = v;
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
        setPageHeader(page, plugin.getDescriptor().title + ' - Home');
        var json = showtime.JSONDecode(showtime.httpReq(API + '/streams/summary').toString());
        page.metadata.title += ' (Channels: ' + json.channels + ' Viewers: ' + json.viewers + ')';

        page.appendItem(plugin.getDescriptor().id + ":list:streams:featured", "directory", {
            title: "Featured Streams"
        });
        page.appendItem(plugin.getDescriptor().id + ":list:games", "directory", {
            title: "Top Games"
        });
        page.appendItem(plugin.getDescriptor().id + ":list:following", "directory", {
            title: "Following"
        });
        page.appendItem(plugin.getDescriptor().id + ":list:teams", "directory", {
            title: "Teams"
        });
    });

    plugin.addURI(plugin.getDescriptor().id + ":list:streams:featured", function (page) {
        setPageHeader(page, plugin.getDescriptor().title + ' - Featured Streams');
        var tryToSearch = true, first = true;
        var url = API + '/streams/featured?limit=' + service.itemsPerPage;
        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq(url));
            page.loading = false;
            for (var i in json.featured) {
                page.appendItem(plugin.getDescriptor().id + ":play:live:" + encodeURIComponent(json.featured[i].stream.channel.name), "video", {
                    title: new showtime.RichText(json.featured[i].stream.game + ' - ' + json.featured[i].stream.channel.display_name + coloredStr(' (' + json.featured[i].stream.viewers + ')', orange)),
                    icon: json.featured[i].stream.preview.large,
                    description: new showtime.RichText(coloredStr('Channel name: ', orange) + json.featured[i].stream.channel.display_name +
                        coloredStr('\nViewers: ', orange) + json.featured[i].stream.viewers +
                        coloredStr('\nChannel status: ', orange) + json.featured[i].stream.channel.status +
                        coloredStr('\nDescription: ', orange) + trim(json.featured[i].text)
                    )
                });
                page.entries++;
            }
            if (json.featured.length == 0)
                return tryToSearch = false;
            url = json['_links'].next;
            return true;
        }
        loader();
        page.paginator = loader;
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

    plugin.addURI(plugin.getDescriptor().id + ":list:games", function (page) {
        setPageHeader(page, plugin.getDescriptor().title + ' - Top Games');
        var tryToSearch = true, first = true;
        var url = API + '/games/top?limit=' + service.itemsPerPage;
        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq(url));
            if (first) {
                page.metadata.title +=  ' (' + json._total + ')';
                first = false;
            }
            page.loading = false;
            for (var i in json.top) {
                page.appendItem(plugin.getDescriptor().id + ":list:game:" + encodeURIComponent(json.top[i].game.name), "video", {
                    title: new showtime.RichText(json.top[i].game.name + coloredStr(' (' + json.top[i].viewers + ')', orange)),
                    icon: json.top[i].game.box.large,
                    description: new showtime.RichText(coloredStr('Viewers: ', orange) + json.top[i].viewers +
                        coloredStr('\nChannels: ', orange) + json.top[i].channels
                    )
                });
                page.entries++;
            }
            if (json.top.length == 0)
                return tryToSearch = false;
            url = json['_links'].next;
            return true;
        }
        loader();
        page.paginator = loader;
    });

    plugin.addURI(plugin.getDescriptor().id + ":list:game:(.*)", function (page, name) {
        setPageHeader(page, 'Streams for game: ' + decodeURIComponent(name));
        var tryToSearch = true, first = true;
        var url = API + '/streams?game=' + name + '&limit=' + service.itemsPerPage;
        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq(url));
            if (first) {
                page.metadata.title +=  ' (' + json._total + ')';
                first = false;
            }
            page.loading = false;
            for (var i in json.streams) {
                page.appendItem(plugin.getDescriptor().id + ":play:live:" + escape(json.streams[i].channel.name), "video", {
                    title: new showtime.RichText(json.streams[i].channel.display_name + coloredStr(' (' + json.streams[i].viewers + ')', orange)),
                    icon: json.streams[i].preview.large,
                    description: new showtime.RichText(coloredStr('Viewing this stream: ', orange) + json.streams[i].viewers +
                        coloredStr('\nStream created at: ', orange) + json.streams[i].created_at +
                        coloredStr('\nChannel created at: ', orange) + json.streams[i].channel.created_at +
                        coloredStr('\nChannel updated at: ', orange) + json.streams[i].channel.updated_at +
                        (json.streams[i].channel.mature ? coloredStr('\nMature: ', orange) + json.streams[i].channel.mature : '') +
                        (json.streams[i].channel.language ? coloredStr('\nChannel language: ', orange) + json.streams[i].channel.language : '') +
                        (json.streams[i].channel.views ? coloredStr('\nChannel views: ', orange) + json.streams[i].channel.views : '') +
                        coloredStr('\nChannel status: ', orange) + json.streams[i].channel.status
                    )
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

    plugin.addURI(plugin.getDescriptor().id + ":list:teams", function (page) {
        setPageHeader(page, plugin.getDescriptor().title + ' - Teams');
        var tryToSearch = true, first = true;
        var url = API + '/teams?limit=' + service.itemsPerPage;
        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq(url));
            page.loading = false;
            for (var i in json.teams) {
                page.appendItem(plugin.getDescriptor().id + ":list:team:streams" + encodeURIComponent(json.teams[i].name), "video", {
                    title: new showtime.RichText(json.teams[i].display_name),
                    icon: json.teams[i].logo,
                    description: new showtime.RichText(coloredStr('Name: ', orange) + json.teams[i].name +
                        coloredStr('\nCreated at: ', orange) + json.teams[i].created_at +
                        coloredStr('\nUpdated at: ', orange) + json.teams[i].updated_at +
                        json.teams[i].info
                    )
                });
                page.entries++;
            }
            if (json.teams.length == 0)
                return tryToSearch = false;
            url = json['_links'].next;
            return true;
        }
        loader();
        page.paginator = loader;
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

        page.metadata.logo = logo;
        page.metadata.title = "TwitchTV - Featured Streams";
    }

    plugin.addURI(plugin.getDescriptor().id + ":list:team:(.*)", function(page, team) {
        userStreams(page, team);
    });

    plugin.addURI(plugin.getDescriptor().id + ":user:(.*)", function (page, team) {
        userStreams(page, team);
    });

    plugin.addURI(plugin.getDescriptor().id + ":play:live:(.*)", function (page, name) {
        page.type = "video";

        // Get Access Token (not necessary at the moment but could come into effect at any time)
        var json = showtime.JSONDecode(
            showtime.httpReq('http://api.twitch.tv/api/channels/' + name + '/access_token')
        );

        // Download Multiple Quality Stream Playlist and split into multilines
        var playlist = showtime.httpReq('http://usher.twitch.tv/api/channel/hls/' + name +
            '.m3u8?sig=' + json.sig + '&token=' + json.token +
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
            page.error("Cannot find stream URL.");
            return;
        }
        
        page.source = "videoparams:" + showtime.JSONEncode({
            title: name,
            sources: [{
                url: url
            }]
        });
    });

    //https://api.twitch.tv/api/videos/a577357806
    plugin.addURI(plugin.getDescriptor().id + ":video:(.*)", function (page, id) {
        setPageHeader(page, plugin.getDescriptor().title + ' - Videos');
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq('https://api.twitch.tv/api/videos/' + id));
            page.loading = false;
            for (var i in json.videos) {
                page.appendItem(json.videos[i].url, "video", {
                    title: json.channels[i].display_name,
                    icon: json.channels[i].logo
                });
                page.entries++;
            }
            if (json.channels.length == 0)
                return tryToSearch = false;
            url = json['_links'].next;
            return true;
        }
        loader();
        page.paginator = loader;
    });

    plugin.addURI(plugin.getDescriptor().id + ":channel:(.*)", function (page, name) {
        setPageHeader(page, plugin.getDescriptor().title + ' - ' + decodeURIComponent(name));
        var tryToSearch = true, first = true;

        var json = showtime.JSONDecode(showtime.httpReq(API + '/streams/' + name));
        if (json.stream) {
                page.appendItem(plugin.getDescriptor().id + ":play:live:" + encodeURIComponent(json.stream.channel.name), "video", {
                    title: new showtime.RichText(json.teams[i].display_name),
                    icon: json.teams[i].preview,
                    description: new showtime.RichText(coloredStr('Name: ', orange) + json.teams[i].name +
                        coloredStr('\nCreated at: ', orange) + json.teams[i].created_at +
                        coloredStr('\nUpdated at: ', orange) + json.teams[i].updated_at +
                        json.teams[i].info
                    )
                });

        }

        var url = API + '/channels/' + name + '/videos';
        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq(url));
            page.loading = false;
            for (var i in json.videos) {
                page.appendItem(plugin.getDescriptor().id + ":video:" + json.videos[i]._id, "video", {
                    title: new showtime.RichText(json.videos[i].title),
                    icon: json.videos[i].logo//,
//                    description: new showtime.RichText(coloredStr('Name: ', orange) + json.teams[i].name +
//                        coloredStr('\nCreated at: ', orange) + json.teams[i].created_at +
//                        coloredStr('\nUpdated at: ', orange) + json.teams[i].updated_at +
//                        json.teams[i].info
//                    )
                });
                page.entries++;
            }
            if (json.videos.length == 0)
                return tryToSearch = false;
            url = json['_links'].next;
            return true;
        }
        loader();
        page.paginator = loader;
    });

    plugin.addSearcher(plugin.getDescriptor().title + ' - Channels', logo, function (page, query) {
        setPageHeader(page, plugin.getDescriptor().title + ' - Channels');
        var tryToSearch = true;
        var url = API + '/search/channels?q=' + encodeURIComponent(query) + '&limit=' + service.itemsPerPage;
        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq(url));
            page.loading = false;
            for (var i in json.channels) {
                page.appendItem(plugin.getDescriptor().id + ":channel:" + encodeURIComponent(json.channels[i].name), "video", {
                    title: json.channels[i].display_name,
                    icon: json.channels[i].logo
                });
                page.entries++;
            }
            if (json.channels.length == 0)
                return tryToSearch = false;
            url = json['_links'].next;
            return true;
        }
        loader();
        page.paginator = loader;
    });

    plugin.addSearcher(plugin.getDescriptor().title + ' - Streams', logo, function (page, query) {
        setPageHeader(page, plugin.getDescriptor().title + ' - Streams');
        var tryToSearch = true;
        var url = API + '/search/streams?limit=' + service.itemsPerPage + '&q=' + encodeURIComponent(query);
        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq(url));
            page.loading = false;
            for (var i in json.streams) {
                page.appendItem(plugin.getDescriptor().id + ":play:live:" + encodeURIComponent(json.streams[i].channel.name), "video", {
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
        setPageHeader(page, plugin.getDescriptor().title + ' - Games');
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