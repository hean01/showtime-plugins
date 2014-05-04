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
    //items['rs'] = { title: "Recommended stations",
    //                path: "broadcast/editorialreccomendationsembedded",
    //                gets: {'sizeoflists': 40}
    //		    };
    items['mw'] = { title: "Most wanted",
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

    function trim(s) {
        return s.replace(/^\s+|\s+$/g, '').replace("mms://","http://");
    }

    // populate countries
    var options = [];
    var data = get_data("menu/valuesofcategory", {'category':'_country'});
    for each (country in data) {
	options.push([country,country]);
    }

    settings.createMultiOpt("country", "Country for the nearest stations", options, function(v) {
	service.country = v;
    });

    // discard favorites
    settings.createAction("cleanFavorites", "Clean My Favorites",
			  function () {
        store.list = "[]";
        showtime.notify('Favorites has been cleaned successfully', 2);
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
	    var res = showtime.httpReq(query, {}, {
		'User-Agent':'radio.de 1.9.1 rv:37 (iPhone; iPhone OS 5.0; de_DE)'});
	    return showtime.JSONDecode(res.toString());
	} catch(e) {
	    return {};
	}
    }


    var cp1252 = 'ÀÁÂÃÄÅ¨ÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕ×ÖØÙÜÚÛÝÞßàáâãäå¸æçèéêëìíîïðñòóôõ÷öøùüúûýþÿ³²ºª¿¯´¥';
    var cp1251 = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЧЦШЩЬЪЫЭЮЯабвгдеёжзийклмнопрстуфхчцшщьъыэюяіІєЄїЇґҐ';
    function fixMB(s) {
        var fixed = '';
        for (var i = 0; i < s.length - 2; i++)
            if (cp1252.indexOf(s[i]) > - 1 && cp1252.indexOf(s[i+1]) > -1 && cp1252.indexOf(s[i+2]) > -1) {
	       for (var i = 0; i < s.length; i++)
	           cp1252.indexOf(s[i]) != -1 ? fixed += cp1251[cp1252.indexOf(s[i])] : fixed += s[i];
               showtime.print("Before: " + s + " After: " + fixed);
               return fixed;
            }
	return s;
    };

    function populate_stations(page, station) {
	    var bce = {}
	    try {
		bce = plugin.cacheGet(STREAMURL_STASH, station.id);
		if (bce == null) {
		    bce =  get_data("broadcast/getbroadcastembedded",
				    {'broadcast': station.id});
		    plugin.cachePut(STREAMURL_STASH, station.id, bce, 84600);
		}
	    } catch(e) {}

	    var iconUrl = null;

	    if (station.picture1Name)
		iconUrl = station.pictureBaseURL + station.picture1Name;
	    var item = page.appendItem("icecast:" + trim(bce.streamURL), "station", {
		station: station.name,
		description: bce.description,
		icon: iconUrl,
		album_art: iconUrl,
		title: station.name,
                onair: fixMB(station.currentTrack),
		bitrate: station.bitrate,
		format: bce.streamContentFormat
	    });

	    item.url = "icecast:" + trim(bce.streamURL);
	    item.station = station.name;
	    item.description = (bce.description?bce.description:"");
	    item.icon = iconUrl;
	    item.album_art = iconUrl;
	    item.bitrate = station.bitrate;
	    item.format = bce.streamContentFormat;

	    item.onEvent("addFavorite", function(item) {
		var entry = {
		    url: this.url,
		    icon: this.icon,
		    album_art: this.icon,
                    station: this.station,
                    title: station.name,
		    description: this.description,
		    bitrate: this.bitrate,
                    format: this.format
		};
		showtime.trace("item: "+showtime.JSONEncode(entry));
		var list = eval(store.list);
                var array = [showtime.JSONEncode(entry)].concat(list);
                store.list = showtime.JSONEncode(array);
		showtime.notify(station.name + " has been added to My Favorites.", 2);
	    });

	    item.addOptAction("Add '" + station.name + "' to My Favorites", "addFavorite");
    }

    function populateStations(page, data) {
    	for each (station in data) {
            populate_stations(page, station);
	}
    }

    function populateMostWanted(page, data) {
	for each (category in data) {
            for each (station in category) {
                populate_stations(page, station);
            }
	}
    }


    // Search
    plugin.addURI(PREFIX + "search", function(page) {
	page.loading = false;
	var search = showtime.textDialog('Search: ', true, true);
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
	    'q': query.replace(' ', '+'),
	    'start': '0',
	    'rows': '30'
	});
	populateStations(page, result);
	page.loading = false;
    });


    function fill_fav(page) {
	var list = eval(store.list);

        if (!list || !list.toString()) {
           page.error("My Favorites list is empty");
           return;
        }
        var pos = 0;
	for each (item in list) {
	    var itemmd = showtime.JSONDecode(item);
	    var item = page.appendItem(itemmd.url, "station", {
		station: itemmd.station,
		icon: itemmd.icon,
		album_art: itemmd.icon,
       		title: itemmd.title,
		description: itemmd.description,
		bitrate: itemmd.bitrate,
		format: itemmd.format,
		listeners: itemmd.listeners
	    });
	    item.addOptAction("Remove '" + itemmd.station + "' from My Favorites", pos);

	    item.onEvent(pos, function(item) {
		var list = eval(store.list);
		showtime.notify(showtime.JSONDecode(list[item]).station + " has been removed from My Favorites.", 2);
	        list.splice(item, 1);
		store.list = showtime.JSONEncode(list);
                page.flush();
                fill_fav(page);
	    });
            pos++;
	}
    }

    // Favorites
    plugin.addURI(PREFIX + "favorites", function(page) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.title = "My Favorites";
	page.metadata.logo = plugin.path + "rad.io.png";
	page.metadata.glwview = plugin.path + "views/array.view";
	page_menu(page);
        fill_fav(page);
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
	populateMostWanted(page, result);

	page.loading = false;
    });

    // Nearest
    plugin.addURI(PREFIX + "getByCategory:(.*):(.*)", function(page, category, value) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.logo = plugin.path + "rad.io.png";
	page.metadata.title = "rad.io - " + "Nearest stations";
	page.metadata.glwview = plugin.path + "views/array.view";
	page_menu(page);

	var result = get_data('menu/broadcastsofcategory', {
	    'category': '_'+category,
	    'value': value
	});
	populateStations(page, result);

	page.loading = false;
    });

    // List by category
    plugin.addURI(PREFIX + "category:(.*)", function(page, category) {
	page.type = "directory";
	page.contents = "items";
        page.metadata.title = "Stations by (" + category + ")";

        var data = get_data("menu/valuesofcategory", {'category':'_'+category});
        for each (item in data) {
            page.appendItem(PREFIX + "getByCategory:" + category + ":" + item, "directory", {
                title: item
            });
        };
        page.loading = false;
    });


    // Start page
    plugin.addURI(PREFIX + "start", function(page) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.logo = plugin.path + "rad.io.png";
	page.metadata.title = "rad.io";
     	page.loading = false;

        if (!service.country) service.country = "Ukraine";

        page.appendItem(PREFIX + "getByCategory:country:"+service.country, "directory", {
	    title: "Nearest stations (by settings)"
	});

	page.appendItem(PREFIX + "favorites", "directory", {
	    title: "My Favorites"
	});

	for (var key in items) {
	    page.appendItem(PREFIX + "list:" + key, "directory", {
		title: items[key].title
	    });
	}

        page.appendItem("", "separator", {
        });

        page.appendItem(PREFIX + "category:country", "directory", {
	    title: "Stations (by country)"
	});

        page.appendItem(PREFIX + "category:genre", "directory", {
	    title: "Stations (by genre)"
	});

        page.appendItem(PREFIX + "category:city", "directory", {
	    title: "Stations (by city)"
	});

        page.appendItem(PREFIX + "category:language", "directory", {
	    title: "Stations (by language)"
	});

        page.appendItem(PREFIX + "category:topic", "directory", {
	    title: "Stations (by topic)"
	});

        page.appendItem("", "separator", {
        });

	page.appendItem(PREFIX + "search", "directory", {
	    title: "Search"
	});
    });

    function page_menu(page) {
        page.options.createInt('childTilesX', 'Number of tiles by X', 6, 1, 10, 1, '', function (v) {
            page.metadata.childTilesX = v;
        }, true);

        page.options.createInt('childTilesY', 'Number of tiles by Y', 2, 1, 4, 1, '', function (v) {
            page.metadata.childTilesY = v;
        }, true);

        page.options.createBool('informationBar', 'Show Information Bar', true, function (v) {
            page.metadata.informationBar = v;
        }, true);
    }
})(this);
