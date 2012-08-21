/*
 *  rad.io
 *
 *  Copyright (C) 2012 Henrik Andersson
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
    var BASE_URL = "http://www.rad.io";
    var PREFIX = "rad.io:";
    var STREAMURL_STASH = "streamurl";

    var items = {};
    items['rs'] = { title: "Recommanded stations",
		    path: "broadcast/editorialreccomendationsembedded",
		    gets: {'sizeoflists': 40}
		  };
    items['mw'] = { title: "Most Wanted",
		    path: "account/getmostwantedbroadcastlists",
		    gets: {'sizeoflists': 40}
		  };

    var service = plugin.createService("rad.io", PREFIX + "start", "audio", true,
			 plugin.path + "rad.io.png");

    var settings = plugin.createSettings("rad.io", plugin.path + "rad.io.png",
			 "rad.io: radio stream directory");

    var store = plugin.createStore('favorites', true)
    if (!store.list) {
        store.version = "1";
        store.background = "";
        store.title = "rad.io » My Favorites";
        store.list = "[]";
    }

    // populate countries
    var options = [];
    var data = get_data("menu/valuesofcategory", {'category':'_country'});
    for each (country in data) {
	options.push([country,country]);
    }

    settings.createMultiOpt("country", "Country", options, function(v) {
	service.country = v;
    });

    // discard favorites
    settings.createAction("cleanFavorites", "Clean local favorites", 
			  function () {
        store.list = "[]";
        showtime.trace('Local favorites were clean succesfully');
    });

    function make_args(gets) {
	var i=1, length = 0;
	var str="?";
	for(var dummy in gets) length++;

	for(var key in gets) {
	    str += key + "=" + gets[key];
	    if(i < length)
		str += "&";
	    i++;
	}
	return str;
    }

    function get_data(path, gets) {
	var query = BASE_URL + "/info/" + path + make_args(gets);
	showtime.trace("url query: " + query);
	try {
	    var res = showtime.httpGet(query, {}, {
		'User-Agent':'radio.de 1.9.1 rv:37 (iPhone; iPhone OS 5.0; de_DE)'});
	    return showtime.JSONDecode(res.toString());
	} catch(e) {
	    return {};
	}
    }

    function populate_stations(page, data) {
	for each (station in data) {
	    var streamUrl = null;
	    var bce = {}
	    try {
		var co = plugin.cacheGet(STREAMURL_STASH, station.id);
		if (co == null) {
		    bce =  get_data("broadcast/getbroadcastembedded",
				    {'broadcast': station.id});
		    if ('streamURL' in bce) {
			streamUrl = bce['streamURL']
			plugin.cachePut(STREAMURL_STASH, station.id, {streamURL: streamUrl}, 84600);
		    }
		} else
		    streamUrl = co['streamURL'];
	    } catch(e) {}

	    if (streamUrl  != null) {
		var iconUrl = null;
		if (station.picture1Name)
		    iconUrl = station.pictureBaseURL + station.picture1Name;

		var item = page.appendItem("shoutcast:" + streamUrl, "station", {
		    title: station.name,
		    icon: iconUrl,
		    current_track: station.current_track,
		    bitrate: station.bitrate
		});

		item.url = "shoutcast:" + streamUrl;
		item.title = station.name;
		item.icon = iconUrl;
		item.bitrate = station.bitrate;

		item.onEvent("addFavorite", function(item) {
		    var entry = {
			url: this.url,
			icon: this.icon,
			title: this.title,
			bitrate: this.bitrate
		    };
		    showtime.trace("item: "+showtime.JSONEncode(entry));
		    var list = eval(store.list);
                    var array = [showtime.JSONEncode(entry)].concat(list);
                    store.list = showtime.JSONEncode(array);
		    showtime.notify("Station was added to your favorites.", 2);		
		});

		item.addOptAction("Add station to favorites", "addFavorite");
	    }
	}
    }

    // Search
    plugin.addURI(PREFIX + "search", function(page) {
	page.loading = false;
	var search = showtime.textDialog('Search: ', true, false);
	if (search.rejected)
	    return;
	var query = search.input;
	page.type = "directory";
	page.contents = "items";
	page.metadata.title = "rad.io - search '" + query +"'";
	page.metadata.logo = plugin.path + "rad.io.png";
	page.metadata.glwview = plugin.path + "views/array.view";
	page_menu(page);

	page.loading = true;

	var result = get_data('index/searchembeddedbroadcast', {
	    'q': query,
	    'start': '0',
	    'rows': '30'
	});
	populate_stations(page, result);
	
	page.loading = false;
    });

    // Favorites
    plugin.addURI(PREFIX + "favorites", function(page) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.title = "Favorites";
	page.metadata.logo = plugin.path + "rad.io.png";
	page.metadata.glwview = plugin.path + "views/array.view";
	page_menu(page);
	
	var list = eval(store.list);
	for each (item in list) {
	    var itemmd = showtime.JSONDecode(item);

	    // add item to showtime page
	    var item = page.appendItem(itemmd.url, "station", {
		title: itemmd.title,
		icon: itemmd.icon,
		description: itemmd.description,
		bitrate: itemmd.bitrate,
		format: itemmd.format,
		listeners: itemmd.listeners,
		current_track: itemmd.current_track
	    });

	    item.url = itemmd.url;
	    	    
	    item.onEvent("delFavorite", function(item) {
		var list = eval(store.list);
		for each (item in list) {
		    var itemmd = showtime.JSONDecode(item);
		    if (itemmd.url == this.url) {
			list.splice(this.url, 1)
			store.list = showtime.JSONEncode(list);
			showtime.notify("Station was removed to your favorites.", 2);
		    }
		}
	    });

	    item.addOptAction("Remove station to favorites", "delFavorite");   
	}
	page.loading = false;
    });

    // Handle hardcoded lists
    plugin.addURI(PREFIX + "list:(.*)", function(page, key) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.logo = plugin.path + "rad.io.png";
	page.metadata.title = "rad.io - " + items[key].title;
	page.metadata.glwview = plugin.path + "views/array.view";

	page_menu(page);

	var result = get_data(items[key].path, items[key].gets);
	populate_stations(page, result);

	page.loading = false;
    });

    plugin.addURI(PREFIX + "nearest", function(page) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.logo = plugin.path + "rad.io.png";
	page.metadata.title = "rad.io - " + "Stations near me";
	page.metadata.glwview = plugin.path + "views/array.view";
	page_menu(page);

	var result = get_data('menu/broadcastsofcategory', {
	    'category': "_country",
	    'value': service.country
	});
	populate_stations(page, result);

	page.loading = false;
    });

    // Start page
    plugin.addURI(PREFIX + "start", function(page) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.logo = plugin.path + "rad.io.png";
	page.metadata.title = "rad.io";

	page.appendItem(PREFIX + "search", "item", {
	    title: "Search"
	});

	page.appendItem(PREFIX + "favorites", "item", {
	    title: "My Favorites"
	});

        page.appendPassiveItem("divider");  

	if (service.country != "")
	    page.appendItem(PREFIX + "nearest", "item", {
		title: "Stations near me"
	    });
	
	for (var key in items) {
	    page.appendItem(PREFIX + "list:" + key, "item", {
		title: items[key].title
	    });
	}

	page.loading = false;
    });

    function page_menu(page) {
        page.options.createInt('childTilesX', 'Number of X Child Tiles', 6, 1, 10, 1, '', function (v) {
            page.metadata.childTilesX = v;
        }, true);

        page.options.createInt('childTilesY', 'Number of Y Child Tiles', 3, 1, 4, 1, '', function (v) {
            page.metadata.childTilesY = v;
        }, true);

        page.options.createBool('informationBar', 'Information Bar', true, function (v) {
            page.metadata.informationBar = v;
        }, true);
    }

})(this);
