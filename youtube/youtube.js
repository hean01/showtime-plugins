/**
 * Youtube plugin for Showtime
 *
 *  Copyright (C) 2011-2014 Fábio Ferreira (facanferff), lprot
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
    var plugin_info = plugin.getDescriptor();
    var PREFIX = plugin_info.id;
    var country = '';
    var ui = {
        background : null
    };

    var service = plugin.createService(plugin_info.title, PREFIX + ":start", "video", true,
	plugin.path + "logo.png");
        
    var settings = plugin.createSettings(plugin_info.title, plugin.path + "logo.png", 
        plugin_info.synopsis);

    // stores
    var v3_oauth_information = plugin.createStore('v3_oauth2', true);

    // Preload oauth information keys
    v3_oauth_information.access_token;
    v3_oauth_information.expires_in;
    v3_oauth_information.token_type;
    v3_oauth_information.refresh_token;

    var oauth_information = plugin.createStore('oauth2', true);
    var store_lists = plugin.createStore('lists', true);
    var user_preferences = plugin.createStore('user_preferences', true);

    var main_menu_order = plugin.createStore('main_menu_order', true);

    if (!main_menu_order.ready) {
        main_menu_order.ready = "1";
    }

    if (!user_preferences.ready) {
        user_preferences.ready = "1";
    }

    if (!store_lists.categories) {
        var categories = getCatList('http://gdata.youtube.com/schemas/2007/categories.cat');
        store_lists.categories = categories;

        categories = eval(categories);
    }
    else var categories = eval(store_lists.categories);

    if (!store_lists.channel_types) {
        var channelTypes = getCatList('http://gdata.youtube.com/schemas/2007/channeltypes.cat');
        store_lists.channel_types = channelTypes;

        channelTypes = eval(channelTypes);
    }
    else var channelTypes = eval(store_lists.channel_types);

    if (!store_lists.show_genres) {
        var showGenres = getCatList('http://gdata.youtube.com/schemas/2007/showgenres.cat');
        store_lists.show_genres = showGenres;

        showGenres = eval(showGenres);
    }
    else var showGenres = eval(store_lists.show_genres);

    if (!store_lists.movie_genres) {
        var movieGenres = getCatList('http://gdata.youtube.com/schemas/2007/moviegenres.cat');
        store_lists.movie_genres = movieGenres;

        movieGenres = eval(movieGenres);
    }
    else var movieGenres = eval(store_lists.movie_genres);

    settings.createDivider('Browser Settings');

    settings.createInt("entries", "Maximum number of entries per request (default: 150)", 150, 5, 1000, 5, '', function(v) {
        service.entries = v;
    });

    var resolutionFilter = [
        ['both', 'Both (SD & HD)', true], ['hd', 'HD'], ['sd', 'SD']
    ];
    settings.createMultiOpt("resolutionFilter", "Filter by resolution", resolutionFilter, function(v){
        service.resolutionFilter = v;
    });

    var safeSearch = [
        ['strict', 'Strict'], ['moderate', 'Moderate', true], ['none', 'None']
    ];
    settings.createMultiOpt("safeSearch", "Safe Search", safeSearch, function(v){
        service.safeSearch = v;
    });

    settings.createBool("advancedBrowseV3", "Show more information in pages using API v3", false, function(v) {
        service.advancedBrowseV3 = v;
    });

    settings.createDivider('General Feed Settings');

    settings.createMultiOpt("category", "Category", categories, function(v){
        service.category = v;
    });
    
    var regions = [
        ['all', 'All', true],
        ['AR', 'Argentina'], ['AU', 'Australia'], ['BR', 'Brazil'],
        ['CA', 'Canada'], ['CZ', 'Czech Republic'], ['FR', 'France'],
        ['DE', 'Germany'], ['GB', 'Great Britain'], ['HK', 'Hong Kong'],
        ['HU', 'Hungary'],
        ['IN', 'India'], ['IE', 'Ireland'], ['IL', 'Israel'],
        ['IT', 'Italy'], ['JP', 'Japan'], ['MX', 'Mexico'],
        ['NL', 'Netherlands'], ['NZ', 'New Zealand'], ['PL', 'Poland'],
        ['RU', 'Russia'], ['ZA', 'South Africa'], ['KR', 'South Korea'],
        ['ES', 'Spain'], ['SE', 'Sweden'], ['TW', 'Taiwan'],
        ['US', 'United States']
    ];
    settings.createMultiOpt("region", "Region", regions, function(v){
        service.region = v;
    });


    settings.createDivider('Channel Feed Settings');

    settings.createMultiOpt("channelType", "Channel Type", channelTypes, function(v){
        service.channelType = v;
    });


    settings.createDivider('Movie Feed Settings');
    
    settings.createMultiOpt("movieGenre", "Genre", movieGenres, function(v){
        service.movieGenre = v;
    });

    var languages = [
        ['all', 'All', true], ['en', 'English'], ['es', 'Spanish'], ['fr', 'French'], ['ja', 'Japanese'], ['pt', 'Portuguese']
    ];
    settings.createMultiOpt("movieLanguage", "Language", languages, function(v){
        service.movieLanguage = v;
    });


    settings.createDivider('Shows Feed Settings');
    
    settings.createMultiOpt("showGenre", "Genre", showGenres, function(v){
        service.showGenre = v;
    });
    
    
    settings.createDivider('Video Settings');
    
    settings.createBool("mode", "Advanced Youtube (Extra video features)", false, function(v) {
        if (v == '1')
            service.mode = 'advanced';
        else
            service.mode = 'simple';
    });
    
    var maximumResolution = [
        ['4', '1080p', true], ['3', '720p'], ['2', '480p'], ['1', '360p'], ['0', '240p']
    ];
    settings.createMultiOpt("maximumResolution", "Highest resolution", maximumResolution, function(v){
        service.maximumResolution = v;
    });

    var minimumResolution = [
        ['4', '1080p'], ['3', '720p'], ['2', '480p'], ['1', '360p'], ['0', '240p', true]
    ];
    settings.createMultiOpt("minimumResolution", "Lowest resolution", minimumResolution, function(v){
        service.minimumResolution = v;
    });
    
    var formats = [
        ['default', 'Default', true], ['mp4', 'MP4'], ['x-flv', 'FLV']
    ];
    settings.createMultiOpt("format", "Video Format", formats, function(v){
        service.format = v;
    });

    var video_sources = [
        ['default', 'Default', true], ['fallback', 'Fallback']
    ];
    settings.createMultiOpt("video_source", "Video Source", video_sources, function(v){
        service.video_source = v;
    });
    
    settings.createBool("universalSubtitles", "Enable Universal Subtitles", false, function(v) {
        service.universalSubtitles = v;
    });

    settings.createBool("transcribedCaptions", "Enable Transcribed Captions", false, function(v) {
        service.transcribedCaptions = v;
    });

    settings.createBool("automaticSpeechCaptions", "Enable Automatic Speech", false, function(v) {
        service.automaticSpeechCaptions = v;
    });


    settings.createDivider("User Profile");

    settings.createBool("showUploads", "Show User Uploads", true, function(v) { service.showUploads = v; });
    settings.createBool("showFavorites", "Show User Favorites", true, function(v) { service.showFavorites = v; });
    settings.createBool("showPlaylists", "Show User Playlists", true, function(v) { service.showPlaylists = v; });
    settings.createBool("showSubscriptions", "Show User Subscriptions", true, function(v) { service.showSubscriptions = v; });
    settings.createBool("showNewSubscriptionVideos", "Show User New Subscription Videos", true, function(v) { service.showNewSubscriptionVideos = v; });
    settings.createBool("showWatchHistory", "Show User Watch History", true, function(v) { service.showWatchHistory = v; });
    settings.createBool("showWatchLater", "Show User Watch Later", true, function(v) { service.showWatchLater = v; });
    settings.createBool("showLikes", "Show User Likes", true, function(v) { service.showLikes = v; });
    settings.createBool("showVideoRecommendations", "Show User Video Recommendations", false, function(v) { service.showVideoRecommendations = v; });

    
    settings.createDivider('User Settings');

    var api = new Youtube_API();

    var apiV3 = new YoutubeV3();
    apiV3.auth.init();

    settings.createAction("loginV3", "API Log In (Youtube API v3)", function () {
        if (apiV3.auth.request())
            showtime.notify('Authenticated succesfully', 2);
    });


    settings.createDivider("Developer Settings");

    settings.createBool("enableDebug", "Enable Debug messages", false, function(v) { service.enableDebug = v; });

    var website = new websiteApi();
    var items = [];
    var items_tmp = [];

    if (showtime.currentVersionInt >= 4 * 10000000 +  3 * 100000 + 261) {
        plugin.addItemHook({
            title: "Search in Youtube",
            itemtype: "video",
            handler: function(obj, nav) {
                var title = obj.metadata.title;
                title = title.replace(/<.+?>/g, "").replace(/\[.+?\]/g, "");
                t("Search in Youtube: " + title);
                nav.openURL(PREFIX + ":feed:" + escape("https://gdata.youtube.com/feeds/api/videos?q=" + title)+':');
            }
        });
    }

    function startPage(page) {
        ui.background = user_preferences.background;
        pageMenu(page);

        page.metadata.glwview = plugin.path + "views/array2.view";

        var standard_feeds = [];
        for (var i in api["standard_feeds"]) {
            var entry = api["standard_feeds"][i];
            standard_feeds.push({
                url: PREFIX + ':feed:' + escape(entry[1]) + ':' +escape('Standard Feeds'),
                title: entry[0],
                icon: entry[2]
            });
        }

        var channel_feeds = [];
        for (var i in api["channel_feeds"]) {
            var entry = api["channel_feeds"][i];
            channel_feeds.push({
                url: PREFIX + ':feed:' + escape(entry[1])+ ':' +escape('Channel Feeds'),
                title: entry[0],
                icon: entry[2]
            });
        }

        var items = [];

        if (apiV3.authenticated) {
        	var args = {
        		"part": "id,snippet,contentDetails",
        		"home": true,
        		"request": {
        			"type": "activities",
        			"subrequest": "list"
        		}
        	};
       	 	items.push(page.appendItem(PREFIX + ':v3:request:' + escape(showtime.JSONEncode(args))+':'+escape('My Activity'), 'directory', {
        		title: 'My Activity'
        	}));
        }

        var args = {
        	"part": "id,snippet",
        	"regionCode": service.region != "all" ? service.region : "US",
        	"request": {
        		"type": "guideCategories",
        		"subrequest": "list"
        	}
        };
        items.push(page.appendItem(PREFIX + ':v3:request:' + escape(showtime.JSONEncode(args))+':'+escape('Guide Categories'), 'directory', {
        	title: 'Guide Categories', icon: plugin.path + "views/img/logos/explore.png"
        }));

        var args = {
        	"part": "id,snippet",
        	"regionCode": service.region != "all" ? service.region : "US",
        	"request": {
        		"type": "videoCategories",
        		"subrequest": "list"
        	}
        };
        items.push(page.appendItem(PREFIX + ':v3:request:' + escape(showtime.JSONEncode(args))+':'+escape('Video Categories'), 'directory', {
        	title: 'Video Categories', icon: plugin.path + "views/img/logos/explore.png"
        }));
        
        items.push(page.appendItem(PREFIX + ':mixfeeds:'+ 'standard_feeds:'+escape('Standard Feeds'), 'directory', {title: 'Standard Feeds', icon: plugin.path + "views/img/logos/feeds.png" }));
        items.push(page.appendItem(PREFIX + ':mixfeeds:'+ 'channel_feeds:'+escape('Channel Feeds'), 'directory', {title: 'Channel Feeds', icon: plugin.path + "views/img/logos/channels.png" }));
        items.push(page.appendItem(PREFIX + ':edu:'+escape('Youtube EDU'), 'directory', { title: 'Youtube EDU', icon: plugin.path + "views/img/logos/edu.png" }));
        items.push(page.appendItem(PREFIX + ':mixfeeds:'+ 'live_feeds:'+escape('Youtube Live'), 'directory', {title: 'Youtube Live', icon: plugin.path + "views/img/logos/live.png" }));
        items.push(page.appendItem(PREFIX + ':mixfeeds:'+ 'movie_feeds:'+escape('Youtube Movies'), 'directory', {title: 'Youtube Movies', icon: plugin.path + "views/img/logos/movies.png" }));
        items.push(page.appendItem(PREFIX + ':mixfeeds:'+ 'show_feeds:'+escape('Youtube Shows'), 'directory', {title: 'Youtube Shows', icon: plugin.path + "views/img/logos/shows.png" }));
        items.push(page.appendItem(PREFIX + ':disco:null:'+escape('Youtube Disco'), 'directory', {title: 'Youtube Disco', icon: plugin.path + "views/img/logos/disco.png" }));
        
        if (apiV3.auth.authenticated)
            items.push(page.appendItem(PREFIX + ':user:default', 'directory', {title: 'User Profile', icon: plugin.path + "views/img/logos/user.png" }));
    
        try {
            for (var i in items) {
                items[i].id = i;
            }

            if (!main_menu_order.order) {
                var items_tmp = page.getItems();
                for(var i = 0; i < items_tmp.length; i++) {
                    if (!items_tmp[i].id) delete items_tmp[i];
                }
                main_menu_order.order = showtime.JSONEncode(items_tmp);
            }

            main_menu_order.order;

            var order = showtime.JSONDecode(main_menu_order.order);
            for (var i in order) {
                items[order[i].id].moveBefore(i);
            }

            page.reorderer = function(item, before) {
                item.moveBefore(before);
                var items = page.getItems();
                for(var i = 0; i < items.length; i++) {
                    if (!items[i].id) delete items[i];
                }

                main_menu_order.order = showtime.JSONEncode(items);
            };
        }
        catch (ex) {
            t("Error while parsing main menu order");
            e(ex);
        }

        page.type = "directory";
        page.contents = "items";
        page.loading = false;

        page.metadata.logo = plugin.path + "logo.png";
        page.metadata.title = "Youtube - Home Page";
    }

    plugin.addURI(PREFIX + ":oauth:confirm:(.*)", function (page, code) {
        page.type = "directory";
        page.metadata.glwview = plugin.path + "views/auth_2.view";

        page.loading = false;

        if (api.pollRequest(unescape(code))) {
            var screens = [
                {
                    image: "http://i.imgur.com/OaW6K.jpg",
                    caption: "You have been successfully authenticated."
                }
            ];
        }
        else {
            var screens = [{
                image: "http://i.imgur.com/OaW6K.jpg",
                caption: "There was one error while trying to authenticate you. Try again later."
            }];
        }

        page.metadata.screens = screens;

        page.type = "directory";
        page.contents = "items"
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":search", function(page) {
        page.metadata.title = 'Youtube Search';
        page.metadata.logo = plugin.path + "views/img/logos/music.png";

        pageMenu(page, null, null);

        page.metadata.search = "";
        page.subscribe("page.model.metadata.search", function(v) {
            page.metadata.search = v;
        });
        page.appendAction("navopen", PREFIX + ":feed:" + escape("https://gdata.youtube.com/feeds/api/videos?q=" + page.metadata.search), true, {
            title: "Search for Videos",
            icon: plugin.path + "views/img/search_videos.png",
            hidden: true,
            search: true
        });
        page.appendAction("navopen", PREFIX + ":feed:" + escape("https://gdata.youtube.com/feeds/api/playlists/snippets?q=" + page.metadata.search), true, {
            title: "Search for Playlists",
            icon: plugin.path + "views/img/search_playlists.png",
            hidden: true,
            search: true
        });
        page.appendAction("navopen", PREFIX + ":feed:" + escape("https://gdata.youtube.com/feeds/api/channels?q=" + page.metadata.search), true, {
            title: "Search for Channels",
            icon: plugin.path + "views/img/search_channels.png",
            hidden: true,
            search: true
        });
        page.appendAction("navopen", PREFIX + ":disco:" + escape(page.metadata.search)+':'+escape('Search for Disco: '), true, {
            title: "Search for Disco",
            icon: plugin.path + "views/img/logos/music.png",
            hidden: true,
            search: true
        });

        page.metadata.glwview = plugin.path + "views/search.view";

        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":list:(.*)", function(page, list) {
        page.metadata.title = 'Youtube Music';
        page.metadata.logo = plugin.path + "views/img/logos/music.png";

        pageMenu(page, null, null);

        var entries = website.getPlaylist(list);

        for (var i in entries) {
            var item = entries[i];
            page.appendItem(PREFIX + ":video:" + item.id, "video", item);
        }
    
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":edu:(.*)", function(page, title) {
        page.metadata.title = unescape(showtime.entityDecode(title));
        page.metadata.logo = plugin.path + "views/img/logos/edu.png";

        pageMenu(page, null, null);

        var edu_categories = eval(getCatList("http://gdata.youtube.com/schemas/2007/educategories.cat"));
        for (var i in edu_categories) {
            var entry = edu_categories[i];
            if (entry[1] == "All") continue;
            page.appendItem(PREFIX + ':edu:category:' + entry[0] + ':' + escape(title), 'directory', {
                title: unescape(showtime.entityDecode(entry[1]))
            })
        }
    
        page.type = "directory";
        page.contents = "items"
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":edu:category:(.*):(.*)", function(page, categoryId, title) {
        page.metadata.title = unescape(showtime.entityDecode(title));
        page.metadata.logo = plugin.path + "views/img/logos/edu.png";

        pageMenu(page, null, null);

        page.appendItem(PREFIX + ':feed:' + escape("http://gdata.youtube.com/feeds/api/edu/courses?category=" + categoryId) + ':Courses', 'directory', {
            title: "Courses"
        })

        page.appendItem(PREFIX + ':feed:' + escape("http://gdata.youtube.com/feeds/api/edu/lectures?category=" + categoryId) + ':Lectures', 'directory', {
            title: "Lectures"
        })
        
        page.type = "directory";
        page.contents = "items"
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":disco:(.*):(.*)", function(page, query, title) {
        page.metadata.title = unescape(showtime.entityDecode(title));
        page.metadata.logo = plugin.path + "logo.png";

        pageMenu(page);
        page.loading = false;
        var artist = unescape(query);
        if (query == "null") {
            var titleInput = showtime.textDialog('Artist: ', true, true);

            if (search.rejected) {
                page.error('Cancelled by user request.');
                return;
            }
            artist = titleInput.input;
            if (artist.length == 0) {
                page.error('Empty string is not valid');
                return;
            }
        }
        page.loading = true;
        var q = escape(artist);
        var data = showtime.httpGet('http://www.youtube.com/disco?action_search=1&query=' + q);
        try {
            data = showtime.JSONDecode(data.toString());
            if (data.url == '\/disco?search_query=' + q) {
                page.error("Youtube can't find any artist with that name. Sorry about that.");
                return;
            }

            var entries = website.getPlaylist(data.url.match('list=([^&]*)')[1]);
            
            for (var i in entries) {
                var item = entries[i];
                page.appendItem(PREFIX + ":video:" + item.id, "video", {
                    title: showtime.entityDecode(unescape(item.title)),
                    icon: item.logo
                });
            }
        }
        catch (ex) {
            page.error('There was one error while requesting for the specified artist: \n' + ex);
            e(ex);
            return;
        }
    
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    });
  
    plugin.addURI(PREFIX + ":mixfeeds:(.*):(.*)", function(page, type, title) {
        page.metadata.title = unescape(showtime.entityDecode(title));
        page.metadata.logo = plugin.path + "logo.png";

        pageMenu(page);
		
        //page.metadata.glwview = plugin.path + "views/array2.view";
    
        for (var i in api[type]) {
            var entry = api[type][i];
            page.appendItem(PREFIX + ':feed:' + escape(entry[1])+':'+escape(entry[0]),"directory", {
                title: unescape(showtime.entityDecode(entry[0])),
                icon: entry[2]
            });
        }
    
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":feed:sort:(.*):(.*):(.*)", function(page, category, url, title) {
        page.metadata.title = unescape(showtime.entityDecode(title));
        page.type = "directory";
        page.contents = "contents";
        page.loading = false;

        var link = unescape(url);
        var cat = unescape(category);

        var res = getUrlArgs(link);
        link = res.url;

        for (var i in api.orderby_values) {
            var value = api.orderby_values[i];
            
            if (cat == "http://gdata.youtube.com/schemas/2007#video" && value[2].indexOf('video') == -1)
                continue;
            if (cat == "http://gdata.youtube.com/schemas/2007#playlist" && value[2].indexOf('playlist') == -1)
                continue;

            res.args['orderby'] = value[1];
            var link_tmp = putUrlArgs(link, res.args);

            page.appendItem(PREFIX + ':feed:' + escape(link_tmp) + ':'+escape(value[0]),"directory", {
                title: unescape(showtime.entityDecode(value[0]))
            });
        }
    });

    plugin.addURI(PREFIX + ":feed:duration:(.*):(.*)", function(page, url, title) {
        page.metadata.title = unescape(showtime.entityDecode(title));
        page.type = "directory";
        page.contents = "contents";
        page.loading = false;

        var link = unescape(url);

        var res = getUrlArgs(link);
        link = res.url;

        res.args['duration'] = 'short';
        var link_tmp1 = putUrlArgs(link, res.args);

        res.args['duration'] = 'medium';
        var link_tmp2 = putUrlArgs(link, res.args);

        res.args['duration'] = 'long';
        var link_tmp3 = putUrlArgs(link, res.args);

        page.appendItem(PREFIX + ':feed:' + escape(link_tmp1)+':'+escape('Short: Less than 4 minutes'), "directory", {
            title: 'Short: Less than 4 minutes'
        });
        page.appendItem(PREFIX + ':feed:' + escape(link_tmp2)+':'+escape('Medium: Between 4 minutes and 20 minutes (inclusive)'), "directory", {
            title: 'Medium: Between 4 minutes and 20 minutes (inclusive)'
        });
        page.appendItem(PREFIX + ':feed:' + escape(link_tmp3)+':'+escape('Long: Longer than 20 minutes'), "directory", {
            title: 'Long: Longer than 20 minutes'
        });
    });
  
    function pageController(page, loader) {
        items = [];
        items_tmp = [];
	if (page.metadata) {
	    page.metadata.apiAuthenticated = apiV3.auth.authenticated;
	    pageMenu(page, page.items);
	}

        page.contents = 'list';
        var offset = 1;
        var total_items = 0;
        var max_items = service.entries;

        //var items = [];

        function paginator() {      
            var num = 0;
            while(total_items < max_items) {	
                var doc = loader(offset + num).feed;
                if (!doc || typeof(doc) == String) {
                    break;
                }
                page.entries = doc.openSearch$totalResults.$t;
                total_items += doc.openSearch$itemsPerPage.$t;

                if (page.entries < max_items)
                    max_items = page.entries;

                if (page.entries > service.entries)
                    page.entries = service.entries;
                var c = 0;

                if (!doc.entry) {
                    page.appendItem(PREFIX + ':start', 'directory', {
                        title: 'This feed does not contain any item. Sorry about that.'
                    });
                }

                for (var i in doc.entry) {
                    var entry = doc.entry[i];

                    // Override entry.category, needed for Watch History playlist
                    for (var j in entry.link) {
                        if (entry.link[j].rel == 'http://gdata.youtube.com/schemas/2007#video')
                            entry.category[0].term = 'http://gdata.youtube.com/schemas/2007#video';
                    }
                
                    try {
                        c++;
                        var id, url;

                        var metadata = {};

                        if (entry.published) {
                            metadata.published = getDistanceTime(getTime(entry.published.$t));
                        }

                        if (entry.updated) {
                            metadata.updated = getDistanceTime(getTime(entry.updated.$t));
                        }

                        if (entry.author && entry.author[0].name) {
                            metadata.author = entry.author[0].name.$t;
                        }

                        if (entry.yt$rating && entry.yt$rating.numDislikes && entry.yt$rating.numLikes) {
                            metadata.likes = parseInt(entry.yt$rating.numLikes);
                            metadata.dislikes = parseInt(entry.yt$rating.numDislikes);
                            metadata.likesPercentage = ( metadata.likes / ( metadata.likes + metadata.dislikes ) );
                            metadata.likesBarValue = metadata.likesPercentage;
                            metadata.likesPercentage = Math.round(  metadata.likesPercentage * 100 );
                            metadata.likesPercentageStr = metadata.likesPercentage.toString();
                            metadata.rating = metadata.likesPercentage;
                        }

                        if (entry.app$control && entry.app$control.yt$state) {
                            if (entry.app$control.yt$state.name == "restricted" && entry.app$control.yt$state.reasonCode == "requesterRegion") metadata.restricted = true;
                        }

                        if (entry.yt$hd) {
                            metadata.hd = true;
                        }
                    
                        if (entry.media$group && entry.media$group.media$rating) {
                            metadata.certification = entry.media$group.media$rating[0].$t.toString().toUpperCase();
                        }

                        if (entry.media$group && entry.media$group.media$content) {
                            metadata.duration = showtime.durationToString(entry.media$group.media$content[0].duration);
                            metadata.runtime = metadata.duration;
                        }

                        if (entry.yt$statistics) {
                            metadata.views = entry.yt$statistics.viewCount;
                            metadata.favorites = entry.yt$statistics.favoriteCount;
                            metadata.views_str = metadata.views.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
                        }

                        if (entry.media$group && entry.media$group.media$thumbnail) {
                            metadata.icon = "imageset:" + entry.media$group.media$thumbnail[0].url;

                            if (metadata.icon && metadata.icon.slice(0, 2) == '//') {
                                metadata.icon = 'http:' + metadata.icon;
                            }
                        }

                        var color = 'FFFFFF';
                        if (country != "" && entry.media$group && entry.media$group.media$restriction) {
                            var restriction = entry.media$group.media$restriction[0];
                            if (restriction.type == 'country') {
                                var countries = restriction.$t.split(' ');
                                if (restriction.$t.indexOf(country) != -1 && restriction.relationship == 'deny') {
                                    color = 'ffa500';
                                }
                                else if (restriction.relationship == 'allow' && entry.media$group.media$restriction.length == 1 && restriction.$t.indexOf(country) == -1) {
                                    color = 'ffa500';
                                }
                            }
                        }
                        //var title = '<font size="3" color="' + color + '">' + entry.title.$t + '</font>';
                        var title = entry.title.$t;
                        if (metadata.duration)
                            //title += '<font size="3" color="6699CC"> (' + metadata.duration + ')</font>';
                            title += '(' + metadata.duration + ')';
                        if (metadata.likesPercentage)
                            metadata.likesPercentage_str = new showtime.RichText('<font color="99CC66"> ( ' + metadata.likesPercentage + '% )</font>');

                        metadata.title = unescape(showtime.entityDecode(title));//new showtime.RichText(title);

                        var subtitle1 = '<font color="66CCFF">';
                        if (metadata.views_str)
                            subtitle1 += 'Views: ' + metadata.views_str;
                        if (metadata.views_str && metadata.favorites)
                            subtitle1 += ' | ';
                        if (metadata.favorites)
                            subtitle1 += 'Favorites: ' + metadata.favorites;
                        if (metadata.likes_str && (metadata.views || metadata.favorites))
                            subtitle1 += ' | ';
                        if (metadata.likes_str)
                            subtitle1 += 'Likes Percentage: ' + metadata.likes_str;
                        subtitle1 += '</font>';
                        //metadata.subtitle1 = new showtime.RichText(subtitle1);

                        var dateInfo = "";
                        if (metadata.published) {
                            dateInfo = 'Published ';

                            if (entry.author && entry.author[0].name) {
                                dateInfo += 'by <font color="FFFF00">' + entry.author[0].name.$t + '</font><font color="99CC33"> ';
                            }

                            dateInfo += metadata.published;
                        }
                    
                        if (metadata.updated) {
                            if (metadata.published)
                                dateInfo += ' | ';
                            
                            dateInfo += 'Updated ' + metadata.updated;
                        }

                        var desc = "";
                        if (entry.media$group && entry.media$group.media$description) {
                            desc = entry.media$group.media$description.$t;
                        }

                        var lines = "";
                        var desc_split = desc.split("\n");
                        for (var i = 0; i < desc_split.length && i < 2; i++) {
                            lines += desc_split[i] + "\n";
                        }  

                        metadata.description = new showtime.RichText(subtitle1 + "\n" + '<font color="99CC33">' + dateInfo + '</font>\n' +
                            '<font color="EEEEEE">' + lines + '...' + '</font>');

                        var images = [];
                        if (entry.media$group && entry.media$group.media$thumbnail) {
                            images = entry.media$group.media$thumbnail;
                        }
                        else if (entry.media$thumbnail && entry.media$thumbnail.url) {
                            images.push({
                                url: entry.media$thumbnail.url,
                                width: 400,
                                height: 400
                            });
                        }
                        images.push({
                            width: 20,
                            height: 20,
                            url: plugin.path + "views/img/nophoto.bmp"});
                        images = "imageset:" + showtime.JSONEncode(images);
                        metadata.icon = images;

                        if (entry.media$group && entry.media$group.yt$videoid) {
                            var id = entry.media$group.yt$videoid.$t;
                            metadata.hqPicture = "http://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
                            //metadata.icon = metadata.hqPicture;
                            metadata.album_art = metadata.hqPicture;
                            metadata.picture1 = "http://i.ytimg.com/vi/" + id + "/1.jpg";
                            metadata.picture2 = "http://i.ytimg.com/vi/" + id + "/3.jpg";

                            var item = page.appendItem(PREFIX + ':video:' + id, "video", metadata);

                            item.id = id;
                            if (entry.media$group && entry.media$group.media$credit) {
                                item.author = entry.media$group.media$credit[0].$t;
                            }
                            itemOptions(item, entry);
                        }
                        else if (entry.category[0].term == "http://gdata.youtube.com/schemas/2007#course") {
                            var match = entry.id.$t.match(":course:([^:]*)")[1];
                            var item = page.appendItem(PREFIX + ':feed:' + escape("http://gdata.youtube.com/feeds/api/edu/lectures?course=" + match)+':'+escape(title), "directory", metadata);
                        }
                        else if (doc.id.$t.toString().indexOf('charts:movies') != -1) {
                            
                            if (entry.yt$firstReleased) {
                                metadata.released = date_string(entry.yt$firstReleased.$t);
                            }

                            for (var i in entry.media$group.media$category) {
                                var el = entry.media$group.media$category[i];
                                if (el.scheme == 'http://gdata.youtube.com/schemas/2007/mediatypes.cat') {
                                    metadata.mediatype = api.mediatypes[parseInt(el.$t) - 1];
                                }
                                if (el.scheme == 'http://gdata.youtube.com/schemas/2007/moviegenres.cat') {
                                    metadata.moviegenre = api.moviegenres[parseInt(el.$t) - 1];
                                }
                            }
                        }
                        else if (entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#season') {
                            for (var i in entry.gd$feedLink) {
                                var link = entry.gd$feedLink[i];

                                var title = link.rel.valueOf().slice(link.rel.valueOf().indexOf('#')+1).replace(/\./g,' ');

                                title = title.slice(title.indexOf(' ')+1)
                                title = title.charAt(0).toUpperCase() + title.slice(1);

                                metadata.title = "Season " + entry.yt$season.season + ' - ' + title;

                                var item = page.appendItem(PREFIX + ':feed:' + escape(link.href) + ':' + escape(metadata.title), "directory", metadata);

                                item.appendItem = "page.appendItem(PREFIX + ':feed:' + escape(link.href) + ':' + escape(title), \"directory\", metadata);";
                            }
                        }
                        else if (entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#video' ||
                        entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#playlist' ||
                        entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#userEvent' ||
                        entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#liveEvent') {
                            id = entry.id.$t.toString().slice(entry.id.$t.toString().lastIndexOf(':')+1)
                            if (id.length > 11) {
                                if (entry.yt$videoid)
                                    id = entry.yt$videoid.$t;
                                else if (entry.content) {
                                    id = entry.content.src.toString().slice(entry.content.src.toString().lastIndexOf('/')+1, 
                                    (entry.content.src.toString().lastIndexOf('?')!=-1)?entry.content.src.toString().lastIndexOf('?'):entry.content.src.toString().length)
                                }
                                else {
                                    id = entry.link[0].href;
                                    id = id.slice(id.indexOf('v=') + 2, id.indexOf('&'));
                                }
                            }

                            metadata.hqPicture = "http://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
                            metadata.icon = metadata.hqPicture;
                            metadata.picture1 = "http://i.ytimg.com/vi/" + id + "/1.jpg";
                            metadata.picture2 = "http://i.ytimg.com/vi/" + id + "/2.jpg";
                        
                            var item = page.appendItem(PREFIX + ':video:' + id, "video", metadata);

                            item.id = id;
                            if (entry.media$group && entry.media$group.media$credit) {
                                item.author = entry.media$group.media$credit[0].$t;
                            }
                            itemOptions(item, entry);
                        }
                        else if (entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#friend' ||
                        entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#subscription') {
                            var item = page.appendItem(PREFIX + ':user:username:' + entry.yt$username.$t, "directory", metadata);
                        }
                        else if (entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#playlistLink' ||
                        entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#show' ||
                        entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#season') {
                            url = entry.content.src;
                            var item = page.appendItem(PREFIX + ':feed:' + escape(url)+':'+escape(title), "directory", metadata);
                        }
                        else if (entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#channel') {
                            var item = page.appendItem(PREFIX + ':feed:' + escape(entry.gd$feedLink[0].href)+':'+escape(title), "directory", metadata);
                        }
                        else if (entry.category[0].term == 'http://gdata.youtube.com/schemas/2007#channelstandard') {
                            var icon = eval('(entry.media$group)?entry.media$group.media$thumbnail[0].url:null');
                            if (icon && icon.slice(0, 2) == '//') {
                                icon = 'http:' + icon;
                            }

                            var item = page.appendItem(PREFIX + ':user:username:' + entry.id.$t.toString().slice(entry.id.$t.toString().lastIndexOf(':')+1), "directory", metadata);
                        }

                        if (metadata.published) {
                            // 2012-08-10T19:34:51.000Z
                            var match = entry.published.$t.match("(.*)-(.*)-(.*)T(.*):(.*):([^.]*)");
                            item.published = new Date(match[1], match[2], match[3], match[4], match[5], match[6]).getTime();
                        }

                        item.index = c;
                        item.title = entry.title.$t;
                        if (metadata.views)
                            item.views = parseInt(metadata.views);
                        if (entry.published)
                            item.date = getTime(entry.published.$t).getTime();
                        items.push(item);
                        items_tmp.push(item);
                    }
                    catch(err) {
                        showtime.trace(err)
                    }
                }
                page.loading = false;	
                num += c;

                if(c == 0 || offset > api.args_common['max-results'] || num > parseInt(service.entries) || c == parseInt(doc.openSearch$totalResults.$t) || total_items >= max_items)	  
                    break;
            }
            // Reset arguments for HTTP requests
            api.reset_args();
            offset += num;

            return offset < page.entries;    
        }
    
        page.type = "directory";
        paginator();    
        page.paginator = paginator;
    }
  
    plugin.addURI(PREFIX + ":feed:(.*)", function(page, url) {
        page.redirect(PREFIX + ":feed:"+url+':'+escape('Search results:'));
    });

    plugin.addURI(PREFIX + ":feed:(.*):(.*)", function(page, url, title) {
        page.metadata.title = new showtime.RichText(unescape(showtime.entityDecode(title)));
        page.type = "directory";
        page.contents = "items";
        var sort_included = false;
        var duration_included = false;

        try {
            page.metadata.logo = plugin.path + "logo.png";
            api.reset_args();

            pageController(page, function(offset) { 
                api.args_common['start-index']=offset;
            
                url=unescape(url)
            
                if (url.indexOf('?')!=-1) {
                    var args = url.slice(url.indexOf('?')+1);            
                    args=args.split('&');

                    for (var i in args) {
                        var arg = args[i];
                        var arg_tmp = arg.split('=');
                        api.args_common[arg_tmp[0]]=arg_tmp[1].replace(/ /g, "%20");
                    }
                    url=url.slice(0, url.indexOf('?'));
                }

                var link = putUrlArgs(url, api.args_common);
            
                if (url.indexOf('/standardfeeds/') != -1) {
                    if (service.region && service.region != 'all' && (url.indexOf('/' + service.region + '/') == -1)) {
                        var type_init = url.indexOf('/standardfeeds/');
                        url = url.slice(0, type_init + 15) + service.region + url.slice(type_init + 14);
                    }
                    if (service.category && url.indexOf('_' + service.category) == -1 && service.category != 'all')
                        url += '_' + service.category;
                }
                else if (url.indexOf('api/charts/shows/') != -1) {
                    if (service.showGenre != 'all')
                        api.args_common['genre'] = service.showGenre;
                    if (service.region != 'all')
                        api.args_common['region'] = service.region;
                }
                else if (url.indexOf('api/charts/movies/') != -1) {
                    if (service.movieGenre != 'all')
                        api.args_common['movie-genre'] = service.movieGenre;
                    if (service.region != 'all')
                        api.args_common['region'] = service.region;
                    if (service.movieLanguage != 'all')
                        api.args_common['hl'] = service.movieLanguage;
                    //api.args_common['paid-content'] = 'false';
                }
                else if (url.indexOf('api/channelstandardfeeds/') != -1) {
                    if (service.channelType && service.channelType != 'all' && url.indexOf('_' + service.channelType) == -1 && service.channelType != 'all')
                        url += '_' + service.channelType;
                }
                
                var doc = apiV3.download({
                    "path": url,
                    "args": api.args_common,
                    "apiV2": true
                })

                if (doc.error) {
                    page.error(doc.error);
                    return doc.error;
                }

                country = doc.headers['X-GData-User-Country'];

                doc = doc.response;
                //if (doc.feed.title) {
                //    page.metadata.title = doc.feed.title.$t;
                //}

                if (!duration_included) {
                    page.appendItem(PREFIX + ':feed:duration:' + escape(link)+':'+escape('Filter by duration'), "directory", {
                        title: "Filter by duration"}
                    );
                    duration_included = true;
                }

                return doc;
            });
        }
        catch (err) {
            e(err);

            if (err == 'Error: HTTP error: 400') {
                var args = '';
                for (var arg in api.args_common)
                    args += '\n' + arg + ': ' + api.args_common[arg]
            
                page.error('The request for the feed contains incompatible args. Please contact facanferff with the following information:\n'+
                err + args);
            }
            else if (err == 'Error: HTTP error: 404')
                page.error('This feed was deleted or is not available at the moment');
            else
                page.error('There was one unknown error: ' + err);
        }
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":v3:request:(.*):(.*)", function(page, args, title) {
        page.type = "directory";
        page.contents = "items";
        page.metadata.title = new showtime.RichText(unescape(showtime.entityDecode(title)));
        page.metadata.background = plugin.path + "views/img/background.png";

        args = showtime.JSONDecode(unescape(args));

        try {
            page.metadata.logo = plugin.path + "logo.png";

            var type = args.request.type;
            var request = args.request.subrequest;
            p("Type: " + type);
            p("Request: " + request);
            delete args.request;

            pageControllerV3(page, function(nextPageToken) {
            	if (nextPageToken)
            		args.pageToken = nextPageToken;
            	var data = apiV3[type][request](args);
            	data = data.response;
            	nextPageToken = data.nextPageToken;

                return data;
            });
        }
        catch (err) {
            e(err);

            if (err == 'Error: HTTP error: 400') {
                var args1 = '';
                for (var arg in args)
                    args1 += '\n' + arg + ': ' + args[arg]
            
                page.error('The request for the feed contains incompatible args. Please contact facanferff with the following information:\n'+
                	err + args1);
            }
            else if (err == 'Error: HTTP error: 404')
                page.error('This request was deleted or is not available at the moment');
            else
                page.error('There was one unknown error: ' + err);
        }
        page.loading = false;
    });

    function parseChannelHints(data) {
        var obj = {};
        if (data.items[0] && data.items[0].brandingSettings) {
        	data = data.items[0].brandingSettings.hints;
        	for each (var it in data) {
            	obj[it.property] = it.value;
        	}
    	}
        return obj;
    }

    function parseThumbnail(item) {
    	var image = null;
    	if (item.snippet.thumbnails) {
            if (item.snippet.thumbnails.maxres)
                image = item.snippet.thumbnails.maxres.url;
            else if (item.snippet.thumbnails.standard)
                image = item.snippet.thumbnails.standard.url;
            else if (item.snippet.thumbnails.high)
                image = item.snippet.thumbnails.high.url;
            else if (item.snippet.thumbnails.medium)
                image = item.snippet.thumbnails.medium.url;
            else if (item.snippet.thumbnails.default)
                image = item.snippet.thumbnails.default.url;
        }
        return image;
    }

    function getItems(items) {
        var arr = [];

        for (var i in items) {
            try {
                var it = items[i];

                var args = {
                    title: it.snippet.title,
                    image: parseThumbnail(it)
                };

                if (it.kind == "youtube#playlistItem" && it.snippet.resourceId.kind == "youtube#video")
                    args.url = PREFIX + ":video:" + it.snippet.resourceId.videoId;
                else if (it.kind == "youtube#playlist") {
                    var args1 = {
                        "part": "id,snippet",
                        "playlistId": it.id,
                        "request": {
                            "type": "playlistItems",
                            "subrequest": "list"
                        }
                    };
                    args.url = PREFIX + ":v3:request:" + escape(showtime.JSONEncode(args1))+':'+escape(it.snippet.title);
                }
                else if (it.kind == "youtube#subscription" && it.snippet.resourceId.kind == "youtube#channel")
                    args.url = PREFIX + ":user:" + it.snippet.resourceId.channelId;

                arr.push(args);
            }
            catch(ex) {
                showtime.trace(ex, "YOUTUBE-ERROR");
                showtime.trace(ex.stack, "YOUTUBE-ERROR");
            }
        }
        return arr;
    }

    plugin.addURI(PREFIX + ":user:username:(.*)", function(page, username) {	
    	page.redirect(PREFIX + ":user:" + parseChannelId(username));
    });

    plugin.addURI(PREFIX + ":user:(.*)", function(page, user) {
        if (!apiV3.auth.authenticated && user == 'default') {
            showtime.trace('YOUTUBE: User must be authenticated to see this profile');
            page.error('User must be authenticated to see this profile');
            return;
        }

        page.metadata.background = plugin.path + "views/img/background.png";
        page.metadata.backgroundAlpha = 0.5;

        page.metadata.glwview = plugin.path + "views/user2.view";

        page.type = "directory";

        var args = {
            "part": "snippet,contentDetails,brandingSettings"
        };
        if (user != "default")
            args["id"] = user;
        else
            args["mine"] = true;
        var data = apiV3.channels.list(args);

        if (data.error) {
        	page.error(data.error);
        	return;
        }

        data = data.response;

        if (data.items.length == 0) {
        	page.error("There are no details available for this user");
        	return;
        }

        var hints = parseChannelHints(data);

        if (hints["watchpage.background.image.url"]) {
            page.metadata.background = hints["watchpage.background.image.url"];
            page.metadata.backgroundAvailable = true;
        }

        if (data.items[0].brandingSettings.image.bannerTabletExtraHdImageUrl)
            page.metadata.banner = data.items[0].brandingSettings.image.bannerTabletExtraHdImageUrl;

        var uploadsPlaylistId = data.items[0].contentDetails.relatedPlaylists.uploads;
        var favoritesPlaylistId = data.items[0].contentDetails.relatedPlaylists.favorites;
        var likesPlaylistId = data.items[0].contentDetails.relatedPlaylists.likes;
        var watchHistoryPlaylistId = data.items[0].contentDetails.relatedPlaylists.watchHistory;
        var watchLaterPlaylistId = data.items[0].contentDetails.relatedPlaylists.watchLater;

        var channelId = data.items[0].id;

        page.metadata.title = data.items[0].snippet.title;
        page.metadata.logo = data.items[0].snippet.thumbnails.default.url;

        if (apiV3.auth.authenticated && user != 'default') {
   	    if (!hasSubscribed(channelId)) {
                var subscribeButton = page.appendAction("pageevent", "subscribeUser", false, {
      		    title: "Subscribe User"
    		});

    		page.onEvent('subscribeUser', function() {
      		    p("Subscribe: " + channelId);
      		    var data = apiV3.subscriptions.insert(channelId);
      			if (!data.error && data.response.snippet.resourceId.channelId == channelId) {
      		   	    showtime.notify("Subscribed to user succesfully", 2);
      			} else
                            showtime.notify("Failed to subscribed to user", 2);
                });
    	    }
        }

        var lists_tmp = {};

        if (user == "default") {
            if (service.showNewSubscriptionVideos) {
                var data = apiV3.download({
                    "path": 'https://gdata.youtube.com/feeds/api/users/' + user + '/newsubscriptionvideos',
                    "args": {
                        "alt": "json"
                    },
                    "apiV2": true
                });
                data = data.response.feed;
                var newSubscriptionVideos = [];
                for (var i in data.entry) {
                    try {
                        var it = data.entry[i];
                        var id = it.media$group.yt$videoid.$t;

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
                            url: PREFIX + ":video:" + id
                        });
                    }
                    catch(ex) {
                        showtime.trace(ex, "YOUTUBE-ERROR");
                        showtime.trace(ex.stack, "YOUTUBE-ERROR");
                    }
                }

                if (newSubscriptionVideos.length > 0) {
                    newSubscriptionVideos.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: PREFIX + ":feed:" + escape('https://gdata.youtube.com/feeds/api/users/' + user + '/newsubscriptionvideos')+':'+escape('See More')
                    });

                    if (user == "default") page.appendPassiveItem("list", newSubscriptionVideos, { title: "New Subscription Videos" });
                    lists_tmp.newSubscriptionVideos = {
                        array: newSubscriptionVideos,
                        title: "New Subscription Videos"
                    };
                }
            }
        }

        if (service.showFavorites) {
            try {
                var data = apiV3.playlistItems.list({
                    "part": "id,snippet",
                    "playlistId": favoritesPlaylistId
                });

                data = data.response;

                var favorites = getItems(data.items);

                if (favorites.length > 0) {
                    favorites.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: PREFIX + ":feed:" + escape('https://gdata.youtube.com/feeds/api/users/' + user + '/favorites')+':'+escape('See More')
                    });

                    if (user == "default") page.appendPassiveItem("list", favorites, { title: "Favorites" });
                    lists_tmp.favorites = {
                        array: favorites,
                        title: "Favorites"
                    };
                }
            }
            catch(ex) {
                showtime.trace("Couldn't get Favorites", "YOUTUBE-ERROR");
                showtime.trace(ex, "YOUTUBE-ERROR");
                showtime.trace(ex.stack, "YOUTUBE-ERROR");
            }
        }

        if (user == "default") {
            if (service.showWatchLater) {
                var data = apiV3.playlistItems.list({
                    "part": "id,snippet",
                    "playlistId": watchLaterPlaylistId
                });

                data = data.response;

                var watchLater = getItems(data.items);

                if (watchLater.length > 0) {
                    watchLater.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: PREFIX + ":feed:" + escape('https://gdata.youtube.com/feeds/api/users/' + user + '/watch_later')+':'+escape('See More')
                    });

                    if (user == "default") page.appendPassiveItem("list", watchLater, { title: "Watch Later" });
                    lists_tmp.watchLater = {
                        array: watchLater,
                        title: "Watch Later"
                    };
                }
            }

            if (service.showWatchHistory) {
                var data = apiV3.playlistItems.list({
                    "part": "id,snippet",
                    "playlistId": watchHistoryPlaylistId
                });

                data = data.response;

                var watchHistory = getItems(data.items);

                if (watchHistory.length > 0) {
                    watchHistory.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: PREFIX + ":feed:" + escape('https://gdata.youtube.com/feeds/api/users/' + user + '/watch_history')+':'+escape('See More')
                    });

                    if (user == "default") page.appendPassiveItem("list", watchHistory, { title: "Watch History" });
                    lists_tmp.watchHistory = {
                        array: watchHistory,
                        title: "Watch History"
                    };
                }
            }

            if (service.showLikes) {
                var data = apiV3.playlistItems.list({
                    "part": "id,snippet",
                    "playlistId": likesPlaylistId
                });

                data = data.response;

                var likes = getItems(data.items);

                if (likes.length > 0) {
                    likes.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: PREFIX + ":feed:" + escape("https://gdata.youtube.com/feeds/api/playlists/" + likesPlaylistId)+':'+escape('See More')
                    });

                    if (user == "default") page.appendPassiveItem("list", watchLater, { title: "Likes" });
                    lists_tmp.likes = {
                        array: likes,
                        title: "Likes"
                    };
                }
            }


            if (service.showSubscriptions) {
                var data = apiV3.subscriptions.list({
                    "part": "id,snippet",
                    "mine": true
                });

                data = data.response;

                var subscriptions = getItems(data.items);

                if (subscriptions.length > 0) {
                    subscriptions.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: PREFIX + ":feed:" + escape('https://gdata.youtube.com/feeds/api/users/' + user + '/subscriptions')+':'+escape('See More')
                    });

                    if (user == "default") page.appendPassiveItem("list", subscriptions, { title: "Subscriptions" });
                    lists_tmp.subscriptions = {
                        array: subscriptions,
                        title: "Subscriptions"
                    };
                }
            }
        }

        if (service.showPlaylists) {
            try {
                var data = apiV3.playlists.list({
                    "part": "id,snippet",
                    "channelId": channelId
                });

                data = data.response;

                var playlists = getItems(data.items);

                if (playlists.length > 0) {
                    playlists.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: PREFIX + ":feed:" + escape('https://gdata.youtube.com/feeds/api/users/' + user + '/playlists')+':'+escape('See More')
                    });

                    if (user == "default") page.appendPassiveItem("list", playlists, { title: "Playlists" });
                    lists_tmp.playlists = {
                        array: playlists,
                        title: "Playlists"
                    };
                }
            }
            catch(ex) {
                showtime.trace("Couldn't get Playlists", "YOUTUBE-ERROR");
                showtime.trace(ex, "YOUTUBE-ERROR");
                showtime.trace(ex.stack, "YOUTUBE-ERROR");
            }
        }
             
        if (user == "default") {
            if (service.showVideoRecommendations) {
                var data = apiV3.download({
                    "path": 'https://gdata.youtube.com/feeds/api/users/' + user + '/recommendations',
                    "args": {
                        "alt": "json"
                    },
                    "apiV2": true
                });
                data = data.response.feed;
                var videoRecommendations = [];
                for (var i in data.entry) {
                    try {
                        var it = data.entry[i];
                        var id = it.media$group.yt$videoid.$t;
                        var image = "http://i.ytimg.com/vi/" + id + "/hqdefault.jpg";

                        var images = [];
                        if (it.media$group && it.media$group.media$thumbnail) {
                            var images = it.media$group.media$thumbnail;
                        }
                        images.push({
                            width: 400,
                            height: 400,
                            url: plugin.path + "views/img/nophoto.bmp"});
                        images = "imageset:" + showtime.JSONEncode(images);

                        videoRecommendations.push({
                            title: it.title.$t,
                            subtitle: it.author[0].name.$t,
                            image: images,
                            url: PREFIX + ":video:" + id
                        });
                    }
                    catch(ex) {
                        showtime.trace(ex, "YOUTUBE-ERROR");
                        showtime.trace(ex.stack, "YOUTUBE-ERROR");
                    }
                }

                if (videoRecommendations.length > 0) {
                    videoRecommendations.push({
                        title: "See More",
                        image: plugin.path + "views/img/add.png",
                        url: PREFIX + ":feed:" + escape('https://gdata.youtube.com/feeds/api/users/' + user + '/recommendations')+':'+escape('See More')
                    });

                    if (user == "default") page.appendPassiveItem("list", videoRecommendations, { title: "Video Recommendations" });
                    lists_tmp.videoRecommendations = {
                        array: videoRecommendations,
                        title: "Video Recommendations"
                    };
                }
            }
        }

        if (service.showUploads) {
            var data = apiV3.playlistItems.list({
                "part": "id,snippet",
                "playlistId": uploadsPlaylistId
            });

            data = data.response;

            var uploads = getItems(data.items);

            if (uploads.length > 0) {
                uploads.push({
                    title: "See More",
                    image: plugin.path + "views/img/add.png",
                    url: PREFIX + ":feed:" + escape('https://gdata.youtube.com/feeds/api/users/' + user + '/uploads')+':'+escape('See More')
                });

                if (user == "default") page.appendPassiveItem("list", uploads, { title: "Uploads" });
                lists_tmp.uploads = {
                    array: uploads,
                    title: "Uploads"
                };
            }
        }

        if (user != "default") {
            var lists = {
                uploads: lists_tmp.uploads,
                playlists: lists_tmp.playlists,
                favorites: lists_tmp.favorites
            };

            for (var i in lists) {
                var it = lists[i];
                if (it) {
                    page.appendPassiveItem("list", it.array, { title: it.title });
                }
            }
        }

        page.loading = false;
    });

    function getUrlVars(url) {
        var hash, json = {}, hashes = url.split(/\&|%26|%3F/);
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split(/\=|%3D/);
            json[hash[0]] = hash[1];
        }
        return json;
    }

    function getMaps(url) {
        var hash, json = {}, hashes = url.split(/\&/);
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split(/\=/);
            json[hash[0]] = hash[1];
        }
        return json;
    }

    var player = '', fnName = '', outFn = '';

    function unroll(age, url, a) {
        if (age)
            return a.substr(2, 61) + a[82] + a.substr(64, 18) + a[63];
        if (player != url) {
            //showtime.print('player: '+ url);
            var code = showtime.httpReq('http:'+url).toString();
            player = url;
            fnName = code.match(/signature=([^(]*)/)[1];
            var re = new RegExp('function ' + fnName + '\\(([^}]*)');
            var fnText = 'function ' + fnName + '(' + re.exec(code)[1] + '}';
            outFn = fnText;
            var re = /=([^\(]*)/g;
            var match = re.exec(fnText);
            //showtime.print(fnText);
            while (match) {
                if (outFn.search('function '+match[1]+'\\(') == -1) { // check if we already included this function
                    var re2 = new RegExp('function ' + match[1] + '\\(([^}]*)');
                    var match2 = re2.exec(code);
                    if (match2) {
                      outFn = 'function ' + match[1] + '(' + match2[1] + '};' + outFn;
                    } else { // look for vars
                        var varName = match[1].substr(0, match[1].indexOf('.'));
                        if (match[1].split('.').pop() != 'split')
                        if (outFn.search('var '+varName+'=') == -1) { //check if we already included this var
                            re2 = new RegExp('var ' + varName + '=([\\s\\S]*?)};');
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
        //showtime.print(outFn);
        var result;
        try {
            result = eval(outFn + fnName + '(a)');
        } catch (err) {};
        return result;
    }

    function getVideosList(page, id, number_items) {
        var doc = showtime.httpReq('http://www.youtube.com/watch?v='+id, {}, {
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:15.0) Gecko/20100101 Firefox/15.0.1'   
        }).toString();

        var titleMatch = doc.match(/<meta property="og:title" content="(.+?)">/);
        if (titleMatch)
            var title = titleMatch[1];

        var encoded_url_map = '';
        var json = showtime.JSONDecode(doc.match(/;ytplayer\.config\s*=\s*(\{.*?\});/)[1]);
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
                   'sts':'1588'
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
                var realUrl = url_data.url + '?', first = true;
                for (i in url_data) {
                    if (i != 'url' && i != 's' && i != 'sig') {
                        if (!first)
                            realUrl+= '&' + i + '=' + url_data[i];
                        else {
                            first = false;
                            realUrl+= i + '=' + url_data[i];
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
            if (service.maximumResolution && j > parseInt(service.maximumResolution) || quality_added.indexOf(item.quality)!=-1)
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

        if (videos_list.length == 0) {
            if (doc.indexOf('h1 id="unavailable-message" ') != -1) {
                doc = doc.slice(doc.indexOf('h1 id="unavailable-message" '));
                doc = doc.replace(/\n/g, '');
                var error = doc.match(/class="message">(.+?)<\/h1>/);

                return error[1];
            }
        }

        return videos_list;
    }

    function playVideo(page, title, id, video_url) {
        var url = unescape(unescape(video_url));
        var videoParams = {      
            title: showtime.entityDecode(unescape(unescape(title))),
            canonicalUrl: PREFIX + ':video:' + id,
            sources: [{	
                url: url  
            }]    
        }
        if (service.universalSubtitles == '1')
            videoParams.subtitles = getUniversalSubtitles(id);
        if (service.transcribedCaptions == '1' || service.automaticSpeechCaptions == '1') {
            var caption = getDefaultCaptionLink(id);
            if (caption) {
                var data = new XML(showtime.httpGet(caption + '&type=list&tlangs=1&asrs=1').toString());
            
                if (service.transcribedCaptions == '1') {
                    var subtitles = getTranscribedCaptions(caption, data);

                    for (var i in subtitles) {
                        var track = subtitles[i];
                        videoParams.subtitles.push(track);
                    }
                }
                if (service.automaticSpeechCaptions == '1') {
                    var subtitles = getAutomaticSpeechCaptions(caption, data);

                    for (var i in subtitles) {
                        var track = subtitles[i];
                        videoParams.subtitles.push(track);
                    }
                }
            }
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

    plugin.addURI(PREFIX + ":video:(.*)", function(page, id) {
    	page.redirect(PREFIX + ":video:" + service.mode + ":" + id);
    });

    plugin.addURI(PREFIX + ":video:simple:(.*)", function(page, id) {
        try {
            var video_url = getVideosList(page, id, 1);

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

            page.redirect(PREFIX + ":video:stream:" + escape(title) + ":" + id + ":" + video_url);
        }
        catch (err) {
            if (err == "Error: HTTP error: 404")
                err = "The video is unavailable at this moment.";

            e(err);
            page.error(err);
            showtime.trace(err);
            return;
        }
    
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":video:simple:(.*):(.*)", function(page, title, id) {
        try {
            var video_url = getVideosList(page, id, 1);

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
        }
        catch (err) {
            if (err == "Error: HTTP error: 404")
                err = "The video is unavailable at this moment.";

            e(err);
            page.error(err);
            showtime.trace(err);
            return;
        }
    
        page.loading = false;
    });
  
    plugin.addURI(PREFIX + ":video:advanced:(.*)", function(page, id) {
        var videoId = id;

        var data = apiV3.videos.list({
            "part": "id,snippet,contentDetails,statistics,status,topicDetails",
            "id": id
        });

        if (data.error) {
            page.error(data.error);
            return;
        }

        pageMenu(page);

        var video = data.response.items[0];

        var events = false;
    
        page.metadata.icon = "http://i.ytimg.com/vi/" + id + "/hqdefault.jpg";

        page.type = "directory";

        page.metadata.glwview = plugin.path + "views/video.view";

        for (var title in apiV3.videos.information) {
            var code = apiV3.videos.information[title];
            try {
                if (title == 'Rating') {
                    /*page.metadata.rating;
                    page.appendPassiveItem("rating", eval(element[1]));*/
                }
                else {
                    page.appendPassiveItem("label", eval(code), {title: title+ ": "}); 
                }
            }
            catch(err) {
                showtime.trace('Video ' + id +' doesn\'t have a ' + title +' tag!');
                e(err);
            }
        }

        var durationString = video.contentDetails.duration;
        var match = durationString.match(/PT(.+?)M(.+?)S/);
        if (match) {
            var minutes = parseInt(match[1]);
            var seconds = parseInt(match[2]);

            page.appendPassiveItem("label", minutes + ":" + seconds, { title: "Duration: " }); 
        }
    
        page.appendPassiveItem("divider");  
    
        page.appendPassiveItem("bodytext", new showtime.RichText(video.snippet.description));
    
        var channelId = video.snippet.channelId;
        var author = video.snippet.channelTitle;
        page.appendAction("navopen", PREFIX + ':user:' + channelId, true, {                  
            title: author     
        });

        var videos_list = getVideosList(page, id, 'any');

        if (typeof(videos_list) == "string") {
            page.error(videos_list);
        }
        else {
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
                page.appendAction("navopen", PREFIX + ':video:stream:'+escape(title)+':'+escape(id) + ':' + item.video_url, true, {      
                    title: item.quality
                });

                var image = quality_icon[item.quality];
                if (!image || image == "") image = plugin.path + "views/img/nophoto.bmp";
                videos.push({
                    title: item.quality,
                    image: image,
                    url: PREFIX + ':video:stream:'+escape(title)+':'+escape(id) + ':' + item.video_url
                });
            }
            page.appendPassiveItem("list", videos, { title: "Video Playback" });

            var extras = [];
            extras.push({
                title: 'User Profile',
                image: plugin.path + "views/img/logos/user.png",
                url: PREFIX + ':user:' + channelId
            });

            for (var i in video.link) {
                var feed = video.link[i];
                if (feed.rel == "http://gdata.youtube.com/schemas/2007#video.trailer-for") {
                    var match = feed.href.match('videos/([^?]*)');
                    if (match) {
                        page.appendAction("navopen", PREFIX + ':video:' + escape(match[1]), true, {      
                            title: 'Movie'
                        });
                        extras.push({
                            title: 'Movie',
                            image: plugin.path + "views/img/logos/movies.png",
                            url: PREFIX + ':video:' + escape(match[1])
                        });
                    }
                }

                if (feed.rel == "http://gdata.youtube.com/schemas/2007#video.trailers") {
                    page.appendAction("navopen", PREFIX + ':feed:' + escape(feed.href)+':Trailers', true, {
                        title: 'Trailers'
                    });
                    extras.push({
                        title: 'Trailers',
                        image: plugin.path + "views/img/logos/trailers.png",
                        url: PREFIX + ':feed:' + escape(feed.href)+':Trailers'
                    });
                }
            }

            var args = {
                "part": "id,snippet",
                "type": "video",
                "relatedToVideoId": id,
                "request": {
                    "type": "search",
                    "subrequest": "list"
                }
            };

            page.appendAction("navopen", PREFIX + ":v3:request:" + escape(showtime.JSONEncode(args))+ ':' + escape('Related Videos'), true, {
                title: 'Related videos'          
            });
            extras.push({
                title: 'Related',
                image: plugin.path + "views/img/nophoto.bmp",
                url: PREFIX + ":v3:request:" + escape(showtime.JSONEncode(args))+':'+escape('Related Videos')
            });
    
            for (var i in video.link) {
                var link = video.link[i];
                if (link.rel == 'http://gdata.youtube.com/schemas/2007#video.responses') {
                    page.appendAction("navopen", PREFIX + ':feed:'+escape('https://gdata.youtube.com/feeds/api/videos/'+id+'/responses')+':'+escape('Response videos'), true, {
                        title: 'Response videos'          
                    });
                    extras.push({
                        title: 'Responses',
                        image: plugin.path + "views/img/nophoto.bmp",
                        url: PREFIX + ':feed:'+escape('https://gdata.youtube.com/feeds/api/videos/'+id+'/responses')+':Responses'
                    });
                }
            }
            if (extras.length > 0)
                page.appendPassiveItem("list", extras, { title: "Extras" });

            page.appendAction("pageevent", "like", true, {                  
                title: 'Like',
                icon: plugin.path + "views/img/like.png",
                listActions: true      
            });
            page.onEvent('like', function () {
                api.like(videoId, "like");
            });

            page.appendAction("pageevent", "dislike", true, {                  
                title: 'Dislike',
                icon: plugin.path + "views/img/dislike.png",
                listActions: true      
            });
            page.onEvent('dislike', function () {
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

            if (apiV3.auth.authenticated) {
                page.appendAction("pageevent", "addToPlaylist", true, {                  
                    title: 'Add to Playlist',
                    icon: plugin.path + "views/img/add.png",
                    listActions: true      
                });
                page.onEvent('addToPlaylist', function() {
                    var args = {
                        "videoId": videoId
                    };
                    page.redirect(PREFIX + ':playlist:add:' + escape(showtime.JSONEncode(args)));
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
        }
    
        page.metadata.logo = plugin.path + "logo.png";

        events = true;
    
        page.loading = false;
    });

	function pageControllerAddToPlaylist(page, args0, loader) {
        page.contents = 'list';
        var offset = 1;
        var total_items = 0;
        var max_items = service.entries;

        function paginator() {      
            var num = 0;

            var nextPageToken = null;

            while(total_items < max_items) {	
                var data = loader(nextPageToken);

                if (data.nextPageToken)
                    nextPageToken = data.nextPageToken;

                if (data.pageInfo) {
                    page.entries = data.pageInfo.totalResults;
                    total_items += data.pageInfo.resultsPerPage;
                }
                else {
                    page.entries = 1;
                    total_items = 1;
                }

                if (page.entries < max_items)
                    max_items = page.entries;

                if (page.entries > service.entries)
                    page.entries = service.entries;
                var c = 0;

                if (data.items.length == 0) {
                    page.appendItem(PREFIX + ':start', 'directory', { title: 'This feed does not contain any item. Sorry about that.' });
                }

                for (var i in data.items) {
                    var entry = data.items[i];
                
                    try {
                        c++;
                        var id, url;

                        var metadata = {};

                        metadata.icon = parseThumbnail(entry);

                        var playlistTitle = entry.snippet.title;

                        var title = playlistTitle;

                        metadata.title = title;;

                        var desc = "";
                        if (entry.snippet.description) {
                            desc = entry.snippet.description;
                        }

                        var lines = "";
                        var desc_split = desc.split("\n");
                        for (var i = 0; i < desc_split.length && i < 2; i++) {
                            lines += desc_split[i] + "\n";
                        }  

                        metadata.description = new showtime.RichText(lines);

                        var images = [];
                        images.push({
                        	width: 400,
                        	height: 400,
                        	url: metadata.icon
                        });
                        images.push({
                            width: 20,
                            height: 20,
                            url: plugin.path + "views/img/nophoto.bmp"});
                        images = "imageset:" + showtime.JSONEncode(images);
                        metadata.icon = images;

						if (entry.kind == "youtube#playlist") {
							var args = args0;
                        	args.playlistId = entry.id;
                    		page.appendItem(PREFIX + ":playlist:add:" + escape(showtime.JSONEncode(args)), "directory", metadata);
                        }
                    }
                    catch(err) {
                        e(err);
                    }
                }
                page.loading = false;	
                num += c;

                if(c == 0 || offset > api.args_common['max-results'] || num > parseInt(service.entries) || c == max_items || total_items >= max_items)	  
                    break;
            }
            offset += num;

            return offset < page.entries;    
        }
    
        page.type = "directory";
        paginator();    
        page.paginator = paginator;
    }

	plugin.addURI(PREFIX + ":playlist:add:(.*)", function(page, args0) {
		args0 = showtime.JSONDecode(unescape(args0));
		if (args0.playlistId) {
			if (apiV3.playlistItems.insert(args0.playlistId, args0.videoId)) {
				showtime.notify("Video added succesfully", 2);
			}
			else {
				showtime.notify("There was one error while trying to add video", 3);
			}
			//page.redirect(args0.referrer);
			page.redirect(PREFIX + ":user:default");
		}
		else {
			pageControllerAddToPlaylist(page, args0, function(nextPageToken) {
            	var args = {
            		"part": "id,snippet",
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
    plugin.addURI(PREFIX + ":video:stream:(.*):(.*):(.*)", function(page, title, id, video_url) {
        playVideo(page, title, id, video_url);
    });
  

    function getCatList(link) {
        var atom = new Namespace("http://www.w3.org/2005/Atom");
        if (service.enableDebug)
            showtime.print(link);
      
        var data = new XML(valid_xml(showtime.httpGet(link).toString()));
        var list = [];
        list.push(['all', 'All', true]);
      
        for (var i in data.atom::category) {
            var entry = data.atom::category[i];
            var item = [entry.@term, entry.@label];
            list.push(item);
        }

        var categories_str = '';
        for (var i in list) {
            var els = '';
            for (var j in list[i]) {
                els += "'" + list[i][j] + "',";
            }
            els = els.slice(0, els.length - 1);
            categories_str += '[' + els + '],';
        }

        var res = "[" + categories_str.slice(0, categories_str.length - 1) + "]";
      
        return res;
    }
  
    //workaround for "Syntax Error: xml is a reserved identifier" - From Andreus Sebes's WebMedia
    function valid_xml(xmltext)
    {
        xmltext=xmltext.replace(/^[\s\S]*?(<[^\?!])/, "$1");

        return xmltext;
    }
  
    function getTime(date) {
        var time = date.match('(.*)-(.*)-(.*)T(.*):(.*):(.*)..*Z');
        if (time) {
            var dateVar = new Date(time[1], time[2], time[3], time[4], time[5], time[6]);
            return dateVar;
        }
        return -1;
    }
  
    function getDistanceTime(date) {
        if (date == -1)
            return null;

        var today = new Date();
        var years_past = today.getFullYear() - date.getFullYear();
        var months_past = (today.getMonth() + 1) - date.getMonth();
        var days_past = today.getDate() - date.getDate();
        var hours_past = today.getHours() - date.getHours();
        var minutes_past = today.getMinutes() - date.getMinutes();
        var seconds_past = today.getSeconds() - date.getSeconds();
      
        if (years_past >= 1) {
            if (months_past < 0)
                return (12 + months_past) + " months ago";
            else
                return years_past + " years ago";
        }
        else if ( years_past < 1 && months_past > 0) {
            if (months_past == 1)
                return "last month";
            return months_past + " months ago";
        }
        else if (days_past > 0 && months_past == 0) {
            if (days_past == 1)
                return "Yesterday";
            return days_past + " days ago";
        }
        else if (hours_past > 0 && days_past == 0) {
            if (hours_past == 1)
                return hours_past + " hour ago";
            return hours_past + " hours ago";
        }
        else if (hours_past == 0 && days_past == 0) {
            if (minutes_past == 1)
                return minutes_past + " minute ago";
            return minutes_past + " minutes ago";
        }
        else if (seconds_past > 0 && minutes_past < 0)
            return seconds_past + " seconds ago";
            
        return date;
    }
  
  
/*------------------------------------------------------------------------------
 * Functions for Youtube API
 -----------------------------------------------------------------------------*/
    function Youtube_API() {
        // Standard feeds
        this.standard_feeds = [
        ['Top Rated', 'https://gdata.youtube.com/feeds/api/standardfeeds/top_rated', 'http://i1163.photobucket.com/albums/q552/facanferff/top_rated.png'],
        ['Top Favorites', 'https://gdata.youtube.com/feeds/api/standardfeeds/top_favorites', 'http://i1163.photobucket.com/albums/q552/facanferff/favorites.png'],
        ['Most Shared', 'https://gdata.youtube.com/feeds/api/standardfeeds/most_shared', 'http://i1163.photobucket.com/albums/q552/facanferff/most_shared.png'], // Experimental feature
        ['Most Popular', 'https://gdata.youtube.com/feeds/api/standardfeeds/most_popular', 'http://i1163.photobucket.com/albums/q552/facanferff/most_popular.png'],
        ['Most Recent', 'https://gdata.youtube.com/feeds/api/standardfeeds/most_recent', 'http://i1163.photobucket.com/albums/q552/facanferff/recent.png'],
        ['Most Discussed', 'https://gdata.youtube.com/feeds/api/standardfeeds/most_discussed', 'http://i1163.photobucket.com/albums/q552/facanferff/most_discussed.png'],
        ['Most Responded', 'https://gdata.youtube.com/feeds/api/standardfeeds/most_responded', 'http://i1163.photobucket.com/albums/q552/facanferff/most_responded.png'],
        ['Recently Featured', 'https://gdata.youtube.com/feeds/api/standardfeeds/recently_featured', 'http://i1163.photobucket.com/albums/q552/facanferff/featured.png'],
        ['Trending videos', 'https://gdata.youtube.com/feeds/api/standardfeeds/on_the_web', 'http://i1163.photobucket.com/albums/q552/facanferff/trending.png'] // Experimental feature
        ];
    
        // Channel feeds
        this.channel_feeds = [
        ['Most viewed', 'https://gdata.youtube.com/feeds/api/channelstandardfeeds/most_viewed', 'http://i1163.photobucket.com/albums/q552/facanferff/most_viewed.jpg'],
        ['Most subscribed', 'https://gdata.youtube.com/feeds/api/channelstandardfeeds/most_subscribed', 'http://i1163.photobucket.com/albums/q552/facanferff/favorites.png']
        ];

        // Live feeds
        this.live_feeds = [
        ['Featured', 'https://gdata.youtube.com/feeds/api/charts/live/events/featured', 'http://i1163.photobucket.com/albums/q552/facanferff/featured.png'],
        ['Live Now', 'https://gdata.youtube.com/feeds/api/charts/live/events/live_now', 'http://i1163.photobucket.com/albums/q552/facanferff/favorites.png'],
        ['Upcoming', 'https://gdata.youtube.com/feeds/api/charts/live/events/upcoming', 'http://i1163.photobucket.com/albums/q552/facanferff/trending.png'],
        ['Recently Broadcasted', 'https://gdata.youtube.com/feeds/api/charts/live/events/recently_broadcasted', 'http://i1163.photobucket.com/albums/q552/facanferff/recent.png']
        ];
    
        // Movie feeds
        this.movie_feeds = [
        ['Featured', 'https://gdata.youtube.com/feeds/api/charts/movies/featured', 'http://i1163.photobucket.com/albums/q552/facanferff/featured.png'],
        ['Most Popular', 'https://gdata.youtube.com/feeds/api/charts/movies/most_popular', 'http://i1163.photobucket.com/albums/q552/facanferff/most_popular.png'],
        ['Most Recent', 'https://gdata.youtube.com/feeds/api/charts/movies/most_recent', 'http://i1163.photobucket.com/albums/q552/facanferff/recent.png'],
        ['Trending', 'https://gdata.youtube.com/feeds/api/charts/movies/trending', 'http://i1163.photobucket.com/albums/q552/facanferff/trending.png']
        ];

        // Show feeds
        this.show_feeds = [
        ['Most Popular', 'https://gdata.youtube.com/feeds/api/charts/shows/most_popular', 'http://i1163.photobucket.com/albums/q552/facanferff/most_popular.png'],
        ['Latest', 'https://gdata.youtube.com/feeds/api/charts/shows/latest', 'http://i1163.photobucket.com/albums/q552/facanferff/recent.png']
        ];
    
        // Trailer feeds
        this.trailer_feeds = [
        ['Most Popular', 'https://gdata.youtube.com/feeds/api/charts/trailers/most_popular', 'http://i1163.photobucket.com/albums/q552/facanferff/most_popular.png'],
        ['Most Recent', 'https://gdata.youtube.com/feeds/api/charts/trailers/most_recent', 'http://i1163.photobucket.com/albums/q552/facanferff/recent.png']
        ];

        this.mediatypes = [
            'Feature-length film',
            'Short film',
            'Full episode',
            'Show clip',
            'Trailer'
        ];

        this.moviegenres = [
            'Action & Adventure',
            'Animation & Cartoons',
            'Classics',
            'Comedy',
            'Crime',
            'Drama',
            'Documentary & Biography',
            'Family',
            'Foreign',
            'Horror',
            'Mystery & Suspense',
            'Romance',
            'Science Fiction',
            'null',
            'Sports',
            'null',
            'null',
            'Indian Cinema',
            'Nigerian Cinema'
        ];
    
        this.user_profile_settings = {
            'Username':'data.yt$username.$t',
            'First name':'data.yt$firstName.$t',
            'Last name':'data.yt$lastName.$t',
            'Age':'data.yt$age.$t',
            'Gender':'data.yt$gender.$t',
            'Location':'data.yt$location.$t',
            'Hometown':'data.yt$hometown.$t',
            'Company':'data.yt$company.$t',
            'Occupation':'data.yt$occupation.$t',
            'School':'data.yt$school.$t',
            'About me':'data.yt$aboutMe.$t',
            'Hobbies':'data.yt$hobbies.$t',
            'Movies':'data.yt$movies.$t',
            'Music':'data.yt$music.$t',
            'Books':'data.yt$books.$t',
            'Videos uploaded':'data.yt$channelStatistics.videoCount.$t',
            'Channel viewed':'data.yt$channelStatistics.viewCount.$t',
            'Subscribers':'data.yt$statistics.subscriberCount.$t'
        };

        this.orderby_values = [
            ['Published', 'published', 'video/playlist'],
            ['Relevance', 'relevance', 'video'],
            ['Views', 'viewCount', 'video/playlist'],
            ['Rating', 'rating', 'rating'],
            ['Position', 'position', 'playlist'],
            ['Comments', 'commentCount', 'playlist'],
            ['Duration', 'duration', 'playlist'],
            ['Title', 'title', 'video/playlist']
        ];
    
        this.reset_args = function() {
            this.args_common = {
                'alt' : 'json',
                'max-results' : 25,
                'safeSearch' : (service.safeSearch)?service.safeSearch: 'moderate'
            }

            if (service.resolutionFilter == 'hd')
                this.args_common['hd'] = true;
        };
        this.reset_args();
    
        // Headers for HTTP requests
        this.headers_common = {
            'GData-Version' : '2.1',
            'X-GData-Key' : 'key=AI39si7gfa8PEGC6qMb5Kk04aPInFlZVRIPZio6fNE9-0uwS4Qvo9dbhGxzeWIEQ8J4hMHGMtw2xOHuDGn3ped2EktTAVqCU9w',
            'Host': 'gdata.youtube.com'
        }
    
        // Like a video given its id
        this.like = function(id, type) {
            var request = '<?xml version="1.0" encoding="UTF-8"?>'+
            '<entry xmlns="http://www.w3.org/2005/Atom" '+
            'xmlns:yt="http://gdata.youtube.com/schemas/2007">'+
            '<yt:rating value="'+type+'"/></entry>';
        
            this.headers_common["Content-type"] = "application/atom+xml";
        
            try {
                var data = showtime.httpPost("http://gdata.youtube.com/feeds/api/videos/"+id+"/ratings", request, null, this.headers_common);
                showtime.notify(type.charAt(0).toUpperCase() + type.slice(1) + 'd video succesfully', 2);
            }
            catch(ex) {
                showtime.notify('Error while trying to ' + type + ' video: ' + ex, 2);
                showtime.trace(ex, "YOUTUBE-ERROR");
                showtime.trace(ex.stack, "YOUTUBE-ERROR");
            }
        }
    
        // Comment a video given its id
        this.comment = function(id) {
            var search = showtime.textDialog('Your comment to the video: ', true, true);
            if (search.rejected)
                return -1 //canceled

            if (search.input > "") {
                var request = '<?xml version="1.0" encoding="UTF-8"?>'+
                '<entry xmlns="http://www.w3.org/2005/Atom" '+
                'xmlns:yt="http://gdata.youtube.com/schemas/2007">'+
                '<content>'+search.input+'</content>'+
                '</entry>';
        
                this.headers_common["Content-type"] = "application/atom+xml";
        
                try {
                    var data = showtime.httpPost("http://gdata.youtube.com/feeds/api/videos/"+id+"/comments", request, null, this.headers_common);
                    showtime.notify('Commented video succesfully', 2);
                }
                catch(ex) {
                    showtime.notify('Error while trying to comment video: ' + ex, 2);
                    showtime.trace(ex, "YOUTUBE-ERROR");
                    showtime.trace(ex.stack, "YOUTUBE-ERROR");
                }
            }

            return 0;
        }
    
        this.addFavorite = function(id) {
            var request = '<?xml version="1.0" encoding="UTF-8"?>'+
            '<entry xmlns="http://www.w3.org/2005/Atom">'+
            '<id>'+id+'</id>'+
            '</entry>';
        
            this.headers_common["Content-type"] = "application/atom+xml";
        
            try {
                var data = showtime.httpPost("http://gdata.youtube.com/feeds/api/users/default/favorites", request, null, this.headers_common);
                showtime.notify('Added video to Favorites succesfully', 2);
            }
            catch(ex) {
                showtime.notify('Error while trying to add video to Favorites: ' + ex, 2);
                showtime.trace(ex, "YOUTUBE-ERROR");
                showtime.trace(ex.stack, "YOUTUBE-ERROR");
            }
        }
    
        this.watchLater = function(id) {
            var request = '<?xml version="1.0" encoding="UTF-8"?>'+
            '<entry xmlns="http://www.w3.org/2005/Atom" '+
            'xmlns:yt="http://gdata.youtube.com/schemas/2007">'+
            '<id>'+id+'</id>'+
            '<yt:position>1</yt:position>'+
            '</entry>';
        
            this.headers_common["Content-type"] = "application/atom+xml";
        
            try {
                var data = showtime.httpPost("http://gdata.youtube.com/feeds/api/users/default/watch_later", request, null, this.headers_common);
                showtime.notify('Added video to Watch Later succesfully', 2);
            }
            catch(ex) {
                showtime.notify('Error while trying to add video to Watch Later: ' + ex, 2);
                showtime.trace(ex, "YOUTUBE-ERROR");
                showtime.trace(ex.stack, "YOUTUBE-ERROR");
            }
        }
    
        this.addContact = function(id) {
            var request = '<?xml version="1.0" encoding="UTF-8"?>'+
            '<entry xmlns="http://www.w3.org/2005/Atom" '+
            'xmlns:yt="http://gdata.youtube.com/schemas/2007">'+
            '<yt:username>'+id+'</yt:username>'+
            '</entry>';
        
            this.headers_common["Content-type"] = "application/atom+xml";
        
            try {
                var data = showtime.httpPost("http://gdata.youtube.com/feeds/api/users/default/contacts", request, null, this.headers_common);
                showtime.notify('Added contact succesfully', 2);
            }
            catch(ex) {
                showtime.notify('Error while trying to add contact: ' + ex, 2);
                showtime.trace(ex, "YOUTUBE-ERROR");
                showtime.trace(ex.stack, "YOUTUBE-ERROR");
            }
        }
    
        this.subscribe = function(id, term) {
            var request = '<?xml version="1.0" encoding="UTF-8"?>'+
            '<entry xmlns="http://www.w3.org/2005/Atom" '+
            'xmlns:yt="http://gdata.youtube.com/schemas/2007">'+
            '<category scheme="http://gdata.youtube.com/schemas/2007/subscriptiontypes.cat" '+
            'term="'+term+'"/>'+
            '<yt:username>'+id+'</yt:username>'+
            '</entry>';
        
            this.headers_common["Content-type"] = "application/atom+xml";
        
            try {
                var data = showtime.httpPost("http://gdata.youtube.com/feeds/api/users/default/subscriptions", request, null, this.headers_common);
                showtime.notify('Subscribed to ' + term + ' succesfully', 2);
            }
            catch(ex) {
                showtime.notify('Error while trying to subscribe to ' + term + ': ' + ex, 2);
                showtime.trace(ex, "YOUTUBE-ERROR");
                showtime.trace(ex.stack, "YOUTUBE-ERROR");
            }
        }
    }

    function getUniversalSubtitles(video_id) {
        var args = 'video_url=' + escape('http://youtube.com/watch?v=' + video_id);
        var data = showtime.httpPost('http://www.universalsubtitles.org/en/videos/create/', args).toString();

        if (data.indexOf("This video doesn't have any subtitles yet :(") != -1)
            return [];
    
        var begin = data.indexOf('<ul id="subtitles-menu" >');
        var end = data.indexOf('</ul>', begin);
        var nice = data.slice(begin, end);
        var split = nice.split('</li>');
    
        var subtitles = [];
        
        for (var i in split) {
            var item = split[i];
            var language = item.match('<a href="/en/videos/(.*)/(.*)/(.*)/">');
            if (!language) {
                language = item.match('<a href="/en/videos/(.*)/">');

                if (!language || (item.indexOf('<span class="done_percentage">(0 Lines)</span>') != -1 || 
                    item.indexOf('<span class="done_percentage">(in progress)</span>') != -1))
                    continue;

                subtitles.push({
                    url: 'http://www.universalsubtitles.org/widget/download_srt/?video_id=' + language[1],
                    language: getValue(item, '<span class="done_indicator"></span>', '<span class="done_percentage">').replace(/\n/g, '').replace(/ /g, '') + ' - Universal Subtitles'
                });
            }
            else {
                if (item.indexOf('<span class="done_percentage">(0 Lines)</span>') != -1 || 
                    item.indexOf('<span class="done_percentage">(in progress)</span>') != -1)
                    continue;

                subtitles.push({
                    url: 'http://www.universalsubtitles.org/widget/download_srt/?video_id=' + language[1] + '&lang_pk=' + language[3],
                    language: language[2] + ' - Universal Subtitles'
                });
            }
        }
        return subtitles;
    }

    function getDefaultCaptionLink(id) {
        var data = showtime.httpGet('http://www.youtube.com/watch?v='+id).toString();

        var cc_init = data.indexOf('ttsurl='); 
        if (cc_init == -1)
            return null;

        var cc_end = data.indexOf('\\u0026amp;', cc_init);
        if (cc_end == -1)
            return null;

        var caption = unescape(data.slice(cc_init + 7, cc_end));
        return caption;
    }

    function getTranscribedCaptions(caption, xml) {
        var subtitles = [];
        var langs = [];

        var data = xml;
        for (var i in data.track) {
            var track = data.track[i];
            var kind = track.@kind;
            var lg = track.@lang_code;
            var title = track.@lang_translated;

            if (kind == 'asr')
                continue;
            
            var t = [lg, title];

            langs.push(t);
        }
        
        for (var i in langs) {
            var lg = langs[i];
            var cc = caption + '&lang=' + lg[0] + '&format=srt';

            subtitles.push({
                'url': cc,
                'language': lg[1] + ' - Transcribed caption'
            });
        }
        return subtitles;
    }

    function getAutomaticSpeechCaptions(caption, xml) {
        var subtitles = [];
        var langs = [];

        var data = xml;
        for (var i in data.track) {
            var track = data.track[i];
            var lg = track.@lang_code;
            var title = track.@lang_translated;
            var kind = track.@kind.toString();

            if ((kind && kind != "") != true)
                continue;

            var t = [lg, title, kind];

            langs.push(t);
        }
        
        for (var i in langs) {
            var lg = langs[i];
            
            var cc = caption + '&lang=' + lg[0] + '&format=srt&kind=' + lg[2];

            subtitles.push({
                'url': cc,
                'language': lg[1] + ' - Automatic Speech'
            });
        }
        return subtitles;
    }

    function getValue(url, start_string, end_string)
    {
        var begin_temp = url.indexOf(start_string) + start_string.toString().length;
        var end_temp = url.indexOf(end_string, begin_temp);
		
        var string = url.slice(begin_temp, end_temp);
        return unescape(string);
    }

    function getUrlArgs(url) {
        var link = url;

        var result = {
            url: link,
            args: {}
        };

        var args = {};

        if (link.indexOf('?') != -1) {
            var args_tmp = url.slice(url.indexOf('?') + 1);            
            args_tmp = args_tmp.split('&');

            for (var i in args_tmp) {
                var arg = args_tmp[i];
                var arg_tmp = arg.split('=');
                args[arg_tmp[0]] = arg_tmp[1];
            }

            link = link.slice(0, link.indexOf('?'));
        }

        result.url = link;
        result.args = args;
        return result;
    }

    function putUrlArgs(url, args) {
        var link = url + '?';
        var args_end = false;
        
        for (var i in args) {
            link += i + '=' + args[i] + '&';
            args_end = true;
        }

        if (args_end)
            link = link.slice(0, link.length - 1);

        return link;
    }

    function date_string(date_str) {
        var date1 = date_str;
        var split = date1.split('-');
        var day = split[2].slice(0, 2);
        var month = split[1];
        var year = split[0];

        var date = day;
        if (day.slice(1, 2) == '1' && day != '11') {
            date += 'st';
        }
        else if (day.slice(1, 2) == '2' && day != '12') {
            date += 'nd';
        }
        else if (day.slice(1, 2) == '3' && day != '13') {
            date += 'rd';
        }
        else date += 'th';

        switch (month) {
            case '01':
                date += ' January';
                break;
            case '02':
                date += ' February';
                break;
            case '03':
                date += ' March';
                break;
            case '04':
                date += ' April';
                break;
            case '05':
                date += ' May';
                break;
            case '06':
                date += ' June';
                break;
            case '07':
                date += ' July';
                break;
            case '08':
                date += ' August';
                break;
            case '09':
                date += ' September';
                break;
            case '10':
                date += ' October';
                break;
            case '11':
                date += ' November';
                break;
            case '12':
                date += ' December';
                break;
        }
        date += ', ' + year;
        return date;
    }

    function insertionSort(array, field) {
        for (var i = 0, j, tmp; i < array.length; ++i) {
            tmp = array[i];

            for (j = i - 1; j >= 0 && array[j][field] > tmp[field]; --j)
                array[j + 1] = array[j];
            array[j + 1] = tmp;
        }

        return array;
    }

    function itemOptions(item, entry) {
        // TODO: Maximum resolution to be played

        item.addOptURL("More from this user", PREFIX + ':user:username:' + item.author);

        item.addOptAction("Like video", "like");
        item.onEvent('like', function (item) {
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

        if (apiV3.auth.authenticated) {
            var args = {
                "videoId": item.id
            };
            item.addOptURL("Add to Playlist", PREFIX + ':playlist:add:' + escape(showtime.JSONEncode(args)));
        }

        for (var i in entry.link) {
            var link = entry.link[i];

            if (link.rel == "http://gdata.youtube.com/schemas/2007#video.related") {
                item.addOptURL("Related", PREFIX + ':feed:' + escape(link.href)+':Related');
            }

            if (link.rel == "http://gdata.youtube.com/schemas/2007#video.responses") {
                item.addOptURL("Responses", PREFIX + ':feed:' + escape(link.href)+':Responses');
            }

            if (link.rel == "http://gdata.youtube.com/schemas/2007#video.trailer-for") {
                var match = link.href.match('videos/([^?]*)');
                if (match) {
                    item.addOptURL("Redirect to Movie", PREFIX + ':video:' + escape(match[1]));
                }
            }

            if (link.rel == "http://gdata.youtube.com/schemas/2007#video.trailers") {
                item.addOptURL("Trailers", PREFIX + ':feed:' + escape(link.href)+':Trailers');
            }

            if (link.rel == "http://gdata.youtube.com/schemas/2007#video.show") {
                item.addOptURL("Redirect to Show", PREFIX + ':feed:' + escape(link.href + "/content")+':'+escape('Redirect to Show'));
            }

            if (link.rel == "http://gdata.youtube.com/schemas/2007#video.season") {
                item.addOptURL("Redirect to Season", PREFIX + ':feed:' + escape(link.href + "/episodes")+':'+escape('Redirect to Season'));
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
        its.sort(function(a,b) {
            if (!b[field]) return null;
            return b[field] > a[field]
        });
        if (reverse) its.reverse();

        return its;
    }

    function parseChannelId(username) {
    	var data = apiV3.channels.list({
    		"part": "id",
    		"forUsername": username
    	});

    	try {
    		return data.response.items[0].id;
    	}
    	catch (ex) {
            e(ex);
    		return username;
    	}
    }

    function pageUpdateItemsPositions(its) {
        for (var i in its) {
            items[its[i].orig_index].moveBefore(i);
        }
    }

    function pageMenu(page) {
        //page.metadata.background = ui.background;
        page.metadata.background = plugin.path + "views/img/background.png";
        page.metadata.backgroundAlpha = 0.5;

        //page.metadata.font = "default";

        page.appendAction("navopen", PREFIX + ":search", true, { title: "Search", icon: plugin.path + "views/img/search.png" });
        page.appendAction("pageevent", "sortDateDec", true, { title: "Sort by Date (Decrementing)", icon: plugin.path + "views/img/sort_date_dec.png" });
        page.appendAction("pageevent", "sortViewsDec", true, { title: "Sort by Views (Decrementing)", icon: plugin.path + "views/img/sort_views_dec.png" });
        page.appendAction("pageevent", "sortAlphabeticallyInc", true, { title: "Sort Alphabetically (Incrementing)", icon: plugin.path + "views/img/sort_alpha_inc.png" });
        page.appendAction("pageevent", "sortAlphabeticallyDec", true, { title: "Sort Alphabetically (Decrementing)", icon: plugin.path + "views/img/sort_alpha_dec.png" });
        page.appendAction("pageevent", "sortDefault", true, { title: "Sort as Default", icon: plugin.path + "views/img/sort_default.png" });
        
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

    function websiteApi() {
        this.getPlaylist = function(list) {
            var link = "http://www.youtube.com/playlist?list=" + list;
            var entries = [];

            var data = showtime.httpGet(link).toString();
            var init = data.indexOf('<ol>');
            var end = data.indexOf('</ol>');
            data = data.slice(init, end).replace(/\r?\n/g, "").replace(/\s+/g, " ");
            var split = data.split('<li class="playlist-video-item');
            for (var i in split) {
                var item = split[i];
                var match = item.match('dir="ltr">(.+?)<\/span>');
                var match2 = item.match('data-thumb="(.+?)"');
                var match3 = item.match('vi/(.+?)/default.jpg');
                if (match && match3) {
                    var title = match[1];
                    var thumbnail = "";
                    if (!match2) match2 = item.match("<span class=\"yt-thumb-clip-inner\"><img src=\"(.+?)\"");
                    if (match2) thumbnail = match2[1];
                    if (thumbnail.slice(0, 5) != "http:") thumbnail = "http:" + thumbnail;
                    var id = match3[1];

                    var desc = '<font color="66CCFF">';
                    match3 = item.match(/<span class="video-view-count">(.+?) views.*<\/span>/);
                    desc += 'Views: ' + match3[1];
                    desc += '</font>';

                    entries.push({
                        title: title,
                        logo: thumbnail,
                        id: id,
                        description: new showtime.RichText(desc)
                    });
                }
            }

            return entries;
        }
    }

    function hasSubscribed(channelId) {
    	var args = {
    		"part": "id,snippet",
    		"forChannelId": channelId,
    		"mine": true
    	};

    	var data = apiV3.subscriptions.list(args);
        var subscribed = !data.error && data.response.items.length == 1;
    	return subscribed;
    }

    function YoutubeV3() {
        var key = "AIzaSyCSDI9_w8ROa1UoE2CNIUdDQnUhNbp9XR4";

        var auth = {
            "client_id": "477107727317-bn1q4uorfi4vf941ro4musqmtai78u1t.apps.googleusercontent.com",
            "client_secret": "5PsYdg4f72gk4z989mtFC7eL",
            "authenticated": false,

            "init": function() {
                p("OAuth information found: " + (v3_oauth_information.access_token != null));
                if (v3_oauth_information.access_token) {
                    this.authenticated = true;

                    var response = plugin.cacheGet("Youtube-V3-OAuth2", "access_token");

                    if (!response) {
                        var data = this.refreshToken();

                        v3_oauth_information.access_token = data.access_token;
                        v3_oauth_information.expires_in = data.expires_in;
                        v3_oauth_information.token_type = data.token_type;

                        plugin.cachePut("Youtube-V3-OAuth2", "access_token", v3_oauth_information.access_token, 
                            parseInt(v3_oauth_information.expires_in));
                        api.headers_common.Authorization = v3_oauth_information.token_type + " " + v3_oauth_information.access_token;

                        response = plugin.cacheGet("Youtube-V3-OAuth2", "access_token").join("");

                        p("Access token: " + response);
                    }
                }
            },

            "refreshToken": function() {
                var postdata = "client_id=" + this.client_id + "&client_secret=" + this.client_secret + 
                    "&refresh_token=" + v3_oauth_information.refresh_token + "&grant_type=refresh_token";
                var response = showtime.JSONDecode(showtime.httpPost("https://accounts.google.com/o/oauth2/token", 
                    postdata, {}, {
                        "Content-Type": "application/x-www-form-urlencoded"
                    }).toString());

                return response;
            },

            "getDeviceCode": function() {
                var postdata = "client_id=" + this.client_id + "&scope=" + "https://www.googleapis.com/auth/youtube";
                var response = showtime.JSONDecode(showtime.httpPost("https://accounts.google.com/o/oauth2/device/code", 
                    postdata, {}, {
                        "Content-Type": "application/x-www-form-urlencoded"
                    }).toString());

                return response;
            },

            "pollServer": function() {
                var postdata = "client_id=" + this.client_id + "&client_secret=" + this.client_secret + 
                    "&code=" + v3_oauth_information.device_code + "&grant_type=" + "http://oauth.net/grant_type/device/1.0";
                var response = showtime.JSONDecode(showtime.httpPost("https://accounts.google.com/o/oauth2/token", 
                    postdata, {}, {
                    "Content-Type": "application/x-www-form-urlencoded"
                }).toString());

                return response;
            },

            "request": function() {
                var response = this.getDeviceCode();

                v3_oauth_information.device_code = response.device_code;
                v3_oauth_information.user_code = response.user_code;
                v3_oauth_information.verification_url = response.verification_url;

                t("URL: " + v3_oauth_information.verification_url);
                t("User Code: " + v3_oauth_information.user_code);

                var msg = 'Time limit: ' + parseInt(response.expires_in) / 60 + ' minutes.\nWebsite: ' + response.verification_url + '\nUser Code: ' + response.user_code + 
                    '\n\n1. In a computer with Internet access, navigate to ' + response.verification_url +
                    '\n2. It should show the Google logo and a box requesting a code from the device, \nin that box type the user code specified above' + 
                    '\n3. If everything goes well, you should get to a page stating that Showtime Plugin Youtube \nrequests permission to access to the account.\n'+
                    'If you want to use your account in Youtube, you have to authorize that access.' +
                    '\n4. In case you accept, you should see a page stating that you authorized Showtime Plugin Youtube. \nCongratulations, now you can use the plugin fully, enjoy it.';

                showtime.trace(msg);

                if (showtime.message(msg, true, false)) {
                    response = this.pollServer();
                    if (response.error) {
                        showtime.notify("Failed to authenticate user: " + response.error, 3, "");
                        return false;
                    }

                    v3_oauth_information.access_token = response.access_token;
                    v3_oauth_information.expires_in = response.expires_in;
                    v3_oauth_information.token_type = response.token_type;
                    v3_oauth_information.refresh_token = response.refresh_token;

                    t("Authenticated succesfully");
                    this.authenticated = true;

                    plugin.cachePut("Youtube-V3-OAuth2", "access_token", v3_oauth_information.access_token, 
                        parseInt(v3_oauth_information.expires_in));
                    return true;
                }
                return false;
            }
        };

        var activities = {
            "list": function(args) {
                var url = "https://www.googleapis.com/youtube/v3/activities";
                return download(url, args, false);
            }            
        }

        var channels = {
            "list": function(args) {
                var url = "https://www.googleapis.com/youtube/v3/channels";
                return download(url, args, false);
            }            
        }

        var guideCategories = {
            "list": function(args) {
                var url = "https://www.googleapis.com/youtube/v3/guideCategories";
                return download(url, args, false);
            }            
        }

        var playlistItems = {
            "list": function(args) {
                var url = "https://www.googleapis.com/youtube/v3/playlistItems";
                return download(url, args, false);
            },

            "insert": function(playlistId, videoId) {
            	var json = {
            		"snippet": {
            			"playlistId": playlistId,
            			"resourceId": {
            				"kind": "youtube#video",
            				"videoId": videoId
            			}
            		}
            	};

            	var postdata = showtime.JSONEncode(json);
            	var url = "https://www.googleapis.com/youtube/v3/playlistItems";
            	var data = download(url, {
            		"part": "snippet"
            	}, false, true, postdata);

            	return !data.error && data.response.snippet.playlistId == playlistId;
            }            
        }

        var playlists = {
            "list": function(args) {
                var url = "https://www.googleapis.com/youtube/v3/playlists";
                return download(url, args, false);
            },

            "insert": function(title) {
                var json = {
                    "snippet": {
                        "title": title
                    }
                };

                var postdata = showtime.JSONEncode(json);
                var url = "https://www.googleapis.com/youtube/v3/playlists";
                var data = download(url, {
                    "part": "snippet"
                }, false, true, postdata);

                return !data.error && data.response.snippet.title == title;
            }        
        }

        var search = {
            "list": function(args) {
                var url = "https://www.googleapis.com/youtube/v3/search";
                args.safeSearch = service.safeSearch;
                if (service.region != "all")
                	args.regionCode = service.region;
                return download(url, args, false);
            }            
        }

        var subscriptions = {
            "list": function(args) {
                var url = "https://www.googleapis.com/youtube/v3/subscriptions";
                return download(url, args, false);
            },

            "insert": function(channelId) {
            	var json = {
            		"snippet": {
            			"resourceId": {
            				"kind": "youtube#channel",
            				"channelId": channelId
            			}
            		}
            	};

            	var postdata = showtime.JSONEncode(json);
            	var url = "https://www.googleapis.com/youtube/v3/subscriptions";
            	return download(url, {
            		"part": "snippet"
            	}, false, true, postdata);
            }          
        }

        var videoCategories = {
            "list": function(args) {
                var url = "https://www.googleapis.com/youtube/v3/videoCategories";
                return download(url, args, false);
            }            
        }

        var videos = {
            "list": function(args) {
                var url = "https://www.googleapis.com/youtube/v3/videos";
                return download(url, args, false);
            },

            "information": {
                "Uploader": 'video.snippet.channelTitle',
                //"Category": ''
                //"Rating": '',
                "Views": 'video.statistics.viewCount'
                //"Duration": ''
            }
        }

        var download0 = function(options) {
            var headers = options.headers ? options.headers : {};

            var args = options.args;
            if (!args) args = {};
            args.key = key;
            args.maxResults = 50;

            var path = options.path;
            var url = path + encodeArgs(args);

            if (options.apiV2) {
                headers["GData-Version"] = "2.1";
                headers["X-GData-Key"] = "key=AI39si7gfa8PEGC6qMb5Kk04aPInFlZVRIPZio6fNE9-0uwS4Qvo9dbhGxzeWIEQ8J4hMHGMtw2xOHuDGn3ped2EktTAVqCU9w";
            }

            if (apiV3.auth.authenticated) {
                var access_token = plugin.cacheGet("Youtube-V3-OAuth2", "access_token");
                if (access_token == null) {
                    apiV3.auth.init();
                    access_token = plugin.cacheGet("Youtube-V3-OAuth2", "access_token");
                }
                access_token = access_token.join("");
                headers.Authorization = v3_oauth_information.token_type + " " + access_token;
            }

            d("Preparing to parse request:");
            d("URL: " + url);
            d("Args: ");
            for (var i in args)
                d(i + ": " + args[i]);

            d("Headers: ");
            for (var i in headers) {
                if (i != "Authorization")
                    d(i + ": " + headers[i]);
            }
            d("Authorized user");

            try {
                var data = null;
                var post = options.post;
                var postdata = options.postdata;
                if (!post)
                    data = showtime.httpGet(url, {}, headers);
                else {
                    headers["Content-Type"] = "application/json";
                    data = showtime.httpPost(url, postdata, null, headers);
                }
                return {
                    response: showtime.JSONDecode(data.toString()),
                    headers: data.headers
                };
            }
            catch(ex) {
                debug(ex);
                var reconnecting = options.reconnecting;
                if (!reconnecting && ex == "Error: Authentication without realm" && apiV3.auth.authenticated) {
                    debug("Authentication failed. Trying refreshing token.");
                    apiV3.auth.refreshToken();
                    return download0(options);
                }

                return {
                    error: "Failed to parse request: " + ex
                };
            }
        }

        var download = function(path, args, reconnecting, post, postdata) {
            return download0({
                "path": path,
                "args": args,
                "reconnecting": reconnecting,
                "post": post,
                "postdata": postdata
            });
        }

        return {
            "auth": auth,
            "activities": activities,
            "channels": channels,
            "guideCategories": guideCategories,
            "playlistItems": playlistItems,
            "playlists": playlists,
            "search": search,
            "subscriptions": subscriptions,
            "videoCategories": videoCategories,
            "videos": videos,
            "download": download0
        }
    }

    function encodeArgs(args) {
        var data = "?";
        for (var i in args) {
            if (data != "?")
                data += "&";
            var value = args[i];
            if (typeof value == String)
            	value = value.replace(/,/g, "%2C");
            data += i + "=" + value;
        }
        return data;
    }

    function debug(message, id) {
        if (!service.enableDebug) return;
        if (!id) id = "YOUTUBE";
        showtime.trace(message, id);
    }

    function d(message) {
        if (!service.enableDebug) return;
        showtime.trace(message, "YOUTUBE");
    }

    String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g, '');};

    function setVideoItemOptions(item, page) {
        if (item.channelId)
            item.addOptURL("More from this user", PREFIX + ':user:' + item.channelId);

        if (item.videoId) {
            item.addOptAction("Like video", "like");
            item.onEvent('like', function (item) {
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

            var args = {
                "part": "id,snippet",
                "type": "video",
                "relatedToVideoId": item.videoId,
                "request": {
                    "type": "search",
                    "subrequest": "list"
                }
            };

            item.addOptURL("Related Videos", PREFIX + ":v3:request:" + escape(showtime.JSONEncode(args))+':'+escape('Related Videos'));

            if (apiV3.auth.authenticated) {
            	var args = {
            		"videoId": item.videoId
            	};
                item.addOptURL("Add to Playlist", PREFIX + ':playlist:add:' + escape(showtime.JSONEncode(args)));
            }
        }
    }

    function addVideoItem(page, entry, metadata) {
        var item = page.appendItem(PREFIX + ":video:" + entry.videoId, "video", metadata);
        for (var i in entry)
            item[i] = entry[i];
        setVideoItemOptions(item, page);
        return item;
    }

    function getVideoId(entry) {
        try {
            if (entry.kind == "youtube#activity") {
                var type = entry.snippet.type;
                var params = entry.contentDetails[type];
                if (type == "upload") {
                    return params.videoId;
                }
                else if (type == "like") {
                    var resourceId = entry.contentDetails[type].resourceId.kind;
                    if (resourceId == "youtube#video") {
                        return params.resourceId.videoId;
                    }
                }
                else if (type == "favorite") {
                    var resourceId = entry.contentDetails[type].resourceId.kind;
                    if (resourceId == "youtube#video") {
                        return params.resourceId.videoId;
                    }
                }
                else if (type == "recommendation") {
                    var resourceId = entry.contentDetails[type].resourceId.kind;
                    if (resourceId == "youtube#video") {
                        return params.resourceId.videoId;
                    }
                }
            }
            else if (entry.kind == "youtube#playlistItem") {
                if (entry.snippet.resourceId.kind == "youtube#video") {
                    return entry.snippet.resourceId.videoId;
                }
            }
            else if (entry.id && entry.id.kind && entry.id.kind == "youtube#video") {
                return entry.id.videoId;
            }
        }
        catch (ex) {
            e(ex);
        }
        return null;
    }

    function pageControllerV3(page, loader) {
        items = [];
        items_tmp = [];
		/*if (page.metadata) {
		    page.metadata.apiAuthenticated = api.apiAuthenticated;
		    pageMenu(page, page.items);
		}*/

        page.contents = 'list';
        var offset = 1;
        var total_items = 0;
        var max_items = service.entries;

        //var items = [];

        function paginator() {
            var num = 0;

            var nextPageToken = null;

            while(total_items < max_items) {	
                var data = loader(nextPageToken);

                if (data.nextPageToken)
                	nextPageToken = data.nextPageToken;

                if (data.pageInfo) {
                	page.entries = data.pageInfo.totalResults;
                	total_items += data.pageInfo.resultsPerPage;
                }
                else {
                	page.entries = 1;
                	total_items = 1;
                }

                if (page.entries < max_items)
                    max_items = page.entries;

                if (page.entries > service.entries)
                    page.entries = service.entries;
                var c = 0;

                if (data.items.length == 0) {
                    page.appendItem(PREFIX + ':start', 'directory', { title: 'This feed does not contain any item. Sorry about that.' });
                }

                var videoIds = [];
                var videoData = {};

                if (service.advancedBrowseV3) {
                    for (var i in data.items) {
                        var entry = data.items[i];

                        var videoId = getVideoId(entry);
                        if (videoId)
                            videoIds.push(videoId);
                    }

                    var data1 = apiV3.download({
                        "path": "https://www.googleapis.com/youtube/v3/videos",
                        "args": {
                            "part": "id,snippet,contentDetails,statistics,status,topicDetails",
                            "id": videoIds.join(",")
                        }
                    });

                    data1 = data1.response;

                    for (var i in data1.items) {
                        var video = data1.items[i];
                        videoData[video.id] = video;
                    }
                }

                for (var i in data.items) {
                    var entry = data.items[i];
                
                    try {
                        c++;
                        var id, url;

                        var metadata = {};

                        if (service.advancedBrowseV3) {
                            var videoId = getVideoId(entry);
                            /*if (entry.author && entry.author[0].name) {
                                metadata.author = entry.author[0].name.$t;
                            }*/

                            /*if (entry.app$control && entry.app$control.yt$state) {
                                if (entry.app$control.yt$state.name == "restricted" && entry.app$control.yt$state.reasonCode == "requesterRegion") metadata.restricted = true;
                            }*/
                    
                            /*if (entry.media$group && entry.media$group.media$rating) {
                                metadata.certification = entry.media$group.media$rating[0].$t.toString().toUpperCase();
                            }*/

                            if (videoId) {
                                var video = videoData[videoId];

                                metadata.published = getDistanceTime(getTime(video.snippet.publishedAt));

                                metadata.hd = video.contentDetails.definition == "hd";

                                var durationString = video.contentDetails.duration;
                                var match = durationString.match(/PT(.+?)M(.+?)S/);
                                if (match) {
                                    var minutes = parseInt(match[1]);
                                    var seconds = parseInt(match[2]);
                                    metadata.duration = showtime.durationToString(minutes * 60 + seconds);
                                    metadata.runtime = metadata.duration;
                                }

                                metadata.views = video.statistics.viewCount;
                                metadata.favorites = video.statistics.favoriteCount;
                                metadata.likes = parseInt(video.statistics.likeCount);
                                metadata.dislikes = parseInt(video.statistics.dislikeCount);
                                metadata.likesPercentage = Math.round((metadata.likes / 
                                    (metadata.likes + metadata.dislikes)) * 100);
                                /*metadata.likesPercentage_str = '<font size="3" color="99CC66"> ( ' + 
                                    metadata.likesPercentage + '% )</font>';*/
                                metadata.likesPercentage_str = metadata.likesPercentage + '%';
                                metadata.rating = metadata.likesPercentage;
                            }
                        }

                        metadata.icon = parseThumbnail(entry);

                        var videoTitle = entry.snippet.title;

                        var color = 'FFFFFF';
                        /*if (country != "" && entry.media$group && entry.media$group.media$restriction) {
                            var restriction = entry.media$group.media$restriction[0];
                            if (restriction.type == 'country') {
                                var countries = restriction.$t.split(' ');
                                if (restriction.$t.indexOf(country) != -1 && restriction.relationship == 'deny') {
                                    color = 'ffa500';
                                }
                                else if (restriction.relationship == 'allow' && entry.media$group.media$restriction.length == 1 && restriction.$t.indexOf(country) == -1) {
                                    color = 'ffa500';
                                }
                            }
                        }*/
                        var title = videoTitle;
                        if (metadata.duration)
                            title += ' (' + metadata.duration + ')';
                        if (metadata.likesPercentage) {
                            title += '<font color="99CC66"> ( ' +
                            	metadata.likesPercentage + '% )</font>';
                        }

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
                            subtitle1 += 'Likes Percentage: ' + metadata.likesPercentage_str;
                        subtitle1 += '</font>';

                        var dateInfo = "";
                        if (metadata.published) {
                            dateInfo = 'Published ';

                            var author = entry.snippet.channelTitle;
                            if (author) {
                                dateInfo += 'by <font color="FFFF00">' + author + '</font><font color="99CC33"> ';
                            }

                            dateInfo += metadata.published;
                        }
                    
                        if (metadata.updated) {
                            if (metadata.published)
                                dateInfo += ' | ';
                            
                            dateInfo += 'Updated ' + metadata.updated;
                        }

                        var desc = "";
                        if (entry.snippet.description) {
                            desc = entry.snippet.description;
                        }

                        var lines = "";
                        var desc_split = desc.split("\n");
                        for (var i = 0; i < desc_split.length && i < 2; i++) {
                            lines += desc_split[i] + "\n";
                        }  

                        metadata.description = new showtime.RichText(subtitle1 + "\n" + '<font color="99CC33">' +
                        	dateInfo + '</font>\n' +
                            '<font color="EEEEEE">' + lines + '...' + '</font>');

                        var images = [];
                        /*if (entry.media$group && entry.media$group.media$thumbnail) {
                            images = entry.media$group.media$thumbnail;
                        }
                        else if (entry.media$thumbnail && entry.media$thumbnail.url) {
                            images.push({
                                url: entry.media$thumbnail.url,
                                width: 400,
                                height: 400
                            });
                        }*/
                        images.push({
                        	width: 400,
                        	height: 400,
                        	url: metadata.icon
                        });
                        images.push({
                            width: 20,
                            height: 20,
                            url: plugin.path + "views/img/nophoto.bmp"});
                        images = "imageset:" + showtime.JSONEncode(images);
                        metadata.icon = images;

                        if (entry.kind == "youtube#activity") {
                        	var title = entry.snippet.title;
                        	var type = entry.snippet.type;
                    		var channelTitle = entry.snippet.channelTitle;
                        	var params = entry.contentDetails[type];
                        	if (type == "upload") {
                                    metadata.title = "[UPLOAD] " + title;
                                var item = addVideoItem(page, {
                                    videoId: params.videoId,
                                    channelId: entry.snippet.channelId
                                }, metadata);
                        	}
                        	else if (type == "like") {
                        		var resourceId = entry.contentDetails[type].resourceId.kind;
                        		if (resourceId == "youtube#video") {
                                            metadata.title = "[VIDEO LIKE] " + title;
                                    var item = addVideoItem(page, {
                                        videoId: params.resourceId.videoId,
                                        channelId: entry.snippet.channelId
                                    }, metadata);
                        		}
                        	}
                        	else if (type == "favorite") {
                        		var resourceId = entry.contentDetails[type].resourceId.kind;
                        		if (resourceId == "youtube#video") {
                                            metadata.title = "[VIDEO FAVORITE] " + title;
                                    var item = addVideoItem(page, {
                                        videoId: params.resourceId.videoId,
                                        channelId: entry.snippet.channelId
                                    }, metadata);
                        		}
                        	}
                        	else if (type == "recommendation") {
                        		var resourceId = entry.contentDetails[type].resourceId.kind;
                        		if (resourceId == "youtube#video") {
                                            metadata.title = "[VIDEO RECOMMENDATION] " + title;
                                    var item = addVideoItem(page, {
                                        videoId: params.resourceId.videoId,
                                        channelId: entry.snippet.channelId
                                    }, metadata);
                        		}
                        		else if (resourceId == "youtube#playlist") {
									var playlistId = entry.contentDetails[type].resourceId.playlistId;

									metadata.title = "[PLAYLIST RECOMMENDATION] " + title;
                        			var args = {
                    					"part": "id,snippet",
                    					"playlistId": playlistId,
                    					"request": {
	                    					"type": "playlistItems",
	                    					"subrequest": "list"
                    					}
                    				};
                    				var item = page.appendItem(PREFIX + ":v3:request:" + escape(showtime.JSONEncode(args))+':'+escape('Recommended Videos'), "directory",
                    					metadata);
                        		}
                        		else if (resourceId == "youtube#channel") {
                        			var channelId = entry.contentDetails[type].resourceId.channelId;

                        			metadata.title = "[CHANNEL RECOMMENDATION] " + title;
                        			var item = page.appendItem(PREFIX + ':user:' + channelId, "directory", metadata);
                        		}
                        	}
                        	else if (type == "subscription") {
                        		var resourceId = entry.contentDetails[type].resourceId.kind;
                        		if (resourceId == "youtube#channel") {
                        			var channelId = entry.contentDetails[type].resourceId.channelId;

                        			metadata.title = "[SUBSCRIPTION] " + title;
                        			var item = page.appendItem(PREFIX + ':user:' + channelId, "directory", metadata);
                        		}
                        	}
                    	}
                        else if (entry.kind == "youtube#guideCategory") {
                        	var args = {
                    			"part": "id,snippet,contentDetails",
                    			"categoryId": entry.id,
                    			"request": {
                    				"type": "channels",
                    				"subrequest": "list"
                    			}
                    		};
                    		var item = page.appendItem(PREFIX + ":v3:request:" + escape(showtime.JSONEncode(args))+':'+escape(title), "directory", metadata);
                        }
                    	else if (entry.kind == "youtube#videoCategory") {
                    		var args = {
                    			"part": "id,snippet",
                    			"videoCategoryId": entry.id,
                    			"type": "video",
                    			"request": {
                    				"type": "search",
                    				"subrequest": "list"
                    			}
                    		};
                    		var item = page.appendItem(PREFIX + ":v3:request:" + escape(showtime.JSONEncode(args))+':'+escape(title), "directory", metadata);
                    	}
                    	else if (entry.kind == "youtube#playlistItem") {
                    		if (entry.snippet.resourceId.kind == "youtube#video") {
                                addVideoItem(page, {
                                    videoId: entry.snippet.resourceId.videoId
                                }, metadata);
                    		}
                    	}
                        else if (entry.kind == "youtube#channel") {
                        	if (entry.contentDetails) {
                        		var item = page.appendItem(PREFIX + ':user:' + entry.id, "directory", metadata);
                        	}
                        	else {
                        		var args = {
                    				"part": "id,snippet",
                    				"channelId": entry.id,
                    				"request": {
	                    				"type": "search",
	                    				"subrequest": "list"
                    				}
                    			};
                    			var item = page.appendItem(PREFIX + ":v3:request:" + escape(showtime.JSONEncode(args))+':'+escape(title), "directory", metadata);
                    		}
                        }
                    	else if (entry.id.kind == "youtube#channel") {
                        	var item = page.appendItem(PREFIX + ':user:' + entry.id.channelId, "directory", metadata);
                        }
                        else if (entry.id.kind == "youtube#playlist") {
                        	var args = {
                    			"part": "id,snippet",
                    			"playlistId": entry.id.playlistId,
                    			"request": {
	                    			"type": "playlistItems",
	                    			"subrequest": "list"
                    			}
                    		};
                    		var item = page.appendItem(PREFIX + ":v3:request:" + escape(showtime.JSONEncode(args))+':'+escape(title), "directory", metadata);
                        }
                        else if (entry.id.kind == "youtube#video") {
                            var item = addVideoItem(page, {
                                videoId: entry.id.videoId
                            }, metadata);
                    	}

                        /*if (entry.snippet.publishedAt) {
                            // 2012-08-10T19:34:51.000Z
                            var match = entry.snippet.publishedAt.$t.match("(.*)-(.*)-(.*)T(.*):(.*):([^.]*)");
                            item.published = new Date(match[1], match[2], match[3], match[4], match[5], match[6]).getTime();
                        }*/

                        item.index = c;
                        item.title = entry.title;
                        if (metadata.views)
                            item.views = parseInt(metadata.views);
                        if (entry.snippet.publishedAt)
                            item.date = getTime(entry.snippet.publishedAt).getTime();
                        items.push(item);
                        items_tmp.push(item);
                    }
                    catch(err) {
                        e(err);
                    }
                }
                page.loading = false;	
                num += c;

                if(c == 0 || offset > api.args_common['max-results'] || num > parseInt(service.entries) || c == max_items || total_items >= max_items)	  
                    break;
            }
            offset += num;

            return offset < page.entries;    
        }
    
        page.type = "directory";
        paginator();    
        page.paginator = paginator;
    }

    plugin.addURI(PREFIX+":start", startPage);

    plugin.addSearcher("Youtube - Videos", plugin.path + "logo.png",    
    function(page, query) { 
        try {
            pageController(page, function(offset) {	
                api.args_common['start-index'] = offset;
                api.args_common.q = escape(query);

                page.appendItem(PREFIX + ':feed:sort:' + escape("http://gdata.youtube.com/schemas/2007#video") + ':' + escape("https://gdata.youtube.com/feeds/api/videos/?q=" + query)+':'+escape('Sort by...'),"directory", {
                    title: "Sort by..."
                });
                page.appendItem(PREFIX + ':feed:duration:' + escape("https://gdata.youtube.com/feeds/api/videos/?q=" + query)+':'+escape('Filter by duration'), "directory", {
                    title: "Filter by duration"
                });

                return showtime.JSONDecode(showtime.httpGet("https://gdata.youtube.com/feeds/api/videos", 
                    api.args_common, api.headers_common).toString());
            });
        }
        catch(err){
            showtime.trace('Search Youtube - Videos: '+err)
        }
    });

    plugin.addSearcher("Youtube - Videos V3", plugin.path + "logo.png",    
    function(page, query) {
        try {
            pageControllerV3(page, function(nextPageToken) {
            	var args = {
            		"part": "id,snippet",
            		"type": "video",
            		"q": escape(query)
            	};
            	if (nextPageToken)
            		args.pageToken = nextPageToken;
            	var data = apiV3.search.list(args);
            	data = data.response;
            	nextPageToken = data.nextPageToken;

                return data;
            });
        }
        catch(err){
            e('Search Youtube - Videos V3: ' + err)
            d(err.stack);
        }
    });

    plugin.addSearcher("Youtube - Playlists", plugin.path + "logo.png",    
    function(page, query) { 
        try {
            pageController(page, function(offset) {	
                api.args_common['start-index'] = offset;
                api.args_common.q = escape(query);

                var doc = showtime.JSONDecode(showtime.httpGet("https://gdata.youtube.com/feeds/api/playlists/snippets",
                    api.args_common, api.headers_common).toString());

                return doc;
            });
        }
        catch(err){
            showtime.trace('Search Youtube - Playlists: '+err)
        }
    });

    plugin.addSearcher("Youtube - Playlists V3", plugin.path + "logo.png",    
    function(page, query) {
        try {
            pageControllerV3(page, function(nextPageToken) {
            	var args = {
            		"part": "id,snippet",
            		"type": "playlist",
            		"q": escape(query)
            	};
            	if (nextPageToken)
            		args.pageToken = nextPageToken;
            	var data = apiV3.search.list(args);
            	data = data.response;
            	nextPageToken = data.nextPageToken;

                return data;
            });
        }
        catch(err){
            e('Search Youtube - Playlists V3: ' + err)
            d(err.stack);
        }
    });

    plugin.addSearcher("Youtube - Channels", plugin.path + "logo.png",    
    function(page, query) {
        try {
            pageController(page, function(offset) {	
                api.args_common['start-index'] = offset;
                api.args_common.q = escape(query);
                return showtime.JSONDecode(showtime.httpGet("https://gdata.youtube.com/feeds/api/channels",
                    api.args_common, api.headers_common).toString());
            });
        }
        catch(err){
            showtime.trace('Search Youtube - Channels: '+err)
        }
    });

    plugin.addSearcher("Youtube - Channels V3", plugin.path + "logo.png",    
    function(page, query) {
        try {
            pageControllerV3(page, function(nextPageToken) {
            	var args = {
            		"part": "id,snippet",
            		"type": "channel",
            		"q": escape(query)
            	};
            	if (nextPageToken)
            		args.pageToken = nextPageToken;
            	var data = apiV3.search.list(args);
            	data = data.response;
            	nextPageToken = data.nextPageToken;

                return data;
            });
        }
        catch(err){
            e('Search Youtube - Channels V3: ' + err)
            d(err.stack);
        }
    });

})(this);