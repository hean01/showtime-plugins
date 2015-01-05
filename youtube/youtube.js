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
        page.metadata.background = plugin.path + "views/img/background.png";
        page.metadata.backgroundAlpha = 0.5;
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
    page.loading = true;
        showtime.notify('Logging to Youtube. Please wait...', 3);
        var response = showtime.JSONDecode(showtime.httpReq("https://accounts.google.com/o/oauth2/device/code", {
            postdata: {
                'client_id': client_id,
                'scope': 'https://www.googleapis.com/auth/youtube'
            }
        }).toString());

        var msg = 'Time limit: ' + parseInt(response.expires_in) / 60 + ' minutes.\nWebsite: ' + response.verification_url + '\nUser Code: ' + response.user_code +
            '\n\n1. On a computer with Internet access, navigate browser to ' + response.verification_url +
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
            showtime.notify('Authenticated successfully', 3);
        }
        return true;
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
            data = download(null, API + '/i18nLanguages', {
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
            data = download(null, API + '/i18nRegions', {
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

    settings.createBool("mode", "Open additional videoinfo page", false, function(v) {
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


    settings.createDivider("My Channel");
    settings.createBool("showActivities", "Show Activities", true, function(v) {
        service.showActivities = v;
    });
    settings.createBool("showWatchLater", "Show Watch Later", true, function(v) {
        service.showWatchLater = v;
    });
    settings.createBool("showWatchHistory", "Show Watch History", true, function(v) {
        service.showWatchHistory = v;
    });
    settings.createBool("showLikes", "Show Likes", true, function(v) {
        service.showLikes = v;
    });
    settings.createBool("showSubscriptions", "Show Subscriptions", true, function(v) {
        service.showSubscriptions = v;
    });
    settings.createBool("showPlaylists", "Show Playlists", true, function(v) {
        service.showPlaylists = v;
    });
    settings.createBool("showUploads", "Show Uploads", true, function(v) {
        service.showUploads = v;
    });
    settings.createBool("showFavorites", "Show Favorites", true, function(v) {
        service.showFavorites = v;
    });

    settings.createDivider("Debug");
    settings.createBool("enableDebug", "Enable debug logging", false, function(v) {
        service.enableDebug = v;
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
                        'regionCode': service.region,
                        'safeSearch': service.safeSearch,
                        'maxResults': 50,
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
                'regionCode': service.region,
                'safeSearch': service.safeSearch,
                'maxResults': 50,
                'type': type,
                'q': query
            }
        })) + ':' + escape(query));
    });

    plugin.addURI(plugin.getDescriptor().id + ":search", function(page) {
        page.metadata.background = plugin.path + "views/img/background.png";
        page.metadata.backgroundAlpha = 0.5;
        page.metadata.glwview = plugin.path + "views/search.view";
        page.type = "directory";
        page.contents = "items";
        page.metadata.title = 'Youtube Search';
        page.metadata.logo = logo;
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

    function getItems(items, filter) {
        var arr = [];
        for (var i in items) {
            var it = items[i];
            if (filter && it.snippet.type && it.snippet.type != filter)
                continue;
            var title = (it.snippet.type ? it.snippet.type :(it.snippet.title ? it.snippet.title : it.snippet.channelTitle));
            if (filter)
                title = (it.snippet.title ? it.snippet.title : it.snippet.channelTitle)

            var args = {
                title: title,
                image: it.snippet.thumbnails ? it.snippet.thumbnails.default.url : plugin.path + "views/img/nophoto.png"
            };
            if (it.kind == "youtube#playlistItem" && it.snippet.resourceId.kind == "youtube#video")
                args.url = plugin.getDescriptor().id + ":video:" + it.snippet.resourceId.videoId;
            else if (it.kind == "youtube#playlist") {
                if (it.contentDetails && !it.contentDetails.itemCount) // Don't show empty playlists
                    continue;

                var params = {
                    args: {
                        'part': 'snippet,contentDetails,status',
                        'playlistId': it.id,
                        'maxResults': 50
                    }
                };
                if (store.refresh_token)
                   params.method = 'GET';
                args.url = plugin.getDescriptor().id + ":scraper:/playlistItems:" + escape(showtime.JSONEncode(params)) + ':' + escape(it.snippet.title);
            } else if (it.kind == "youtube#subscription" && it.snippet.resourceId.kind == "youtube#channel") {
                args.url = plugin.getDescriptor().id + ":channel:" + it.snippet.resourceId.channelId;
            } else if (it.kind == "youtube#activity") {
                if (!it.contentDetails)
                    continue;
                if (it.contentDetails[it.snippet.type].resourceId) {// bs channels
                    if (it.contentDetails[it.snippet.type].resourceId.kind == "youtube#video") {
                        args.url = plugin.getDescriptor().id + ":video:" + it.contentDetails[it.snippet.type].resourceId.videoId;
                    } else if (it.contentDetails[it.snippet.type].resourceId.kind == "youtube#channel") {
                        args.url = plugin.getDescriptor().id + ":channel:" + it.contentDetails[it.snippet.type].resourceId.channelId;
                    } else if (it.contentDetails[it.snippet.type].resourceId.kind == "youtube#playlist") {
                        var params = {
                            args: {
                                'part': 'snippet,contentDetails,status',
                                'playlistId': it.contentDetails[it.snippet.type].resourceId.playlistId,
                                'maxResults': 50
                            }
                        };
                        if (store.refresh_token)
                           params.method = 'GET';
                        args.url = plugin.getDescriptor().id + ":scraper:/playlistItems:" + escape(showtime.JSONEncode(params)) + ':' + escape(it.snippet.title);
                    }
                } else {
                       args.url = plugin.getDescriptor().id + ":video:" + it.contentDetails[it.snippet.type].videoId;
                }
            }
            arr.push(args);
        }
        return arr;
    }

    function parseChannelId(username) {
        var data = download(page, API + '/channels', {
            args: {
                "part": "id",
                "forUsername": username
            }
        });
        if (!data.items.length)
            return username;
        return data.items[0].id;
    }

    plugin.addURI(plugin.getDescriptor().id + ":feed:(.*)", function(page, param) {
        var username = unescape(param).toString().match(/https:\/\/gdata\.youtube\.com\/feeds\/api\/users\/([\s\S]*?)\//);
        if (username)
            page.redirect(plugin.getDescriptor().id + ":channel:" + parseChannelId(username[1]));
    });

    plugin.addURI(plugin.getDescriptor().id + ":user:username:(.*)", function(page, username) {
        page.redirect(plugin.getDescriptor().id + ":channel:" + parseChannelId(username));
    });

    function print(data) {
        showtime.print(showtime.JSONEncode(data));
    }

    function t(data) {
        showtime.trace(showtime.JSONEncode(data));
    }

    function sleep(ms) {
        ms += new Date().getTime();
        while (new Date() < ms) {}
    }

    plugin.addURI(plugin.getDescriptor().id + ":channel:(.*)", function(page, id) {
        page.metadata.background = plugin.path + "views/img/background.png";
        page.metadata.backgroundAlpha = 0.5;

        // My Channel needs user to be authed
        if (id == 'mine' && !store.refresh_token) {
            page.loading = false;
            page.error('You need to login to Youtube in Settings.');
            return;
        }

        page.metadata.glwview = plugin.path + "views/user2.view";
        page.type = "directory";

        // Check if id is mine
        if (store.refresh_token && id != 'mine') {
            var data = download(page, API + '/channels', {
                args: {
                    'part': 'id',
                    'mine': true
                }
            });
            if (data.items[0].id == id)
                id = 'mine';
        }

        // Get channel data
        var params = {
            args: {
                'part': 'snippet,contentDetails,brandingSettings,statistics,status'
            }
        };
        id == "mine" ? params.args.mine = true : params.args.id = id;
        var data = download(page, API + '/channels', params);

        if (data.error) {
            page.error(data.error);
            return;
        }

        if (data.items.length == 0) {
            showtime.message("The channel is empty.", true, false);
            return;
        }

        page.metadata.title = data.items[0].snippet.title;
        page.metadata.logo = data.items[0].snippet.thumbnails.default.url;

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
        var lists_tmp = {};

        // Subscribe/unsubscribe to the channel
        if (store.refresh_token && id != 'mine') {
            var data = download(page, API + '/subscriptions', {
                args: {
                    'part': 'snippet',
                    'mine': true,
                    'forChannelId': id
                }
            });
            var subscribeButton;
            if (data.pageInfo.totalResults == 0) {
                page.appendAction("pageevent", "subscribeToTheChannel", false, {
                    title: "Subscribe to this channel"
                });

                page.onEvent('subscribeToTheChannel', function() {
                    var data = download(page, API + '/subscriptions', {
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
                    if (!data.error) {
                        showtime.notify("You successfully subscribed to this channel", 2);
                        //page.redirect(plugin.getDescriptor().id + ':channel:' + id);
                    } else
                        showtime.notify(data.error, 2);
                });
            } else {
                page.appendAction("pageevent", "unsubscribeFromTheChannel", false, {
                    title: "Unsubscribe from this channel"
                });
                var subId = data.items[0].id;
                page.onEvent('unsubscribeFromTheChannel', function() {
                    var data = download(page, API + '/subscriptions', {
                        method: 'DELETE',
                        args: {
                            'id': subId
                        }
                    });

                    if (!data.error) {
                        showtime.notify("You successfully unsubscribed from this channel", 2);
                        //page.redirect(plugin.getDescriptor().id + ':channel:' + id);
                    } else
                        showtime.notify(data.error, 2);
                });
            }
        }

        if (service.showActivities) { // activities (new subscriptions)
            var params = {
                args: {
                    'part': 'snippet,contentDetails',
                    'regionCode': service.region,
                    'maxResults': 50
                }
            }
            id == 'mine' ? params.args.home = true : params.args.channelId = id;
            var data = download(page, API + '/activities', params);

            var activity = getItems(data.items);
            if (activity.length > 0) {
                activity.push({
                    title: "See More",
                    image: plugin.path + "views/img/add.png",
                    url: plugin.getDescriptor().id + ":scraper:/activities:" + escape(showtime.JSONEncode(params)) + ':Activities'
                });

                page.appendPassiveItem("list", activity, {
                    title: "Activities"
                });
                lists_tmp.activity = {
                    array: activity,
                    title: "Activities"
                };
            }

            var activity = getItems(data.items, 'upload');
            if (activity.length > 0) {
                var uploadsOnly = {
                    args: {
                        'part': 'snippet,contentDetails',
                        'regionCode': service.region,
                        'maxResults': 50,
                        'upload': true
                    }
                }
                id == 'mine' ? uploadsOnly.args.home = true : uploadsOnly.args.channelId = id;
                activity.push({
                    title: "See More",
                    image: plugin.path + "views/img/add.png",
                    url: plugin.getDescriptor().id + ":scraper:/activities:" + escape(showtime.JSONEncode(uploadsOnly)) + ':Activities'
                });

                page.appendPassiveItem("list", activity, {
                    title: "Activities (Uploads only)"
                });
                lists_tmp.activity = {
                    array: activity,
                    title: "Activities (Uploads only)"
                };
            }
        }

        if (service.showFavorites && favoritesPlaylistId) {
            var url = '/playlistItems';
            var params = {
                args: {
                    "part": "snippet,contentDetails,status",
                    "playlistId": favoritesPlaylistId,
                    'maxResults': 50
                }
            };
            if (id == 'mine')
                params.method = 'GET';
            var data = download(page, API + url, params);
            var favorites = getItems(data.items);
            if (favorites.length > 0) {
                favorites.push({
                    title: "See More",
                    image: plugin.path + "views/img/add.png",
                    url: plugin.getDescriptor().id + ":scraper:" + url + ':' + escape(showtime.JSONEncode(params)) + ':Favorites'
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
                var url = '/playlistItems';
                var params = {
                    args: {
                        'part': 'snippet,contentDetails,status',
                        'playlistId': watchLaterPlaylistId,
                        'maxResults': 50
                    },
                    method: 'GET'
                };
                var data = download(page, API + url, params);
                var watchLater = getItems(data.items);

                if (watchLater.length > 0) {
                    watchLater.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: plugin.getDescriptor().id + ":scraper:" + url + ':' + escape(showtime.JSONEncode(params)) + ':' + escape('Watch later')
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
                var url = '/playlistItems';
                var params = {
                    args: {
                        "part": "snippet,contentDetails,status",
                        "playlistId": watchHistoryPlaylistId,
                        'maxResults': 50
                    },
                    method: 'GET'
                };
                var data = download(page, API + url, params);
                var watchHistory = getItems(data.items);

                if (watchHistory.length > 0) {
                    watchHistory.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: plugin.getDescriptor().id + ":scraper:" + url + ':' + escape(showtime.JSONEncode(params)) + ':' + escape('Watch history')
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
                var url = '/playlistItems';
                var params = {
                    args: {
                        "part": "snippet,contentDetails,status",
                        "playlistId": likesPlaylistId,
                        'maxResults': 50
                    },
                    method: 'GET'
                };
                var data = download(page, API + url, params);
                var likes = getItems(data.items);

                if (likes.length > 0) {
                    likes.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: plugin.getDescriptor().id + ":scraper:" + url + ':' + escape(showtime.JSONEncode(params)) + ':Likes'
                    });

                    if (id == "mine") page.appendPassiveItem("list", likes, {
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
                var data = download(page, API + '/subscriptions', params);
                var subscriptions = getItems(data.items);

                if (subscriptions.length > 0) {
                    subscriptions.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: plugin.getDescriptor().id + ":scraper:/subscriptions:" + escape(showtime.JSONEncode(params)) + ':Subscriptions'
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
                    'part': 'snippet,contentDetails,status',
                    'channelId': channelId,
                    'maxResults': 50
                }
            };
            if (id == 'mine')
                params.method = 'GET';
            var data = download(page, API + url, params);
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

        if (service.showUploads && uploadsPlaylistId) {
            var url = '/playlistItems';
            var params = {
                args: {
                    "part": "snippet,contentDetails,status",
                    "playlistId": uploadsPlaylistId,
                    'maxResults': 50
                }
            };
            if (id == 'mine')
                params.method = 'GET';

            var data = download(page, API + url, params);

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
        page.loading = true;
        var params = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:15.0) Gecko/20100101 Firefox/15.0.1'
            }
        };
        if (store.refresh_token)
            params.method = 'GET';
        var doc = download(page, 'http://www.youtube.com/watch?v=' + id, params).toString();
        page.loading = true;

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
        page.type = "video";
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
            page.loading = true;
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
            page.loading = false;
            page.error(err);
            return;
        }
        page.loading = false;
    });

    plugin.addURI(plugin.getDescriptor().id + ":video:simple:(.*):(.*)", function(page, title, id) {
        page.loading = true;
        try {
            var video_url = getVideosList(page, id, 1);
            page.loading = true;
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
            page.loading = false;
            page.error(err);
            return;
        }
        page.loading = false;
    });

    plugin.addURI(plugin.getDescriptor().id + ":video:advanced:(.*)", function(page, id) {
        page.loading = true;
        page.metadata.background = plugin.path + "views/img/background.png";
        page.metadata.backgroundAlpha = 0.5;
        page.type = "directory";
        page.metadata.glwview = plugin.path + "views/video.view";

        var videoId = id;
        var params = {
            args: {
                "part": "snippet,contentDetails,statistics,status",
                "id": id
            }
        };
        if (store.refresh_token)
            params.method = 'GET';

        var data = download(page, API + '/videos', params);

        if (data.error) {
            page.error(data.error);
            return;
        }

        if (!data.items.length) {
            page.error("Can't get video info...");
            return;
        }

        page.metadata.icon = data.items[0].snippet.thumbnails.default.url;
        var video = data.items[0];
        var events = false;

        page.appendPassiveItem("label", data.items[0].snippet.channelTitle, {
            title: 'Uploader' + ": "
        });
        page.appendPassiveItem("label", data.items[0].statistics.viewCount, {
            title: 'View count' + ": "
        });
        page.appendPassiveItem("label", durationToString(video.contentDetails.duration), {
            title: "Duration: "
        });
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
                "240p": plugin.path + "views/img/defaultres.png",
                "360p": plugin.path + "views/img/defaultres.png",
                "480p": plugin.path + "views/img/480.png",
                "720p": plugin.path + "views/img/720.png",
                "1080p": plugin.path + "views/img/1080.png"
            };

            var videos = [];
            for (var i in videos_list) {
                var item = videos_list[i];
                page.appendAction("navopen", plugin.getDescriptor().id + ':video:stream:' + escape(title) + ':' + escape(id) + ':' + item.video_url, true, {
                    title: item.quality
                });

                var image = quality_icon[item.quality];
                if (!image || image == "") image = plugin.path + "views/img/nophoto.png";
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
                title: 'View channel',
                image: plugin.path + "views/img/logos/user.png",
                url: plugin.getDescriptor().id + ':channel:' + channelId
            });

            var params = showtime.JSONEncode({
                args: {
                    "part": "snippet",
                    'regionCode': service.region,
                    'safeSearch': service.safeSearch,
                    'maxResults': 50,
                    "type": "video",
                    "relatedToVideoId": id
                }
            });

            page.appendAction("navopen", plugin.getDescriptor().id + ":scraper:/search:" + escape(params) + ':' + escape('Related Videos'), true, {
                title: 'Related videos'
            });
            extras.push({
                title: 'Related videos',
                image: plugin.path + "views/img/related.png",
                url: plugin.getDescriptor().id + ":scraper:/search:" + escape(params) + ':' + escape('Related Videos')
            });

            if (extras.length > 0)
                page.appendPassiveItem("list", extras, {
                    title: "Extras"
                });

            var actions = [];
            if (store.refresh_token) {
                page.appendAction("pageevent", "like", true, {
                    title: 'Like',
                    icon: plugin.path + "views/img/like.png",
                    listActions: true
                });
                page.onEvent('like', function() {
                    rate(page, videoId, 'like');
                });

                page.appendAction("pageevent", "dislike", true, {
                    title: 'Dislike',
                    icon: plugin.path + "views/img/dislike.png",
                    listActions: true
                });
                page.onEvent('dislike', function() {
                    rate(page, videoId, 'dislike');
                });

                page.appendAction("pageevent", "none", true, {
                    title: 'Remove like/dislike',
                    icon: plugin.path + "views/img/top.png",
                    listActions: true
                });
                page.onEvent('none', function() {
                    rate(page, videoId, 'none');
                });

                page.appendAction("pageevent", "addToPlaylist", true, {
                    title: 'Add to Playlists...',
                    icon: plugin.path + "views/img/add.png",
                    listActions: true
                });
                page.onEvent('addToPlaylist', function() {
                    page.redirect(plugin.getDescriptor().id + ':addToPlaylists:' + escape(videoId));
                });
            }
        }
        events = true;
        page.loading = false;
    });

    plugin.addURI(plugin.getDescriptor().id + ":addToPlaylist:(.*):(.*)", function(page, playlistId, videoId) {
        var data = download(page, API + '/playlistItems', {
            args: {
                part: 'snippet',
                mine: true
            },
            postdata: showtime.JSONEncode({
                snippet: {
                    playlistId: unescape(playlistId),
                    resourceId: {
                        kind: 'youtube#video',
                        videoId: unescape(videoId)
                    },
                    position: 0
                }
            })
        });

        if (!data.error) {
            showtime.notify("Video is successfully added to selected playlist", 2);
            page.redirect(plugin.getDescriptor().id + ":channel:mine");
        }
        page.error(data.error);
    });

    plugin.addURI(plugin.getDescriptor().id + ":addToPlaylists:(.*)", function(page, videoId) {
        setPageHeader(page, "Add video to User's Playlists");
        var data = download(page, API + '/channels', {
            args: {
                part: 'contentDetails',
                mine: true
            }
        });
        page.appendItem(plugin.getDescriptor().id + ':addToPlaylist:' + escape(data.items[0].contentDetails.relatedPlaylists.watchLater) + ':' + videoId, 'directory', {
            title: 'Watch Later'
        });
        page.appendItem(plugin.getDescriptor().id + ':addToPlaylist:' + escape(data.items[0].contentDetails.relatedPlaylists.favorites) + ':' + videoId, 'directory', {
            title: 'Favorites'
        });

        // List playlists
        var data = download(page, API + '/playlists', {
            args: {
                part: 'snippet',
                mine: true
            }
        });
        for (var i in data.items) {
            page.appendItem(plugin.getDescriptor().id + ':addToPlaylist:' + escape(data.items[0].id) + ':' + videoId, 'video', {
                title: data.items[i].snippet.title,
                icon: data.items[i].snippet.thumbnails.default.url,
                description: 'Published at: ' + data.items[i].snippet.publishedAt +
                    '\n' + data.items[i].snippet.description
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

    function rate(page, videoId, type) {
        var data = download(page, API + '/videos/rate', {
            args: {
                'id': videoId,
                'rating': type
            },
            postdata: {}
        });
        if (!data.error)
            if (type != 'none')
                showtime.notify('You set ' + type + ' to the video', 3);
            else
                showtime.notify('Removed like/dislike from the video', 3);
        else
            showtime.notify(data, 3);
    }

    function removeFromPlaylist(page, id) {
        var data = download(page, API + '/playlistItems', {
            method: 'DELETE',
            args: {
                id: id
            }
        });

        if (!data.error) {
            showtime.notify("Video is successfully removed from current playlist", 2);
            return;
        }
        page.error(data.error);
    }

    function setVideoItemOptions(item, page) {
        if (item.channelId)
            item.addOptURL("More from this channel", plugin.getDescriptor().id + ':channel:' + item.channelId);

        if (item.videoId) {
            item.addOptURL("Related Videos", plugin.getDescriptor().id + ":scraper:/search:" + escape(showtime.JSONEncode({
                args: {
                    "part": "snippet",
                    'regionCode': service.region,
                    'safeSearch': service.safeSearch,
                    'maxResults': 50,
                    "type": "video",
                    "relatedToVideoId": item.videoId
                }
            })) + ':' + escape('Related Videos'));

            if (store.refresh_token)
                item.addOptURL("Add to Playlists...", plugin.getDescriptor().id + ':addToPlaylists:' + escape(item.videoId));

            if (store.refresh_token && item.playlistId) {
                item.addOptAction("Remove from current playlist", "removeFromPlaylist");
                if (typeof Duktape != 'undefined')
                    item.onEvent('removeFromPlaylist', function(item) {
                        removeFromPlaylist(page, this.playlistId);
                    }.bind(item));
                else
                    item.onEvent('removeFromPlaylist', function(item) {
                        removeFromPlaylist(page, this.playlistId);
                    });
            }

            item.addOptAction("Like video", "like");
            if (typeof Duktape != 'undefined')
                item.onEvent('like', function(item) {
                    rate(page, this.videoId, 'like');
                }.bind(item));
            else
                item.onEvent('like', function(item) {
                    rate(page, this.videoId, 'like');
                });

            item.addOptAction("Dislike video", "dislike");
            if (typeof Duktape != 'undefined')
                item.onEvent('dislike', function(item) {
                    rate(page, this.videoId, 'dislike');
                }.bind(item));
            else
                item.onEvent('dislike', function(item) {
                    rate(page, this.videoId, 'dislike');
                });

            item.addOptAction("Remove like/dislike", "none");
            if (typeof Duktape != 'undefined')
                item.onEvent('none', function(item) {
                    rate(page, this.videoId, 'none');
                }.bind(item));
            else
                item.onEvent('none', function(item) {
                    rate(page, this.videoId, 'none');
                });
        }
    }

    function addVideoItem(page, entry, metadata) {
        var item = page.appendItem(plugin.getDescriptor().id + ":video:" + entry.videoId, "video", metadata);
        for (var i in entry)
            item[i] = entry[i];
        item.playlistId = metadata.playlistId;
        setVideoItemOptions(item, page);
        return item;
    }

    function addLive(page, type) {
        page.appendItem(plugin.getDescriptor().id + ':scraper:/search:' + escape(showtime.JSONEncode({
            args: {
                "part": "snippet",
                'regionCode': service.region,
                'safeSearch': service.safeSearch,
                'maxResults': 50,
                "eventType": type,
                "type": "video"
            }
        })) + ':' + escape('Live Broadcasts'), 'directory', {
            title: type,
            icon: plugin.path + "views/img/logos/live.png"
        });
    }

    plugin.addURI(plugin.getDescriptor().id + ":live", function(page) {
        setPageHeader(page, 'Live Broadcasts');
        addLive(page, 'live');
        addLive(page, 'upcoming');
        addLive(page, 'completed');
    });

    plugin.addURI(plugin.getDescriptor().id + ":start", function(page) {
        page.metadata.background = plugin.path + "views/img/background.png";
        page.metadata.backgroundAlpha = 0.5;
        page.metadata.glwview = plugin.path + "views/array2.view";
        page.type = "directory";
        page.contents = "items";
        page.metadata.logo = logo;
        page.metadata.title = "Youtube - Home Page";
        page.loading = false;

        var items = [];

        items.push(page.appendItem(plugin.getDescriptor().id + ':channel:mine', 'directory', {
            title: 'My Channel',
            icon: plugin.path + "views/img/logos/user.png"
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
            title: 'Most popular',
            icon: plugin.path + "views/img/logos/top.png"
        }));
        items.push(page.appendItem(plugin.getDescriptor().id + ':scraper:/search:' + escape(showtime.JSONEncode({
            args: {
                "part": "snippet",
                'regionCode': service.region,
                'safeSearch': service.safeSearch,
                'maxResults': 50,
                "type": "video"
            }
        })) + ':' + escape('Videos'), 'directory', {
            title: 'Videos',
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

        items.push(page.appendItem(plugin.getDescriptor().id + ':live', 'directory', {
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
                "videoType": "movie"
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

        items.push(page.appendItem(plugin.getDescriptor().id + ':search', 'directory', {
            title: 'Search',
            icon: plugin.path + "views/img/search.png"
        }));

        for (var i in items)
            items[i].id = i;

        if (!main_menu_order.order || showtime.JSONDecode(main_menu_order.order).length != (+i + 1)) {
            var items_tmp = page.getItems();
            main_menu_order.order = showtime.JSONEncode(items_tmp);
        }
        var order = showtime.JSONDecode(main_menu_order.order);
        for (var i in order)
            items[order[i].id].moveBefore(i);

        page.reorderer = function(item, before) {
            item.moveBefore(before);
            main_menu_order.order = showtime.JSONEncode(page.getItems());
        };
    });

    function download(page, url, params) {
        if (page)
            page.loading = true;

        if (params.args)
            params.args.key = key;
        showtime.print(url + ' ' + showtime.JSONEncode(params));

        var data;
        if (store.refresh_token && (params.method || params.args.mine || params.args.home || params.postdata)) { // auth requests
            params.headers = {
                'Authorization': store.token_type + ' ' + store.access_token
            };
            if (params.postdata)
                params.headers['Content-Type'] = 'application/json';

            try {
                data = showtime.httpReq(url, params);
                try {
                    data = showtime.JSONDecode(data);
                } catch(err) {}
            } catch (err) {
                showtime.print('Refreshing access_token');
                try {
                    data = showtime.httpReq('https://www.googleapis.com/oauth2/v3/token', {
                        postdata: {
                            client_id: client_id,
                            client_secret: client_secret,
                            refresh_token: store.refresh_token,
                            grant_type: 'refresh_token'
                        }
                    });
                    store.access_token = showtime.JSONDecode(data).access_token;
                    params.headers['Authorization'] = store.token_type + ' ' + store.access_token;
                    showtime.print('Got new access_token');
                } catch(err) {
                    if (page)
                        page.loading = false;
                    data = {};
                    data.error = err;
                    return data;
                }
                try { // retrying the request with fresh token
                    data = showtime.httpReq(url, params);
                    try {
                        data = showtime.JSONDecode(data);
                    } catch(err) {}
                } catch (err) {
                    data = {};
                    data.error = err;
                }
            }
        } else { // no auth request
            try {
                data = showtime.httpReq(url, params);
                try {
                    data = showtime.JSONDecode(data);
                } catch(err) {}
            } catch(err) {
                data = {};
                data.error = err;
            }
        }
        if (page)
            page.loading = false;
        return data;
    }

    plugin.addURI(plugin.getDescriptor().id + ":scraper:(.*):(.*):(.*)", function(page, url, params, title) {
        page.metadata.background = plugin.path + "views/img/background.png";
        page.metadata.backgroundAlpha = 0.5;
        //setPageHeader(page, title);
        page.type = "directory";
        page.contents = "items";
        page.metadata.logo = logo;
        page.metadata.title = new showtime.RichText(unescape(showtime.entityDecode(title)));
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
            var addParams = showtime.JSONDecode(showtime.JSONEncode(params));
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

    function getVideoId(entry) {
            if (entry.kind == "youtube#activity") {
                var type = entry.snippet.type;
                var params = entry.contentDetails[type];
                if (type == "upload")
                    return params.videoId;
                if (type == "like" || type == "favorite" || type == "recommendation" || type == "bulletin" || type == "playlistItem") {
                    if (entry.contentDetails[type].resourceId.kind == "youtube#video")
                        return params.resourceId.videoId;
                }
            }
            else if (entry.kind == "youtube#playlistItem") {
                if (entry.snippet.resourceId.kind == "youtube#video")
                    return entry.snippet.resourceId.videoId;
            }
            else if (entry.id && entry.id.kind && entry.id.kind == "youtube#video") {
                return entry.id.videoId;
            }
            //print(entry.kind + ' - ' + type + ' - ' + entry.contentDetails[type].resourceId.kind);
        return null;
    }

    function scraper(page, url, params) {
        page.entries = 0;
        var tryToSearch = true;
        addSortHeader(page, url, params);

        function paginator() {
            if (!tryToSearch) return false;
            var data = download(page, API + url, params);
            if (data.error) {
                page.error(data.error);
                return tryToSearch = false;
            }
            //print(data);
            if (!page.entries && !data.items.length) {
                page.appendPassiveItem('directory', '', {
                    title: 'This list does not contain any item.'
                });
                return tryToSearch = false;
            }

            if (!page.entries && data.pageInfo && page.metadata)
                page.metadata.title += ' (' + data.pageInfo.totalResults + ')'

            var idList = '', details, videoDetails = [];
            // Making id list
            for (var i in data.items)
                !idList ? idList = getVideoId(data.items[i]) : idList += ',' + getVideoId(data.items[i]);
            // Fetching info for that ids
            if (idList) {
                var rParams = {
                    args: {
                        'part': 'snippet,contentDetails,statistics,status',
                        'id': idList
                    }
                };
                if (store.refresh_token) // Auth if needed
                    rParams.method = 'GET';
                details = download(page, API + '/videos', rParams);

                for (var i in details.items)
                    videoDetails[details.items[i].id] = details.items[i];
            };

            for (var i in data.items) {
                var metadata = {};

                var entry = data.items[i];
                var index = getVideoId(entry);
                if (videoDetails[index]) {
                    metadata.hd = videoDetails[index].contentDetails.definition;
                    metadata.duration = metadata.runtime = durationToString(videoDetails[index].contentDetails.duration);
                    metadata.views = videoDetails[index].statistics.viewCount;
                    metadata.favorites = videoDetails[index].statistics.favoriteCount;
                    metadata.likes = parseInt(videoDetails[index].statistics.likeCount);
                    metadata.dislikes = parseInt(videoDetails[index].statistics.dislikeCount);
                    metadata.likesPercentage = Math.round((metadata.likes /
                            (metadata.likes + metadata.dislikes)) * 100);
                    metadata.likesPercentage_str = metadata.likesPercentage + '%';
                    metadata.rating = metadata.likesPercentage;
                }
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

                var title = entry.snippet.title ? entry.snippet.title : entry.snippet.channelTitle;

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
                    url: plugin.path + "views/img/nophoto.png"
                });
                images = "imageset:" + showtime.JSONEncode(images);
                metadata.icon = images;
                //showtime.print(entry.kind + (entry.id.kind ? ' - ' + entry.id.kind : ''));
                //showtime.print(showtime.JSONEncode(entry));
                var item;
                if (entry.kind == "youtube#subscription") {
                    if (entry.snippet.resourceId.kind == "youtube#channel") {
                        item = page.appendItem(plugin.getDescriptor().id + ':channel:' + entry.snippet.resourceId.channelId, "video", metadata);
                    }
                } else if (entry.kind == "youtube#activity") {
                    var type = entry.snippet.type;
                    if (params.args.upload && type != 'upload') // Activity uploads only filter
                        continue;
                    var channelTitle = entry.snippet.channelTitle;
                    if (!entry.contentDetails)
                        continue;
                    var cParams = entry.contentDetails[type];
                    metadata.title = new showtime.RichText(coloredStr('[' + type + '] ', orange) +title);
                    if (cParams.resourceId)
                        var resourceId = entry.contentDetails[type].resourceId.kind;
                    if (resourceId == "youtube#video" || !cParams.resourceId) {
                        item = addVideoItem(page, {
                            videoId: cParams.resourceId ? cParams.resourceId.videoId : cParams.videoId,
                            channelId: entry.snippet.channelId
                        }, metadata);
                    } else if (resourceId == "youtube#playlist") {
                        var inParam = {
                            args: {
                                "part": "snippet,contentDetails,status",
                                "playlistId": entry.contentDetails[type].resourceId.playlistId,
                                'maxResults': 50
                            }
                        }
                        if (store.refresh_token)
                            inParam.method = 'GET';
                        item = page.appendItem(plugin.getDescriptor().id + ":scraper:/playlistItems:" + escape(showtime.JSONEncode(inParam)) + ':' + escape(title), "directory", metadata);
                    } else if (resourceId == "youtube#channel") {
                        item = page.appendItem(plugin.getDescriptor().id + ':channel:' + entry.contentDetails[type].resourceId.channelId, "video", metadata);
                    }
                } else if (entry.kind == "youtube#guideCategory") { // category guide list
                    item = page.appendItem(plugin.getDescriptor().id + ":scraper:/channels:" + escape(showtime.JSONEncode({
                        args: {
                            'part': 'snippet,contentDetails,statistics,status',
                            'categoryId': entry.id,
                            'maxResults': 50
                        }
                    })) + ':' + escape(title), "directory", metadata);
                } else if (entry.kind == "youtube#videoCategory") { // of home screen
                    item = page.appendItem(plugin.getDescriptor().id + ":scraper:/search:" + escape(showtime.JSONEncode({
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
                        metadata.playlistId = entry.id;
                        item = addVideoItem(page, {
                            videoId: entry.snippet.resourceId.videoId,
                            channelId: entry.snippet.channelId
                        }, metadata);
                    }
                } else if (entry.kind == "youtube#channel") {
                    item = page.appendItem(plugin.getDescriptor().id + ':channel:' + entry.id, "video", metadata);
                } else if (entry.kind == "youtube#playlist") { // playlists of a channel
                    if (entry.contentDetails) {
                        if (!entry.contentDetails.itemCount) // Don't show empty playlists
                            continue;
                        metadata.title = entry.snippet.title + ' (' + entry.contentDetails.itemCount + ')'
                    }
                    var inParam = {
                        args: {
                            "part": "snippet,contentDetails,status",
                            "playlistId": entry.id,
                            'maxResults': 50
                        }
                    }
                    if (store.refresh_token)
                       inParam.method = 'GET'
                    item = page.appendItem(plugin.getDescriptor().id + ':scraper:/playlistItems:' + escape(showtime.JSONEncode(inParam)) + ':' + escape(title), 'video', metadata);
                } else if (entry.kind == "youtube#video") {
                    item = addVideoItem(page, {
                        videoId: entry.id,
                        channelId: entry.snippet.channelId
                    }, metadata);
                } else if (entry.id.kind == "youtube#channel") { // of searcher
                    item = page.appendItem(plugin.getDescriptor().id + ':channel:' + entry.id.channelId, "video", metadata);
                } else if (entry.id.kind == "youtube#playlist") { // of searcher
                    item = page.appendItem(plugin.getDescriptor().id + ":scraper:" + '/playlistItems:' + escape(showtime.JSONEncode({
                        args: {
                            "part": "snippet,contentDetails,status",
                            "playlistId": entry.id.playlistId,
                            'maxResults': 50
                        }
                    })) + ':' + escape(title), "video", metadata);
                } else if (entry.id.kind == "youtube#video") { // of searcher
                    item = addVideoItem(page, {
                        videoId: entry.id.videoId,
                        channelId: entry.snippet.channelId
                    }, metadata);
                }
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