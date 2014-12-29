/**
 * Youtube plugin for Showtime
 *
 *  Copyright (C) 2011-2014 facanferff, lprot
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
    var API = 'https://www.googleapis.com/youtube/v3',
        key = "AIzaSyCSDI9_w8ROa1UoE2CNIUdDQnUhNbp9XR4",
        client_id = "477107727317-bn1q4uorfi4vf941ro4musqmtai78u1t.apps.googleusercontent.com",
        client_secret = "5PsYdg4f72gk4z989mtFC7eL";

    var logo = plugin.path + "logo.png";

    function setPageHeader(page, title) {
        page.type = "directory";
        page.contents = "items";
        page.entries = 0;
        if (page.metadata) {
            page.metadata.logo = logo;
            page.metadata.title = unescape(title);
        };
        page.loading = false;
    }

    function trim(s) {
        return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ");
    }

    var blue = '6699CC',
        orange = 'FFA500',
        red = 'EE0000',
        green = '008B45';

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    function colorStr(str, color) {
        return coloredStr(' (' + str + ')', color);
    }

    var service = plugin.createService(plugin.getDescriptor().title, plugin.getDescriptor().id + ":start", "video", true, logo);

    var settings = plugin.createSettings(plugin.getDescriptor().title, logo, plugin.getDescriptor().synopsis);

    // stores
    var store = plugin.createStore('authinfo', true);
    var store_lists = plugin.createStore('lists', true);
    var main_menu_order = plugin.createStore('menuorder', true);

    settings.createDivider('User Settings');
    settings.createAction("loginV3", "Login to Youtube", function() {
        if (login(true))
            showtime.notify('You successfully logged in to Youtube', 2);
    });

    settings.createAction('clearAuth', 'Unlink from ' + plugin.getDescriptor().title + '...', function() {
        store.refresh_token = '';
        showtime.notify('Showtime is unlinked from ' + plugin.getDescriptor().title, 3, '');
    });

    service.language = store_lists.language;
    if (!service.language)
        store_lists.language = service.language = 'en';

    function getLanguages(fromWhere) { // true - youtube, false - store
        var data;
        if (fromWhere) { // get from youtube
            data = download(null, '/i18nLanguages', {
                args: {
                    'part': 'snippet',
                    'hl': service.language
                }
            });
            store_lists.languages = encodeURI(showtime.JSONEncode(data));
        } else // read from store
            data = showtime.JSONDecode(decodeURI(store_lists.languages));

        service.languages = [];
        for (var i in data.items) {
            if (data.items[i].snippet.hl == service.language)
                service.languages.push([data.items[i].snippet.hl, data.items[i].snippet.name, true]);
            else
                service.languages.push([data.items[i].snippet.hl, data.items[i].snippet.name]);
        }
    }

    function getRegions(fromWhere) {
        var data;
        if (fromWhere) {
            data = download(null, '/i18nRegions', {
                args: {
                    'part': 'snippet',
                    'hl': service.language
                }
            });
            store_lists.regions = encodeURI(showtime.JSONEncode(data));
        } else
            data = showtime.JSONDecode(decodeURI(store_lists.regions));

        service.regions = [];
        for (var i in data.items) {
            if (data.items[i].snippet.gl == 'US')
                service.regions.push([data.items[i].snippet.gl, data.items[i].snippet.name, true]);
            else
                service.regions.push([data.items[i].snippet.gl, data.items[i].snippet.name]);
        }
    }

    settings.createDivider('Language and region');

    store_lists.languages ? getLanguages(false) : getLanguages(true);
    settings.createMultiOpt("language", "Language", service.languages, function(v) {
        store_lists.language = service.language = v;
    });

    store_lists.regions ? getRegions(false) : getRegions(true);
    settings.createMultiOpt("region", "Region", service.regions, function(v) {
        service.region = v;
    });

    settings.createAction("reloadLanguages", "Update language and region lists from Youtube ", function() {
        getLanguages(true);
        getRegions(true);
        showtime.notify("Language and region lists are updated. Reload Showtime to see new lists in settings. ", 5);
    });

    settings.createDivider('Browser Settings');

    var resolutionFilter = [
        ['both', 'Both (SD & HD)', true],
        ['hd', 'HD'],
        ['sd', 'SD']
    ];
    settings.createMultiOpt("resolutionFilter", "Filter by resolution", resolutionFilter, function(v) {
        service.resolutionFilter = v;
    });

    var safeSearch = [
        ['strict', 'Strict'],
        ['moderate', 'Moderate', true],
        ['none', 'None']
    ];
    settings.createMultiOpt("safeSearch", "Safe Search", safeSearch, function(v) {
        service.safeSearch = v;
    });

    settings.createDivider('Video Settings');

    settings.createBool("mode", "Advanced Youtube (Extra video features)", false, function(v) {
        if (v == '1')
            service.mode = 'advanced';
        else
            service.mode = 'simple';
    });

    var maximumResolution = [
        ['4', '1080p', true],
        ['3', '720p'],
        ['2', '480p'],
        ['1', '360p'],
        ['0', '240p']
    ];
    settings.createMultiOpt("maximumResolution", "Highest resolution", maximumResolution, function(v) {
        service.maximumResolution = v;
    });

    var minimumResolution = [
        ['4', '1080p'],
        ['3', '720p'],
        ['2', '480p'],
        ['1', '360p'],
        ['0', '240p', true]
    ];
    settings.createMultiOpt("minimumResolution", "Lowest resolution", minimumResolution, function(v) {
        service.minimumResolution = v;
    });

    var formats = [
        ['default', 'Default', true],
        ['mp4', 'MP4'],
        ['x-flv', 'FLV']
    ];
    settings.createMultiOpt("format", "Video Format", formats, function(v) {
        service.format = v;
    });


    settings.createDivider("User Profile");

    settings.createBool("showUploads", "Show User Uploads", true, function(v) {
        service.showUploads = v;
    });
    settings.createBool("showFavorites", "Show User Favorites", true, function(v) {
        service.showFavorites = v;
    });
    settings.createBool("showPlaylists", "Show User Playlists", true, function(v) {
        service.showPlaylists = v;
    });
    settings.createBool("showSubscriptions", "Show User Subscriptions", true, function(v) {
        service.showSubscriptions = v;
    });
    settings.createBool("showNewSubscriptionVideos", "Show User New Subscription Videos", true, function(v) {
        service.showNewSubscriptionVideos = v;
    });
    settings.createBool("showWatchHistory", "Show User Watch History", true, function(v) {
        service.showWatchHistory = v;
    });
    settings.createBool("showWatchLater", "Show User Watch Later", true, function(v) {
        service.showWatchLater = v;
    });
    settings.createBool("showLikes", "Show User Likes", true, function(v) {
        service.showLikes = v;
    });
    settings.createBool("showVideoRecommendations", "Show User Video Recommendations", true, function(v) {
        service.showVideoRecommendations = v;
    });

    var items = [];
    var items_tmp = [];

    if (showtime.currentVersionInt >= 4 * 10000000 + 3 * 100000 + 261) {
        plugin.addItemHook({
            title: "Search in Youtube",
            itemtype: "video",
            handler: function(obj, nav) {
                var title = obj.metadata.title.toString();
                title = title.replace(/<.+?>/g, "").replace(/\[.+?\]/g, "");
                nav.openURL(plugin.getDescriptor().id + ":scraper:/search:" + escape(showtime.JSONEncode({
                    args: {
                        'part': 'snippet',
                        'type': 'video',
                        'q': title
                    }
                })) + ':' + escape(title));
            }
        });
    }

    plugin.addURI(plugin.getDescriptor().id + ":searcher:(.*):(.*)", function(page, type, query) {
        page.redirect(plugin.getDescriptor().id + ':scraper:/search:' + escape(showtime.JSONEncode({
            args: {
                'part': 'snippet',
                'type': type,
                'q': query
            }
        })) + ':' + escape(query));
    });

    plugin.addURI(plugin.getDescriptor().id + ":search", function(page) {
        page.metadata.glwview = plugin.path + "views/search.view";
        page.type = "directory";
        page.contents = "items";
        page.metadata.title = 'Youtube Search';
        page.metadata.logo = logo;

        pageMenu(page, null, null);

        page.metadata.search = '';
        if (typeof Duktape == 'undefined')
            page.subscribe("page.metadata.search", function(v) {
                page.metadata.search = v;
            });
        else
            require('showtime/prop').subscribeValue(page.model.metadata.search, function(v) {
                page.metadata.search = v;
            });
        page.appendAction("navopen", plugin.getDescriptor().id + ":searcher:video:" + escape(page.metadata.search), true, {
            title: "Search for Videos",
            icon: plugin.path + "views/img/search_videos.png",
            hidden: true,
            search: true
        });
        page.appendAction("navopen", plugin.getDescriptor().id + ":searcher:channel:" + escape(page.metadata.search), true, {
            title: "Search for Channels",
            icon: plugin.path + "views/img/search_channels.png",
            hidden: true,
            search: true
        });
        page.appendAction("navopen", plugin.getDescriptor().id + ":searcher:playlist:" + escape(page.metadata.search), true, {
            title: "Search for Playlists",
            icon: plugin.path + "views/img/search_playlists.png",
            hidden: true,
            search: true
        });
        page.loading = false;
    });

    function parseChannelHints(data) {
        var obj = {};
        if (data.items[0] && data.items[0].brandingSettings) {
            data = data.items[0].brandingSettings.hints;
            for (var it in data) {
                obj[data[it].property] = data[it].value;
            }
        }
        return obj;
    }

    function getItems(items) {
        var arr = [];

        for (var i in items) {
            var it = items[i];

            var args = {
                title: it.snippet.title,
                image: it.snippet.thumbnails ? it.snippet.thumbnails.default.url : plugin.path + "views/img/nophoto.bmp"
            };

            if (it.kind == "youtube#playlistItem" && it.snippet.resourceId.kind == "youtube#video")
                args.url = plugin.getDescriptor().id + ":video:" + it.snippet.resourceId.videoId;
            else if (it.kind == "youtube#playlist") {
                args.url = plugin.getDescriptor().id + ":scraper:/playlistItems:" + escape(showtime.JSONEncode({
                    args: {
                        "part": "snippet,contentDetails,status",
                        "playlistId": it.id
                    }
                })) + ':' + escape(it.snippet.title);
            } else if (it.kind == "youtube#subscription" && it.snippet.resourceId.kind == "youtube#channel")
                args.url = plugin.getDescriptor().id + ":channel:" + it.snippet.resourceId.channelId;

            arr.push(args);
        }
        return arr;
    }

    function parseChannelId(username) {
        var data = download(page, '/channels', {
            args: {
                "part": "id",
                "forUsername": username
            }
        });
        return data.items[0].id;
    }

    plugin.addURI(plugin.getDescriptor().id + ":more:username:(.*)", function(page, username) {
        page.redirect(plugin.getDescriptor().id + ":channel:" + parseChannelId(username));
    });

    function print(data) {
        showtime.print(showtime.JSONEncode(data));
    }

    plugin.addURI(plugin.getDescriptor().id + ":channel:(.*)", function(page, id) {
        page.loading = true;
        if (!store.refresh_token && id == 'mine') {
            page.error('User must be authenticated to see this profile');
            return;
        }

        page.metadata.background = plugin.path + "views/img/background.png";
        page.metadata.backgroundAlpha = 0.5;
        page.metadata.glwview = plugin.path + "views/user2.view";
        page.type = "directory";

        var params = {
            args: {
                'part': 'snippet,contentDetails,brandingSettings,statistics,status'
            }
        };
        id == "mine" ? params.args.mine = true : params.args.id = id;
        var data = download(page, '/channels', params);
        //showtime.print(showtime.JSONEncode(data));
        if (data.error) {
            page.error(data.error);
            return;
        }
        //showtime.print(showtime.JSONEncode(data));
        if (data.items.length == 0) {
            page.error("There are no details available for this channel");
            return;
        }

        var hints = parseChannelHints(data);
        if (hints["watchpage.background.image.url"]) {
            page.metadata.background = hints["watchpage.background.image.url"];
            page.metadata.backgroundAvailable = true;
        }

        if (data.items[0].brandingSettings)
            page.metadata.banner = data.items[0].brandingSettings.image.bannerTabletExtraHdImageUrl;

        if (data.items[0].contentDetails) {
            var uploadsPlaylistId = data.items[0].contentDetails.relatedPlaylists.uploads;
            var favoritesPlaylistId = data.items[0].contentDetails.relatedPlaylists.favorites;
            var likesPlaylistId = data.items[0].contentDetails.relatedPlaylists.likes;
            var watchHistoryPlaylistId = data.items[0].contentDetails.relatedPlaylists.watchHistory;
            var watchLaterPlaylistId = data.items[0].contentDetails.relatedPlaylists.watchLater;
        }
        var channelId = data.items[0].id;

        page.metadata.title = data.items[0].snippet.title;
        page.metadata.logo = data.items[0].snippet.thumbnails.default.url;

        // Subscribe/unsubscribe to the channel
        if (store.refresh_token && id != 'mine') {
            var data = download(page, '/subscriptions', {
                args: {
                    "part": "snippet",
                    "mine": true,
                    "forChannelId": id
                }
            });

            if (data.pageInfo.totalResults == 0) {
                var subscribeButton = page.appendAction("pageevent", "subscribeToTheChannel", false, {
                    title: "Subscribe to this channel"
                });

                page.onEvent('subscribeToTheChannel', function() {
                    var data = download(page, '/subscriptions', {
                        args: {
                            part: 'snippet'
                        },
                        postdata: showtime.JSONEncode({
                            snippet: {
                                resourceId: {
                                    kind: 'youtube#subscription',
                                    channelId: id
                                }
                            }
                        })
                    });
                    if (showtime.JSONEncode(data) != '{}')
                        showtime.notify("You successfully subscribed to this channel", 2);
                    else
                        showtime.notify(data, 2);
                });
            } else {
                var subscribeButton = page.appendAction("pageevent", "unsubscribeFromTheChannel", false, {
                    title: "Unsubscribe from this channel"
                });
                var subId = data.items[0].id;
                page.onEvent('unsubscribeFromTheChannel', function() {
                    var data = download(page, '/subscriptions', {
                        method: 'DELETE',
                        args: {
                            'id': subId
                        }
                    });

                    if (!data.error && data.response.snippet.resourceId.channelId == channelId)
                        showtime.notify("You successfully unsubscribed from this channel", 2);
                    else
                        showtime.notify("Failed to unsubscribe from the channel", 2);
                });
            }
        }

        var lists_tmp = {};

        if (id == "$mine") {
            if (service.showNewSubscriptionVideos) {
                var data = download(page, '/subscriptions', {
                    args: {
                        "part": "snippet,contentDetails",
                        "mine": true
                    }
                });
                var newSubscriptionVideos = [];
                //showtime.print(showtime.JSONEncode(data));
                for (var i in data.items) {
                    var it = data.entry[i];
                    id = it.media$group.yt$videoid.$t;

                    var images = [];
                    if (it.media$group && it.media$group.media$thumbnail) {
                        var images = it.media$group.media$thumbnail;
                    }
                    images.push({
                        width: 400,
                        height: 400,
                        url: plugin.path + "views/img/nophoto.bmp"
                    });
                    images = "imageset:" + showtime.JSONEncode(images);

                    newSubscriptionVideos.push({
                        title: it.title.$t,
                        subtitle: it.author[0].name.$t,
                        image: images,
                        url: plugin.getDescriptor().id + ":video:" + id
                    });
                }

                if (newSubscriptionVideos.length > 0) {
                    newSubscriptionVideos.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: plugin.getDescriptor().id + ":feed:" + escape('https://gdata.youtube.com/feeds/api/users/' + user + '/newsubscriptionvideos') + ':' + escape(page.metadata.title)
                    });

                    if (user == "mine") page.appendPassiveItem("list", newSubscriptionVideos, {
                        title: "New Subscription Videos"
                    });
                    lists_tmp.newSubscriptionVideos = {
                        array: newSubscriptionVideos,
                        title: "New Subscription Videos"
                    };
                }
            }
        } // new subscription videos

        if (service.showFavorites && favoritesPlaylistId) {
            var url = '/playlistItems';
            var params = {
                args: {
                    "part": "snippet,contentDetails,status",
                    "playlistId": favoritesPlaylistId
                }
            };
            var data = download(page, url, params);
            var favorites = getItems(data.items);
            if (favorites.length > 0) {
                favorites.push({
                    title: "See More",
                    image: plugin.path + "views/img/add.png",
                    url: plugin.getDescriptor().id + ":scraper:" + url + ':' + escape(showtime.JSONEncode(params)) + ':' + escape(page.metadata.title)
                });

                if (id == "mine") page.appendPassiveItem("list", favorites, {
                    title: "Favorites"
                });
                lists_tmp.favorites = {
                    array: favorites,
                    title: "Favorites"
                };
            }
        }

        if (id == "mine") {
            if (service.showWatchLater) {
                var data = download(page, '/playlistItems', {
                    args: {
                        "part": "snippet,contentDetails,status",
                        "playlistId": watchLaterPlaylistId
                    }
                });
                var watchLater = getItems(data.items);

                if (watchLater.length > 0) {
                    watchLater.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: plugin.getDescriptor().id + ":feed:" + escape('https://gdata.youtube.com/feeds/api/users/' + id + '/watch_later') + ':' + escape(page.metadata.title)
                    });

                    if (id == "mine") page.appendPassiveItem("list", watchLater, {
                        title: "Watch Later"
                    });
                    lists_tmp.watchLater = {
                        array: watchLater,
                        title: "Watch Later"
                    };
                }
            }

            if (service.showWatchHistory) {
                var data = download(page, '/playlistItems', {
                    args: {
                        "part": "snippet,contentDetails,status",
                        "playlistId": watchHistoryPlaylistId
                    }
                });

                var watchHistory = getItems(data.items);

                if (watchHistory.length > 0) {
                    watchHistory.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: plugin.getDescriptor().id + ":feed:" + escape('https://gdata.youtube.com/feeds/api/users/' + id + '/watch_history') + ':' + escape(page.metadata.title)
                    });

                    if (id == "mine") page.appendPassiveItem("list", watchHistory, {
                        title: "Watch History"
                    });
                    lists_tmp.watchHistory = {
                        array: watchHistory,
                        title: "Watch History"
                    };
                }
            }

            if (service.showLikes && likesPlaylistId) {
                var data = download(page, '/playlistItems', {
                    args: {
                        "part": "snippet,contentDetails,status",
                        "playlistId": likesPlaylistId
                    }
                });

                var likes = getItems(data.items);

                if (likes.length > 0) {
                    likes.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: plugin.getDescriptor().id + ":feed:" + escape("https://gdata.youtube.com/feeds/api/playlists/" + likesPlaylistId) + ':' + escape(page.metadata.title)
                    });

                    if (id == "mine") page.appendPassiveItem("list", watchLater, {
                        title: "Likes"
                    });
                    lists_tmp.likes = {
                        array: likes,
                        title: "Likes"
                    };
                }
            }


            if (service.showSubscriptions) {
                var params = {
                    args: {
                        'part': 'snippet,contentDetails',
                        'maxResults': 50,
                        'mine': true
                    }
                }
                var data = download(page, '/subscriptions', params);
                var subscriptions = getItems(data.items);

                if (subscriptions.length > 0) {
                    subscriptions.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: plugin.getDescriptor().id + ":scraper:/subscriptions:" + escape(showtime.JSONEncode(params)) + ':' + escape(page.metadata.title)
                    });

                    if (id == "mine") page.appendPassiveItem("list", subscriptions, {
                        title: "Subscriptions"
                    });
                    lists_tmp.subscriptions = {
                        array: subscriptions,
                        title: "Subscriptions"
                    };
                }
            }
        } // id=mine

        // Show playlists of the channel
        if (service.showPlaylists) {
            var url = '/playlists';
            var params = {
                args: {
                    "part": "snippet,contentDetails,status",
                    "channelId": channelId
                }
            };
            var data = download(page, url, params);
            var playlists = getItems(data.items);

            if (playlists.length > 0) {
                playlists.push({
                    title: "See More",
                    image: plugin.path + "views/img/add.png",
                    url: plugin.getDescriptor().id + ":scraper:" + url + ':' + escape(showtime.JSONEncode(params)) + ':' + escape(page.metadata.title)
                });

                if (id == "mine") page.appendPassiveItem("list", playlists, {
                    title: "Playlists"
                });
                lists_tmp.playlists = {
                    array: playlists,
                    title: "Playlists"
                };
            }
        }

        if (id == "$mine") {
            if (service.showVideoRecommendations) {
                var data = download({
                    "path": 'https://gdata.youtube.com/feeds/api/users/default/recommendations',
                    "args": {
                        "alt": "json"
                    },
                    "apiV2": true
                });
                data = data.response.feed;
                var videoRecommendations = [];
                for (var i in data.entry) {
                    var it = data.entry[i];
                    id = it.media$group.yt$videoid.$t;
                    var image = "http://i.ytimg.com/vi/" + id + "/hqdefault.jpg";

                    var images = [];
                    if (it.media$group && it.media$group.media$thumbnail) {
                        var images = it.media$group.media$thumbnail;
                    }
                    images.push({
                        width: 400,
                        height: 400,
                        url: plugin.path + "views/img/nophoto.bmp"
                    });
                    images = "imageset:" + showtime.JSONEncode(images);

                    videoRecommendations.push({
                        title: it.title.$t,
                        subtitle: it.author[0].name.$t,
                        image: images,
                        url: plugin.getDescriptor().id + ":video:" + id
                    });
                }

                if (videoRecommendations.length > 0) {
                    videoRecommendations.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: plugin.getDescriptor().id + ":feed:" + escape('https://gdata.youtube.com/feeds/api/users/' + id + '/recommendations') + ':' + escape(page.metadata.title)
                    });

                    if (id == "mine") page.appendPassiveItem("list", videoRecommendations, {
                        title: "Video Recommendations"
                    });
                    lists_tmp.videoRecommendations = {
                        array: videoRecommendations,
                        title: "Video Recommendations"
                    };
                }
            }
        }

        if (service.showUploads && uploadsPlaylistId) {
            var params = {
                args: {
                    "part": "snippet,contentDetails,status",
                    "playlistId": uploadsPlaylistId
                }
            };
            var url = '/playlistItems';
            var data = download(page, url, params);

            var uploads = getItems(data.items);

            if (uploads.length > 0) {
                uploads.push({
                    title: "See More",
                    image: plugin.path + "views/img/add.png",
                    url: plugin.getDescriptor().id + ":scraper:" + url + ':' + escape(showtime.JSONEncode(params)) + ':' + escape(page.metadata.title)
                });

                if (id == "mine") page.appendPassiveItem("list", uploads, {
                    title: "Uploads"
                });
                lists_tmp.uploads = {
                    array: uploads,
                    title: "Uploads"
                };
            }
        }

        if (id != "mine") {
            var lists = {
                uploads: lists_tmp.uploads,
                playlists: lists_tmp.playlists,
                favorites: lists_tmp.favorites
            };

            for (var i in lists) {
                var it = lists[i];
                if (it) {
                    page.appendPassiveItem("list", it.array, {
                        title: it.title
                    });
                }
            }
        }
        page.loading = false;
    });

    function getUrlVars(url) {
        var hash, json = {},
            hashes = url.split(/\&|%26|%3F/);
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split(/\=|%3D/);
            json[hash[0]] = hash[1];
        }
        return json;
    }

    function getMaps(url) {
        var hash, json = {},
            hashes = url.split(/\&/);
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split(/\=/);
            json[hash[0]] = hash[1];
        }
        return json;
    }

    var player = '',
        fnName = '',
        outFn = '';

    function unroll(age, url, a) {
        if (age)
            return a.substr(2, 61) + a[82] + a.substr(64, 18) + a[63];
        if (player != url) {
            if (service.enableDebug) showtime.print('player: ' + url);
            var code = showtime.httpReq('http:' + url).toString();
            player = url;
            fnName = code.match(/signature=([^(]*)/);
            if (fnName)
                fnName = fnName[1];
            else
                fnName = code.match(/"signature",([^(]*)/)[1];
            var re = new RegExp('function ' + fnName + '\\(([^\}]*)');
            var fnText = 'function ' + fnName + '(' + re.exec(code)[1] + '\}';
            outFn = fnText;
            var re = /[=|;]([^\(]*)/g;
            var match = re.exec(fnText);
            while (match) {
                if (outFn.search('function ' + match[1] + '\\(') == -1) { // check if we already included this function
                    var re2 = new RegExp('function ' + match[1] + '\\(([^\}]*)');
                    var match2 = re2.exec(code);
                    if (match2) {
                        outFn = 'function ' + match[1] + '(' + match2[1] + '};' + outFn;
                    } else { // look for vars
                        var varName = match[1].substr(0, match[1].indexOf('.'));
                        if (match[1].split('.').pop() != 'split')
                            if (outFn.search('var ' + varName + '=') == -1) { //check if we already included this var
                                re2 = new RegExp('var ' + varName + '=([\\s\\S]*?)\\};');
                                match2 = re2.exec(code);
                                if (match2) {
                                    outFn = 'var ' + varName + '=' + match2[1] + '};' + outFn;
                                }
                            }
                    }
                }
                match = re.exec(fnText);
            }
        }
        if (service.enableDebug) showtime.print('a_in: ' + a);
        var result;
        try {
            if (service.enableDebug) showtime.print(outFn);
            result = eval(outFn + fnName + '(a)');
        } catch (err) {};
        if (service.enableDebug) showtime.print('a_out: ' + result);
        return result;
    }

    var itagToInfo = {
        "5": "426x240 (flv)",
        "6": "450x270 (flv)",
        "13": "mpeg4",
        "17": "176x144 (mpeg4)",
        "18": "640x360 (h264)",
        "22": "1280x720 (h264)",
        "34": "640x360 (flv)",
        "35": "854x480 (flv)",
        "36": "320x180 (mpeg4)",
        "37": "1920x1080 (h264)",
        "38": "4096x3072 (h264)",
        "43": "640x360 (vp8)",
        "44": "854x480 (vp8)",
        "45": "1280x720 (vp8)",
        "46": "1920x1080 (vp8)",
        "59": "854x480 (h264)",
        "78": "854x480 (h264)",
        "82": "640x360 (h264 3d)",
        "83": "854x480 (h264 3d)",
        "84": "1280x720 (h264 3d)",
        "85": "1920x1080 (h264 3d)",
        "100": "640x360 (vp8 3d)",
        "101": "3D webm 480p",
        "102": "3D webm 720p",
        "92": "HLS mp4 240p",
        "93": "HLS mp4 360p",
        "94": "HLS mp4 480p",
        "95": "HLS mp4 720p",
        "96": "HLS mp4 1080p",
        "132": "HLS mp4 240p",
        "151": "HLS mp4 72p",
        "133": "426x240 (h264 dv)",
        "134": "640x360 (h264 dv)",
        "135": "854x480 (h264 dv)",
        "136": "1280x720 (h264 dv)",
        "137": "1920x1080 (h264 dv)",
        "138": "3840x2160 (h264 dv)",
        "160": "256x144 (h264 dv)",
        "264": "2560x1440 (h264 dv)",
        "298": "1280x720 (h264 dv)",
        "299": "1920x1080 (h264 dv)",
        "266": "3840x2160 (h264 dv)",
        "139": "aac 48bps",
        "140": "aac 128bps",
        "141": "aac 256bps",
        "167": "640x360 (vp8 dv)",
        "168": "854x480 (vp8 dv)",
        "169": "1280x720 (vp8 dv)",
        "170": "1920x1080 (vp8 dv)",
        "218": "854x480 (vp8 dv)",
        "219": "854x480 (vp8 dv)",
        "278": "176x144 (vp9 dv)",
        "242": "426x240 (vp9 dv)",
        "243": "640x360 (vp9 dv)",
        "244": "854x480 (vp9 dv)",
        "245": "854x480 (vp9 dv)",
        "246": "854x480 (vp9 dv)",
        "247": "1280x720 (vp9 dv)",
        "248": "1920x1080 (vp9 dv)",
        "271": "2560x1440 (vp9 dv)",
        "272": "3840x2160 (vp9 dv)",
        "302": "1280x720 (vp9 dv)",
        "303": "1920x1080 (vp9 dv)",
        "313": "3840x2160 (vp9 dv)",
        "171": "vorbis 128bps",
        "172": "vorbis 256bps",
        "249": "opus 50bps",
        "250": "opus 70bps",
        "251": "opus 160bps"
    };

    function getVideosList(page, id, number_items) {
        var doc = showtime.httpReq('http://www.youtube.com/watch?v=' + id, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:15.0) Gecko/20100101 Firefox/15.0.1'
            }
        }).toString();

        var titleMatch = doc.match(/<meta property="og:title" content="(.+?)">/);
        if (titleMatch)
            var title = titleMatch[1];

        var encoded_url_map = '';
        var json = doc.match(/;ytplayer\.config\s*=\s*(\{.*?\});/);
        if (json)
            json = showtime.JSONDecode(json[1]);
        else
            return trim(doc.match(/id="unavailable-message" class="message">([\s\S]*?)</)[1]);

        if (json.args.url_encoded_fmt_stream_map)
            encoded_url_map = json.args.url_encoded_fmt_stream_map
        if (json.args.adaptive_fmts) encoded_url_map += ',' + json.args.adaptive_fmts;

        var age = false;
        if (doc.match(/player-age-gate-content">/)) {
            age = true;
            doc = showtime.httpReq('http://www.youtube.com/get_video_info', {
                args: {
                    'video_id': id,
                    'el': 'player_embedded',
                    'gl': 'US',
                    'hl': 'en',
                    'eurl': 'https://youtube.googleapis.com/v/' + id,
                    'asv': 3,
                    'sts': '1588'
                }
            }).toString();
            json = getMaps(doc);
            encoded_url_map = unescape(json.url_encoded_fmt_stream_map) + ',' + unescape(json.adaptive_fmts);
        }
        encoded_url_map = encoded_url_map.split(',');

        var quality_added = [];
        var videos_list_tmp = [];
        var videos_list = [];

        var resolutions = [
            'small', 'medium', 'large', 'hd720', 'hd1080'
        ]
        var resolution_strings = [
            '240p', '360p', '480p', '720p', '1080p'
        ];

        var links = [];
        if (json.args && json.args.hlsvp) {
            var video_item = {
                video_url: escape(json.args.hlsvp),
                quality: "480p",
                format: "hls",
                title: title
            }
            links.push(video_item);
        } else {
            for (url_data_str in encoded_url_map) {
                var url_data = getUrlVars(encoded_url_map[url_data_str]);
                var realUrl = url_data.url + '?',
                    first = true;
                for (i in url_data) {
                    if (i != 'url' && i != 's' && i != 'sig') {
                        if (!first)
                            realUrl += '&' + i + '=' + url_data[i];
                        else {
                            first = false;
                            realUrl += i + '=' + url_data[i];
                        }
                    }
                }
                if (url_data.s) realUrl += '&signature=' + unroll(age, json.assets ? json.assets.js : '', url_data.s);
                if (url_data.sig) realUrl += '&signature=' + unroll(age, json.assets ? json.assets.js : '', url_data.sig);

                var format;
                if (url_data.type)
                    format = unescape(url_data.type).match('video/([^&|;|\\u0026]+)');
                if (format)
                    format = format[1];
                else
                    format = "Unknown";
                var video_item = {
                    video_url: escape(unescape(realUrl)),
                    quality: url_data.quality,
                    format: format,
                    title: title
                };
                links.push(video_item);
                if (service.enableDebug) {
                    page.appendItem(unescape(realUrl), unescape(url_data.type).match(/audio/) ? 'audio' : 'video', {
                        title: (itagToInfo[url_data.itag] ? itagToInfo[url_data.itag] : 'unknown itag') + ' (' + url_data.itag + ')'
                    });
                }
            }
        }

        if (links.length == 0)
            debug("getVideoLinks Couldn't find url map or stream map.");
        videos_list_tmp = links;

        var items = 0;
        for (var i in videos_list_tmp) {
            var item = videos_list_tmp[i];

            if (item.format == "hls") {
                videos_list.push(item);
                continue;
            }

            var j = resolutions.indexOf(item.quality);
            if (service.maximumResolution && j > parseInt(service.maximumResolution) || quality_added.indexOf(item.quality) != -1)
                continue;

            if (service.minimumResolution && j < parseInt(service.minimumResolution))
                break;

            var video_item_tmp = {};

            var formatVar = 'default';
            if (service.format)
                formatVar = service.format;

            if ((formatVar != 'default' && formatVar == item.format) || formatVar == 'default') {
                video_item_tmp = {
                    video_url: escape(item.video_url),
                    quality: resolution_strings[j],
                    format: item.format,
                    title: item.title
                }
                videos_list.push(video_item_tmp);
                quality_added.push(item.quality);
                items++;
            }
        }

        if (videos_list.length == 0)
            return trim(doc.match(/id="unavailable-message" class="message">([\s\S]*?)</)[1]);
        return videos_list;
    }

    function playVideo(page, title, id, video_url) {
        var url = unescape(unescape(video_url));
        var videoParams = {
            title: showtime.entityDecode(unescape(unescape(title))),
            canonicalUrl: plugin.getDescriptor().id + ':video:' + id,
            sources: [{
                url: url
            }],
            subtitles: []
        }

        var subs = unescape(id);
        var re = /\:(.*)\:(.*)/g;
        var match = re.exec(subs);
        while (match) {
            videoParams.subtitles.push({
                url: unescape(match[2]),
                language: unescape(match[1]),
                title: 'External subtitles'
            });
            match = re.exec(subs);
        }

        page.source = "videoparams:" + showtime.JSONEncode(videoParams);
        page.type = "video";
    }

    function e(ex) {
        t(ex);
        t("Line #" + ex.lineNumber);
    }

    function t(message) {
        if (!service.enableDebug) return;
        showtime.trace(message, plugin.getDescriptor().id);
    }

    function p(message) {
        if (!service.enableDebug) return;
        showtime.print(message);
    }

    plugin.addURI(plugin.getDescriptor().id + ":video:(.*)", function(page, id) {
        page.loading = true;
        var extractedId = unescape(id).match(/\/embed\/([^\?|^\&|"]+)/);
        if (!extractedId)
            extractedId = unescape(id).match(/watch\?v=([^\?|^\&|"]+)/);
        if (extractedId) id = extractedId[1];
        page.redirect(plugin.getDescriptor().id + ":video:" + service.mode + ":" + id);
    });

    plugin.addURI(plugin.getDescriptor().id + ":video:simple:(.*)", function(page, id) {
        page.loading = true;
        try {
            var video_url = getVideosList(page, id, 1);

            if (service.enableDebug) {
                page.metadata.title = 'Streams list'
                page.type = 'directory';
                page.loading = false;
                return;
            };

            if (typeof(video_url) == "string") {
                page.error(video_url);
                return;
            }

            if (video_url.length == 0) {
                page.error("No video links found. Try to adjust the minimum/maximum resolutions or Video Format in Settings.");
                return;
            }

            var title = video_url[0].title;
            video_url = video_url[0].video_url;
            //playVideo(page, title, id, video_url);

            page.redirect(plugin.getDescriptor().id + ":video:stream:" + escape(title) + ":" + id + ":" + video_url);
        } catch (err) {
            if (err == "Error: HTTP error: 404")
                err = "The video is unavailable at this moment.";

            e(err);
            page.error(err);
            showtime.trace(err);
            return;
        }

        page.loading = false;
    });

    plugin.addURI(plugin.getDescriptor().id + ":video:simple:(.*):(.*)", function(page, title, id) {
        page.loading = true;
        try {
            var video_url = getVideosList(page, id, 1);
            if (service.enableDebug) {
                page.metadata.title = 'Streams list'
                page.type = 'directory';
                page.loading = false;
                return;
            };
            if (typeof(video_url) == "string") {
                page.error(video_url);
                return;
            }

            if (video_url.length == 0) {
                page.error("No video links found. Try to adjust the minimum/maximum resolutions or Video Format in Settings.");
                return;
            }

            title = video_url[0].title;
            video_url = video_url[0].video_url;
            playVideo(page, title, id, video_url);
        } catch (err) {
            if (err == "Error: HTTP error: 404")
                err = "The video is unavailable at this moment.";

            e(err);
            page.error(err);
            showtime.trace(err);
            return;
        }

        page.loading = false;
    });

    plugin.addURI(plugin.getDescriptor().id + ":video:advanced:(.*)", function(page, id) {
        page.metadata.icon = "http://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
        page.type = "directory";
        page.metadata.glwview = plugin.path + "views/video.view";

        var videoId = id;

        var data = download(page, '/videos', {
            args: {
                "part": "snippet,contentDetails,statistics,status,topicDetails",
                "id": id
            }
        });

        if (data.error) {
            page.error(data.error);
            return;
        }

        pageMenu(page);

        var video = data.items[0];

        var events = false;

        for (var title in apiV3.videos.information) {
            var code = apiV3.videos.information[title];
            if (title == 'Rating') {
                /*page.metadata.rating;
                page.appendPassiveItem("rating", eval(element[1]));*/
            } else {
                page.appendPassiveItem("label", eval(code), {
                    title: title + ": "
                });
            }
        }

        var durationString = video.contentDetails.duration;
        var match = durationString.match(/PT(.+?)M(.+?)S/);
        if (match) {
            var minutes = parseInt(match[1]);
            var seconds = parseInt(match[2]);

            page.appendPassiveItem("label", minutes + ":" + seconds, {
                title: "Duration: "
            });
        }

        page.appendPassiveItem("divider");
        page.appendPassiveItem("bodytext", new showtime.RichText(video.snippet.description));

        var channelId = video.snippet.channelId;
        var author = video.snippet.channelTitle;
        page.appendAction("navopen", plugin.getDescriptor().id + ':channel:' + channelId, true, {
            title: author
        });

        var videos_list = getVideosList(page, id, 'any');
        if (service.enableDebug) {
            page.metadata.title = 'Streams list'
            page.type = 'directory';
            page.loading = false;
            return;
        };
        if (typeof(videos_list) == "string") {
            page.error(videos_list);
        } else {
            var title = videos_list[0].title;
            page.metadata.title = showtime.entityDecode(unescape(title));

            var quality_icon = {
                "240p": plugin.path + "views/img/defaultscreen.bmp",
                "360p": plugin.path + "views/img/defaultscreen.bmp",
                "480p": plugin.path + "views/img/480.bmp",
                "720p": plugin.path + "views/img/720.bmp",
                "1080p": plugin.path + "views/img/1080.bmp"
            };

            var videos = [];
            for (var i in videos_list) {
                var item = videos_list[i];
                page.appendAction("navopen", plugin.getDescriptor().id + ':video:stream:' + escape(title) + ':' + escape(id) + ':' + item.video_url, true, {
                    title: item.quality
                });

                var image = quality_icon[item.quality];
                if (!image || image == "") image = plugin.path + "views/img/nophoto.bmp";
                videos.push({
                    title: item.quality,
                    image: image,
                    url: plugin.getDescriptor().id + ':video:stream:' + escape(title) + ':' + escape(id) + ':' + item.video_url
                });
            }
            page.appendPassiveItem("list", videos, {
                title: "Video Playback"
            });

            var extras = [];
            extras.push({
                title: 'User Profile',
                image: plugin.path + "views/img/logos/user.png",
                url: plugin.getDescriptor().id + ':channel:' + channelId
            });

            for (var i in video.link) {
                var feed = video.link[i];
                if (feed.rel == "http://gdata.youtube.com/schemas/2007#video.trailer-for") {
                    var match = feed.href.match('videos/([^?]*)');
                    if (match) {
                        page.appendAction("navopen", plugin.getDescriptor().id + ':video:' + escape(match[1]), true, {
                            title: 'Movie'
                        });
                        extras.push({
                            title: 'Movie',
                            image: plugin.path + "views/img/logos/movies.png",
                            url: plugin.getDescriptor().id + ':video:' + escape(match[1])
                        });
                    }
                }

                if (feed.rel == "http://gdata.youtube.com/schemas/2007#video.trailers") {
                    page.appendAction("navopen", plugin.getDescriptor().id + ':feed:' + escape(feed.href) + ':Trailers', true, {
                        title: 'Trailers'
                    });
                    extras.push({
                        title: 'Trailers',
                        image: plugin.path + "views/img/logos/trailers.png",
                        url: plugin.getDescriptor().id + ':feed:' + escape(feed.href) + ':Trailers'
                    });
                }
            }

            var params = showtime.JSONEncode({
                args: {
                    "part": "snippet",
                    "type": "video",
                    "relatedToVideoId": id
                }
            });

            page.appendAction("navopen", plugin.getDescriptor().id + ":scraper:/search:" + escape(params) + ':' + escape('Related Videos'), true, {
                title: 'Related videos'
            });
            extras.push({
                title: 'Related',
                image: plugin.path + "views/img/nophoto.bmp",
                url: plugin.getDescriptor().id + ":scraper:/search:" + escape(params) + ':' + escape('Related Videos')
            });

            for (var i in video.link) {
                var link = video.link[i];
                if (link.rel == 'http://gdata.youtube.com/schemas/2007#video.responses') {
                    page.appendAction("navopen", plugin.getDescriptor().id + ':feed:' + escape('https://gdata.youtube.com/feeds/api/videos/' + id + '/responses') + ':' + escape('Response videos'), true, {
                        title: 'Response videos'
                    });
                    extras.push({
                        title: 'Responses',
                        image: plugin.path + "views/img/nophoto.bmp",
                        url: plugin.getDescriptor().id + ':feed:' + escape('https://gdata.youtube.com/feeds/api/videos/' + id + '/responses') + ':Responses'
                    });
                }
            }
            if (extras.length > 0)
                page.appendPassiveItem("list", extras, {
                    title: "Extras"
                });

            page.appendAction("pageevent", "like", true, {
                title: 'Like',
                icon: plugin.path + "views/img/like.png",
                listActions: true
            });
            page.onEvent('like', function() {
                api.like(videoId, "like");
            });

            page.appendAction("pageevent", "dislike", true, {
                title: 'Dislike',
                icon: plugin.path + "views/img/dislike.png",
                listActions: true
            });
            page.onEvent('dislike', function() {
                api.like(videoId, 'dislike');
            });

            page.appendAction("pageevent", "addFavorite", true, {
                title: 'Add to Favorites',
                icon: plugin.path + "views/img/favorite.png",
                listActions: true
            });
            page.onEvent('addFavorite', function() {
                api.addFavorite(videoId);
            });

            page.appendAction("pageevent", "watchLater", true, {
                title: 'Add to Watch Later',
                icon: plugin.path + "views/img/watch_later.png",
                listActions: true
            });
            page.onEvent('watchLater', function() {
                api.watchLater(videoId);
            });

            if (store.refresh_token) {
                page.appendAction("pageevent", "addToPlaylist", true, {
                    title: 'Add to Playlist',
                    icon: plugin.path + "views/img/add.png",
                    listActions: true
                });
                page.onEvent('addToPlaylist', function() {
                    page.redirect(plugin.getDescriptor().id + ':playlist:add:' + escape(showtime.JSONEncode({
                        "videoId": videoId
                    })));
                });
            }

            page.appendAction("pageevent", "comment", true, {
                title: 'Comment',
                icon: plugin.path + "views/img/comment.png",
                listActions: true
            });
            page.onEvent('comment', function() {
                api.comment(videoId);
            });
            page.appendPassiveItem("video", '', {
                title: 'Comment',
                icon: plugin.path + "views/img/comment.png"
            });
        }

        events = true;
        page.loading = false;
    });

    plugin.addURI(plugin.getDescriptor().id + ":playlist:add:(.*)", function(page, args0) {
        args0 = showtime.JSONDecode(unescape(args0));
        if (args0.playlistId) {
            if (apiV3.playlistItems.insert(args0.playlistId, args0.videoId)) {
                showtime.notify("Video added successfully", 2);
            } else {
                showtime.notify("There was one error while trying to add video", 3);
            }
            //page.redirect(args0.referrer);
            page.redirect(plugin.getDescriptor().id + ":channel:mine");
        } else {
            pageControllerAddToPlaylist(page, args0, function(nextPageToken) {
                var args = {
                    "part": "snippet",
                    "mine": "true",
                    "maxResults": 50
                };
                if (nextPageToken)
                    args.pageToken = nextPageToken;
                var data = apiV3.playlists.list(args);
                data = data.response;

                return data;
            });
        }
    });

    // We need to use this function so we can pass the correct title of video
    plugin.addURI(plugin.getDescriptor().id + ":video:stream:(.*):(.*):(.*)", function(page, title, id, video_url) {
        playVideo(page, title, id, video_url);
    });

    function getTime(date) {
        var time = date.match('(.*)-(.*)-(.*)T(.*):(.*):(.*)..*Z');
        if (time) {
            var dateVar = new Date(time[1], time[2], time[3], time[4], time[5], time[6]);
            return dateVar;
        }
        return -1;
    }

    function getDefaultCaptionLink(id) {
        var data = showtime.httpGet('http://www.youtube.com/watch?v=' + id).toString();

        var cc_init = data.indexOf('ttsurl=');
        if (cc_init == -1)
            return null;

        var cc_end = data.indexOf('\\u0026amp;', cc_init);
        if (cc_end == -1)
            return null;

        var caption = unescape(data.slice(cc_init + 7, cc_end));
        return caption;
    }

    function getValue(url, start_string, end_string) {
        var begin_temp = url.indexOf(start_string) + start_string.toString().length;
        var end_temp = url.indexOf(end_string, begin_temp);

        var string = url.slice(begin_temp, end_temp);
        return unescape(string);
    }

    function itemOptions(item, entry) {
        // TODO: Maximum resolution to be played

        item.addOptURL("More from this user", plugin.getDescriptor().id + ':more:username:' + item.author);

        item.addOptAction("Like video", "like");
        item.onEvent('like', function(item) {
            api.like(this.id, "like");
        });

        item.addOptAction("Dislike video", "dislike");
        item.onEvent('dislike', function(item) {
            api.like(this.id, 'dislike')
        });

        item.addOptAction("Comment video", "comment");
        item.onEvent('comment', function(item) {
            api.comment(this.id)
        });

        item.addOptAction("Add to Favorites", "addFavorite");
        item.onEvent('addFavorite', function(item) {
            api.addFavorite(this.id)
        });

        item.addOptAction("Add to Watch Later", "watchLater");
        item.onEvent('watchLater', function(item) {
            api.watchLater(this.id)
        });

        if (store.refresh_token) {
            var params = {
                args: {
                    "videoId": item.id
                }
            };
            item.addOptURL("Add to Playlist", plugin.getDescriptor().id + ':playlist:add:' + escape(showtime.JSONEncode(params)));
        }

        for (var i in entry.link) {
            var link = entry.link[i];

            if (link.rel == "http://gdata.youtube.com/schemas/2007#video.related") {
                item.addOptURL("Related", plugin.getDescriptor().id + ':feed:' + escape(link.href) + ':Related');
            }

            if (link.rel == "http://gdata.youtube.com/schemas/2007#video.responses") {
                item.addOptURL("Responses", plugin.getDescriptor().id + ':feed:' + escape(link.href) + ':Responses');
            }

            if (link.rel == "http://gdata.youtube.com/schemas/2007#video.trailer-for") {
                var match = link.href.match('videos/([^?]*)');
                if (match) {
                    item.addOptURL("Redirect to Movie", plugin.getDescriptor().id + ':video:' + escape(match[1]));
                }
            }

            if (link.rel == "http://gdata.youtube.com/schemas/2007#video.trailers") {
                item.addOptURL("Trailers", plugin.getDescriptor().id + ':feed:' + escape(link.href) + ':Trailers');
            }

            if (link.rel == "http://gdata.youtube.com/schemas/2007#video.show") {
                item.addOptURL("Redirect to Show", plugin.getDescriptor().id + ':feed:' + escape(link.href + "/content") + ':' + escape('Redirect to Show'));
            }

            if (link.rel == "http://gdata.youtube.com/schemas/2007#video.season") {
                item.addOptURL("Redirect to Season", plugin.getDescriptor().id + ':feed:' + escape(link.href + "/episodes") + ':' + escape('Redirect to Season'));
            }
        }
    }

    function sort(items, field, reverse) {
        if (items.length == 0) return null;

        var its = [];
        for (var i in items) {
            items[i].orig_index = i;
            its.push(items[i]);
        }
        its.sort(function(a, b) {
            if (!b[field]) return null;
            return b[field] > a[field]
        });
        if (reverse) its.reverse();

        return its;
    }

    function pageUpdateItemsPositions(its) {
        for (var i in its) {
            items[its[i].orig_index].moveBefore(i);
        }
    }

    function pageMenu(page) {
        page.metadata.background = plugin.path + "views/img/background.png";
        page.metadata.backgroundAlpha = 0.5;

        //page.metadata.font = "default";

        page.appendAction("navopen", plugin.getDescriptor().id + ":search", true, {
            title: "Search",
            icon: plugin.path + "views/img/search.png"
        });
        page.appendAction("pageevent", "sortDateDec", true, {
            title: "Sort by Date (Decrementing)",
            icon: plugin.path + "views/img/sort_date_dec.png"
        });
        page.appendAction("pageevent", "sortViewsDec", true, {
            title: "Sort by Views (Decrementing)",
            icon: plugin.path + "views/img/sort_views_dec.png"
        });
        page.appendAction("pageevent", "sortAlphabeticallyInc", true, {
            title: "Sort Alphabetically (Incrementing)",
            icon: plugin.path + "views/img/sort_alpha_inc.png"
        });
        page.appendAction("pageevent", "sortAlphabeticallyDec", true, {
            title: "Sort Alphabetically (Decrementing)",
            icon: plugin.path + "views/img/sort_alpha_dec.png"
        });
        page.appendAction("pageevent", "sortDefault", true, {
            title: "Sort as Default",
            icon: plugin.path + "views/img/sort_default.png"
        });

        var sorts = [
            ["sortAlphabeticallyInc", "Alphabetically (A->Z)"],
            ["sortAlphabeticallyDec", "Alphabetically (Z->A)"],
            ["sortViewsDec", "Views (decrementing)"],
            ["sortDateDec", "Published (decrementing)"],
            ["sortDefault", "Default", true]
        ];

        page.options.createMultiOpt("sort", "Sort by...", sorts, function(v) {
            eval(v + "()");
        });

        function sortAlphabeticallyInc() {
            var its = sort(items, "title", true);
            pageUpdateItemsPositions(its);
        }

        function sortAlphabeticallyDec() {
            var its = sort(items, "title", false);
            pageUpdateItemsPositions(its);
        }

        function sortViewsDec() {
            var its = sort(items, "views", false);
            pageUpdateItemsPositions(its);
        }

        function sortDateDec() {
            var its = sort(items, "date", false);
            pageUpdateItemsPositions(its);
        }

        function sortDefault() {
            for (var i in items_tmp) {
                if (!items_tmp[i].orig_index) continue;
                items[i].moveBefore(items_tmp[i].orig_index);
            }
        }

        page.onEvent('sortAlphabeticallyInc', function() {
            sortAlphabeticallyInc();
        });

        page.onEvent('sortAlphabeticallyDec', function() {
            sortAlphabeticallyDec();
        });

        page.onEvent('sortViewsDec', function() {
            sortViewsDec();
        });

        page.onEvent('sortDateDec', function() {
            sortDateDec();
        });

        page.onEvent('sortDefault', function() {
            sortDefault();
        });
    }

    function setVideoItemOptions(item, page) {
        if (item.channelId)
            item.addOptURL("More from this channel", plugin.getDescriptor().id + ':channel:' + item.channelId);

        if (item.videoId) {
            item.addOptAction("Like video", "like");
            item.onEvent('like', function(item) {
                api.like(this.videoId, "like");
            });

            item.addOptAction("Dislike video", "dislike");
            item.onEvent('dislike', function(item) {
                api.like(this.videoId, 'dislike')
            });

            item.addOptAction("Comment video", "comment");
            item.onEvent('comment', function(item) {
                api.comment(this.videoId)
            });

            item.addOptAction("Add to Favorites", "addFavorite");
            item.onEvent('addFavorite', function(item) {
                api.addFavorite(this.videoId)
            });

            item.addOptAction("Add to Watch Later", "watchLater");
            item.onEvent('watchLater', function(item) {
                api.watchLater(this.videoId)
            });

            var params = {
                args: {
                    "part": "snippet",
                    "type": "video",
                    "relatedToVideoId": item.videoId
                }
            };

            item.addOptURL("Related Videos", plugin.getDescriptor().id + ":scraper:/search:" + escape(showtime.JSONEncode(params)) + ':' + escape('Related Videos'));

            if (store.refresh_token) {
                var params = {
                    args: {
                        "videoId": item.videoId
                    }
                };
                item.addOptURL("Add to Playlist", plugin.getDescriptor().id + ':playlist:add:/search:' + escape(showtime.JSONEncode(params)));
            }
        }
    }

    function addVideoItem(page, entry, metadata) {
        var item = page.appendItem(plugin.getDescriptor().id + ":video:" + entry.videoId, "video", metadata);
        for (var i in entry)
            item[i] = entry[i];
        setVideoItemOptions(item, page);
        return item;
    }

    function login(force) {
        if (!force && store.refresh_token)
            return true;

        var response = showtime.JSONDecode(showtime.httpReq("https://accounts.google.com/o/oauth2/device/code", {
            postdata: {
                'client_id': client_id,
                'scope': 'https://www.googleapis.com/auth/youtube'
            }
        }).toString());

        var msg = 'Time limit: ' + parseInt(response.expires_in) / 60 + ' minutes.\nWebsite: ' + response.verification_url + '\nUser Code: ' + response.user_code +
            '\n\n1. In a computer with Internet access, navigate to ' + response.verification_url +
            '\n2. It should show the Google logo and a box requesting a code from the device, \nin that box type the user code specified above' +
            '\n3. If everything goes well, you should get to a page stating that Showtime Plugin Youtube \nrequests permission to access to the account.\n' +
            'If you want to use your account in Youtube, you have to authorize that access.' +
            '\n4. In case you accept, you should see a page stating that you authorized Showtime Plugin Youtube. \nCongratulations, now you can use the plugin fully, enjoy it.';

        if (showtime.message(msg, true, false)) {
            var response = showtime.JSONDecode(showtime.httpReq("https://accounts.google.com/o/oauth2/token", {
                postdata: {
                    'client_id': client_id,
                    'client_secret': client_secret,
                    'code': response.device_code,
                    'grant_type': 'http://oauth.net/grant_type/device/1.0'
                }
            }).toString());

            if (response.error) {
                showtime.notify("Authentication failed: " + response.error, 3, "");
                store.refresh_token = false;
                return false;
            }

            store.refresh_token = response.refresh_token;
            store.access_token = response.access_token;
            store.token_type = response.token_type;
            showtime.notify('Authenticated successfully', 2);
        }
        //setHeaders();
        return true;
    }

    plugin.addURI(plugin.getDescriptor().id + ":myactivity", function(page) {
        if (!store.refresh_token) {
            if (!login())
                page.error('You need to be logged to Youtube to see your activities.');
            return;
        }
        setPageHeader(page, 'My Activity');
        scraper(page, '/activities', {
            args: {
                "part": "snippet,contentDetails",
                "home": true
            }
        });
    });

    plugin.addURI(plugin.getDescriptor().id + ":start", function(page) {
        pageMenu(page);
        page.metadata.glwview = plugin.path + "views/array2.view";
        page.type = "directory";
        page.contents = "items";
        page.metadata.logo = logo;
        page.metadata.title = "Youtube - Home Page";
        page.loading = false;

        var items = [];

        items.push(page.appendItem(plugin.getDescriptor().id + ':myactivity', 'directory', {
            title: 'My Activity',
            icon: plugin.path + "views/img/logos/top2.png"
        }));

        items.push(page.appendItem(plugin.getDescriptor().id + ':scraper:/guideCategories:' + escape(showtime.JSONEncode({
            args: {
                "part": "snippet",
                "regionCode": service.region,
                "hl": service.language
            }
        })) + ':' + escape('Guide Categories'), 'directory', {
            title: 'Guide Categories',
            icon: plugin.path + "views/img/logos/explore.png"
        }));

        items.push(page.appendItem(plugin.getDescriptor().id + ':scraper:/videoCategories:' + escape(showtime.JSONEncode({
            args: {
                'part': 'snippet',
                'regionCode': service.region,
                'hl': service.language
            }
        })) + ':' + escape('Video Categories'), 'directory', {
            title: 'Video Categories',
            icon: plugin.path + "views/img/logos/explore.png"
        }));

        items.push(page.appendItem(plugin.getDescriptor().id + ':scraper:/videos:' + escape(showtime.JSONEncode({
            args: {
                'part': 'snippet,contentDetails,statistics,status',
                'chart': 'mostPopular',
                'maxResults': 50,
                'regionCode': service.region
            }
        })) + ':' + escape('Most Popular'), 'directory', {
            title: 'Most poular',
            icon: plugin.path + "views/img/logos/feeds.png"
        }));
        items.push(page.appendItem(plugin.getDescriptor().id + ':scraper:/search:' + escape(showtime.JSONEncode({
            args: {
                "part": "snippet",
                'regionCode': service.region,
                'safeSearch': service.safeSearch,
                'maxResults': 50,
                "type": "channel"
            }
        })) + ':' + escape('Channels'), 'directory', {
            title: 'Channels',
            icon: plugin.path + "views/img/logos/channels.png"
        }));

        items.push(page.appendItem(plugin.getDescriptor().id + ':scraper:/search:' + escape(showtime.JSONEncode({
            args: {
                "part": "snippet",
                'regionCode': service.region,
                'safeSearch': service.safeSearch,
                'maxResults': 50,
                "type": "channel",
                "q": "Education"
            }
        })) + ':' + escape('Education'), 'directory', {
            title: 'Education',
            icon: plugin.path + "views/img/logos/edu.png"
        }));

        items.push(page.appendItem(plugin.getDescriptor().id + ':scraper:/search:' + escape(showtime.JSONEncode({
            args: {
                "part": "snippet",
                'regionCode': service.region,
                'safeSearch': service.safeSearch,
                'maxResults': 50,
                "eventType": "live",
                "type": "video"
            }
        })) + ':' + escape('Live Broadcasts'), 'directory', {
            title: 'Live Broadcasts',
            icon: plugin.path + "views/img/logos/live.png"
        }));

        items.push(page.appendItem(plugin.getDescriptor().id + ':scraper:/search:' + escape(showtime.JSONEncode({
            args: {
                "part": "snippet",
                'regionCode': service.region,
                'safeSearch': service.safeSearch,
                'maxResults': 50,
                "type": "video",
                "videoDuration": "long",
                "videoType": "movie",
                //"videoCaption": "closedCaption"
            }
        })) + ':' + escape('Youtube Movies'), 'directory', {
            title: 'Youtube Movies',
            icon: plugin.path + "views/img/logos/movies.png"
        }));

        items.push(page.appendItem(plugin.getDescriptor().id + ':scraper:/search:' + escape(showtime.JSONEncode({
            args: {
                "part": "snippet",
                'regionCode': service.region,
                'safeSearch': service.safeSearch,
                'maxResults': 50,
                "type": "channel",
                "channelType": "show"
            }
        })) + ':' + escape('Youtube Shows'), 'directory', {
            title: 'Youtube Shows',
            icon: plugin.path + "views/img/logos/shows.png"
        }));

        items.push(page.appendItem(plugin.getDescriptor().id + ':channel:mine', 'directory', {
            title: 'User Profile',
            icon: plugin.path + "views/img/logos/user.png"
        }));

        for (var i in items)
            items[i].id = i;

        if (!main_menu_order.order) {
            var items_tmp = page.getItems();
            for (var i = 0; i < items_tmp.length; i++)
                if (!items_tmp[i].id)
                    delete items_tmp[i];
            main_menu_order.order = showtime.JSONEncode(items_tmp);
        }

        var order = showtime.JSONDecode(main_menu_order.order);
        for (var i in order)
            items[order[i].id].moveBefore(i);

        page.reorderer = function(item, before) {
            item.moveBefore(before);
            var items = page.getItems();
            for (var i = 0; i < items.length; i++)
                if (!items[i].id)
                    delete items[i];
            main_menu_order.order = showtime.JSONEncode(items);
        };
    });

    function setHeaders() {
        plugin.addHTTPAuth('https://youtube.com.*', function(req) {
            req.setHeader('Authorization', store.token_type + ' ' + store.access_token);
        });
        headersAreSet = true;
    };

    function download(page, url, params) {
        if (page)
            page.loading = true;

        params.args.key = key;
        showtime.print(url + ' ' + showtime.JSONEncode(params.args));

        var data;

        if (params.args.mine || params.args.home || params.postdata || params.method) { // auth requests
            params.headers = {
                'Authorization': store.token_type + ' ' + store.access_token
            };
            if (params.postdata)
                params.headers['Content-Type'] = 'application/json';

            try {
                data = showtime.JSONDecode(showtime.httpReq(API + url, params));
            } catch (err) {
                showtime.print(err);
                showtime.print('Refreshing access_token');
                data = showtime.httpReq('https://www.googleapis.com/oauth2/v3/token', {
                    postdata: {
                        client_id: client_id,
                        client_secret: client_secret,
                        refresh_token: store.refresh_token,
                        grant_type: 'refresh_token'
                    }
                });
                store.access_token = showtime.JSONDecode(data).access_token;
                //setHeaders();
                params.headers['Authorization'] = store.token_type + ' ' + store.access_token;
                try {
                    data = showtime.JSONDecode(showtime.httpReq(API + url, params));
                } catch (err) {
                    if (page)
                        page.loading = false;
                    return err;
                }
            }
        } else { // no auth request
            try {
                data = showtime.JSONDecode(showtime.httpReq(API + url, params));
            } catch (err) {
                if (page)
                    page.loading = false;
                return err;
            }
        }
        if (page)
            page.loading = false;
        return data;
    }

    plugin.addURI(plugin.getDescriptor().id + ":scraper:(.*):(.*):(.*)", function(page, url, params, title) {
        //setPageHeader(page, title);
        page.type = "directory";
        page.contents = "items";
        page.metadata.logo = logo;
        page.metadata.title = new showtime.RichText(unescape(showtime.entityDecode(title)));
        page.metadata.background = plugin.path + "views/img/background.png";
        print(showtime.JSONDecode(unescape(params)));
        scraper(page, url, showtime.JSONDecode(unescape(params)));
    });

    function durationToString(s) {
        var duration = 0;
        if (s.match(/H/)) {
            duration += 3600 * s.match(/PT(.*)H/)[1];
            if (s.match(/H(.*)M/))
                duration += 60 * s.match(/H(.*)M/)[1];
            if (s.match(/M(.*)S/))
                duration += +s.match(/M(.*)S/)[1];
            return showtime.durationToString(duration);
        }
        if (s.match(/M/)) {
            duration += 60 * s.match(/PT(.*)M/)[1];
            if (s.match(/M(.*)S/))
                duration += +s.match(/M(.*)S/)[1];
            return showtime.durationToString(duration);
        }
        return showtime.durationToString(+s.match(/PT(.*)S/)[1]);
    }

    function addSortHeader(page, url, params) {
        if (url == '/search') {
            var addParams = JSON.parse(JSON.stringify(params));
            addParams.args.order = 'date';
            page.appendItem(plugin.getDescriptor().id + ':scraper:/search:' +
                escape(showtime.JSONEncode(addParams)) + ':' + escape('Order by Date'), "directory", {
                    title: 'Order by Date'
                });
            addParams.args.order = 'rating';
            page.appendItem(plugin.getDescriptor().id + ':scraper:/search:' +
                escape(showtime.JSONEncode(addParams)) + ':' + escape('Order by Rating'), "directory", {
                    title: 'Order by Rating'
                });
            addParams.args.order = 'relevance';
            page.appendItem(plugin.getDescriptor().id + ':scraper:/search:' +
                escape(showtime.JSONEncode(addParams)) + ':' + escape('Order by Relevance'), "directory", {
                    title: 'Order by Relevance (default)'
                });
            addParams.args.order = 'videoCount';
            page.appendItem(plugin.getDescriptor().id + ':scraper:/search:' +
                escape(showtime.JSONEncode(addParams)) + ':' + escape('Order by Video count'), "directory", {
                    title: 'Order by Video count'
                });
            addParams.args.order = 'viewCount';
            page.appendItem(plugin.getDescriptor().id + ':scraper:/search:' +
                escape(showtime.JSONEncode(addParams)) + ':' + escape('Order by View count'), "directory", {
                    title: 'Order by View count'
                });
        }
    }

    function scraper(page, url, params) {
        page.entries = 0;
        var tryToSearch = true;
        addSortHeader(page, url, params);

        function paginator() {
            if (!tryToSearch) return false;
            var data = download(page, url, params);
            //showtime.print(showtime.JSONEncode(data));
            if (!page.entries && !data.items.length) {
                page.appendPassiveItem('directory', '', {
                    title: 'This feed does not contain any item.'
                });
                return tryToSearch = false;
            }

            if (!page.entries && data.pageInfo && page.metadata)
                page.metadata.title += ' (' + data.pageInfo.totalResults + ')'

            var c = 0;

            for (var i in data.items) {
                var entry = data.items[i];
                var metadata = {};
                //showtime.print(showtime.JSONEncode(entry));
                if (entry.contentDetails) {
                    if (entry.contentDetails.definition)
                        metadata.hd = entry.contentDetails.definition == "hd";
                    if (entry.contentDetails.duration)
                        metadata.duration = metadata.runtime = durationToString(entry.contentDetails.duration);
                }

                if (entry.statistics) {
                    metadata.views = entry.statistics.viewCount;
                    metadata.favorites = entry.statistics.favoriteCount;
                    if (entry.statistics.likeCount) {
                        metadata.likes = parseInt(entry.statistics.likeCount);
                        metadata.dislikes = parseInt(entry.statistics.dislikeCount);
                        metadata.likesPercentage = Math.round((metadata.likes /
                            (metadata.likes + metadata.dislikes)) * 100);
                        metadata.likesPercentage_str = metadata.likesPercentage + '%';
                        metadata.rating = metadata.likesPercentage;
                    }
                }
                //showtime.print(showtime.JSONEncode(entry));
                if (entry.snippet.thumbnails)
                    metadata.icon = entry.snippet.thumbnails.default.url;

                var title = entry.snippet.title;
                if (metadata.duration)
                    title += ' (' + metadata.duration + ')';
                if (metadata.likesPercentage)
                    title += '<font color="99CC66"> (' + metadata.likesPercentage + '%)</font>';
                metadata.title = new showtime.RichText(title);

                var subtitle1 = '<font color="66CCFF">';
                if (metadata.views)
                    subtitle1 += 'Views: ' + metadata.views;
                if (metadata.views && metadata.favorites)
                    subtitle1 += ' | ';
                if (metadata.favorites)
                    subtitle1 += 'Favorites: ' + metadata.favorites;
                if (metadata.likesPercentage_str && (metadata.views || metadata.favorites))
                    subtitle1 += ' | ';
                if (metadata.likesPercentage_str)
                    subtitle1 += 'Likes: ' + metadata.likesPercentage_str;
                subtitle1 += '</font>';

                if (entry.snippet.publishedAt) {
                    var dateInfo = '';
                    metadata.published = entry.snippet.publishedAt.split('.')[0].split('T')[0] + ' ' + entry.snippet.publishedAt.split('.')[0].split('T')[1];
                    if (metadata.published) {
                        dateInfo = 'Published ';
                        if (entry.snippet.channelTitle)
                            dateInfo += 'by <font color="FFFF00">' + entry.snippet.channelTitle + '</font>';
                        dateInfo += '<font color="99CC33"> ' + metadata.published;
                    }
                }
                if (metadata.updated) {
                    if (metadata.published)
                        dateInfo += ' | ';
                    dateInfo += 'Updated ' + metadata.updated;
                }

                var desc = '';
                if (entry.snippet.description)
                    desc = entry.snippet.description;

                var lines = '';
                var desc_split = desc.split("\n");
                for (var i = 0; i < desc_split.length && i < 2; i++)
                    lines += desc_split[i] + "\n";

                metadata.description = new showtime.RichText(subtitle1 + "\n" + '<font color="99CC33">' +
                    dateInfo + '</font>\n' + '<font color="EEEEEE">' + lines + '</font>');

                var images = [];
                images.push({
                    width: 400,
                    height: 400,
                    url: metadata.icon
                });
                images.push({
                    width: 20,
                    height: 20,
                    url: plugin.path + "views/img/nophoto.bmp"
                });
                images = "imageset:" + showtime.JSONEncode(images);
                metadata.icon = images;
                showtime.print(entry.kind + (entry.id.kind ? ' - ' + entry.id.kind : ''));
                //showtime.print(showtime.JSONEncode(entry));
                if (entry.kind == "youtube#activity") {
                    var title = entry.snippet.title;
                    var type = entry.snippet.type;
                    var channelTitle = entry.snippet.channelTitle;
                    var cParams = entry.contentDetails[type];
                    metadata.title = '[' + type + '] ' + title;
                    showtime.print(showtime.JSONEncode(cParams));
                    if (cParams.resourceId)
                        var resourceId = entry.contentDetails[type].resourceId.kind;
                    if (resourceId == "youtube#video" || !cParams.resourceId) {
                        var item = addVideoItem(page, {
                            videoId: cParams.resourceId ? cParams.resourceId.videoId : cParams.videoId,
                            channelId: entry.snippet.channelId
                        }, metadata);
                    } else if (resourceId == "youtube#playlist") {
                        var playlistId = entry.contentDetails[type].resourceId.playlistId;
                        var item = page.appendItem(plugin.getDescriptor().id + ":scraper:/playlistItems:" + escape(showtime.JSONEncode({
                                args: {
                                    "part": "snippet,contentDetails,status",
                                    "playlistId": playlistId
                                }
                            })) + ':' + escape('Recommended Videos'), "directory",
                            metadata);
                    } else if (resourceId == "youtube#channel") {
                        var channelId = entry.contentDetails[type].resourceId.channelId;
                        var item = page.appendItem(plugin.getDescriptor().id + ':channel:' + channelId, "directory", metadata);
                    }
                } else if (entry.kind == "youtube#guideCategory") { // category guide list
                    var item = page.appendItem(plugin.getDescriptor().id + ":scraper:/channels:" + escape(showtime.JSONEncode({
                        args: {
                            'part': 'snippet,contentDetails,statistics,status',
                            'categoryId': entry.id,
                            'maxResults': 50
                        }
                    })) + ':' + escape(title), "directory", metadata);
                } else if (entry.kind == "youtube#videoCategory") { // of home screen
                    var item = page.appendItem(plugin.getDescriptor().id + ":scraper:/search:" + escape(showtime.JSONEncode({
                        args: {
                            'part': 'snippet',
                            'regionCode': service.region,
                            'safeSearch': service.safeSearch,
                            'maxResults': 50,
                            'videoCategoryId': entry.id,
                            'type': 'video'
                        }
                    })) + ':' + escape(title), "directory", metadata);
                } else if (entry.kind == "youtube#playlistItem") { // shows videos of playlist
                    if (entry.snippet.resourceId.kind == "youtube#video") {
                        var item = addVideoItem(page, {
                            videoId: entry.snippet.resourceId.videoId
                        }, metadata);
                    }
                } else if (entry.kind == "youtube#channel") {
                    var item = page.appendItem(plugin.getDescriptor().id + ':channel:' + entry.id, "video", metadata);
                } else if (entry.kind == "youtube#playlist") { // playlists of a channel
                    var item = page.appendItem(plugin.getDescriptor().id + ":scraper:" + '/playlistItems:' + escape(showtime.JSONEncode({
                        args: {
                            "part": "snippet,contentDetails,status",
                            "playlistId": entry.id
                        }
                    })) + ':' + escape(title), "video", metadata);
                } else if (entry.kind == "youtube#video") {
                    var item = addVideoItem(page, {
                        videoId: entry.id
                    }, metadata);
                } else if (entry.id.kind == "youtube#channel") { // of searcher
                    var item = page.appendItem(plugin.getDescriptor().id + ':channel:' + entry.id.channelId, "video", metadata);
                } else if (entry.id.kind == "youtube#playlist") { // of searcher
                    var item = page.appendItem(plugin.getDescriptor().id + ":scraper:" + '/playlistItems:' + escape(showtime.JSONEncode({
                        args: {
                            "part": "snippet,contentDetails,status",
                            "playlistId": entry.id.playlistId
                        }
                    })) + ':' + escape(title), "video", metadata);
                } else if (entry.id.kind == "youtube#video") { // of searcher
                    var item = addVideoItem(page, {
                        videoId: entry.id.videoId
                    }, metadata);
                }
                c++;
                item.index = c;
                item.title = entry.title;
                if (metadata.views)
                    item.views = parseInt(metadata.views);
                if (entry.snippet.publishedAt)
                    item.date = getTime(entry.snippet.publishedAt).getTime();
                page.entries++;
            }
            if (!data.nextPageToken)
                return tryToSearch = false;
            params.args.pageToken = data.nextPageToken;
            return true;
        }
        paginator();
        page.paginator = paginator;
    }

    plugin.addSearcher(plugin.getDescriptor().title + ' - Videos', logo, function(page, query) {
        scraper(page, '/search', {
            args: {
                'part': 'snippet',
                'regionCode': service.region,
                'safeSearch': service.safeSearch,
                'maxResults': 50,
                'type': 'video',
                'q': query
            }
        });
    });

    plugin.addSearcher(plugin.getDescriptor().title + ' - Channels', logo, function(page, query) {
        scraper(page, '/search', {
            args: {
                'part': 'snippet',
                'regionCode': service.region,
                'safeSearch': service.safeSearch,
                'maxResults': 50,
                'type': 'channel',
                'q': query
            }
        });
    });

    plugin.addSearcher(plugin.getDescriptor().title + ' - Playlists', logo, function(page, query) {
        scraper(page, '/search', {
            args: {
                'part': 'snippet',
                'regionCode': service.region,
                'safeSearch': service.safeSearch,
                'maxResults': 50,
                'type': 'playlist',
                'q': query
            }
        });
    });
})(this);