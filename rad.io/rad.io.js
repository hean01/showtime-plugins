/*
 *  rad.io
 *
 *  Copyright (C) 2014 Henrik Andersson, lprot
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
    var BASE_URL = "http://www.rad.io/info/";
    var STREAMURL_STASH = "streamurl";
    var logo = plugin.path + "rad.io.png";

    function setPageHeader(page, title) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
	    page.metadata.glwview = plugin.path + "views/array.view";
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
	page.type = "directory";
	page.contents = "items";
        page.loading = false;
    }

    var service = plugin.createService(plugin.getDescriptor().id, plugin.getDescriptor().id + ":start", "audio", true, logo);

    var settings = plugin.createSettings(plugin.getDescriptor().id, logo, plugin.getDescriptor().synopsis);
    var store = plugin.createStore('favorites', true)
    if (!store.list) {
        store.list = "[]";
    }
    function trim(s) {
        if (!s) return '';
        return s.replace(/^\s+|\s+$/g, '').replace("mms://","http://");
    }
    // populate countries
    var data = getJSON('menu/valuesofcategory?category=_country');
    var options = [];
    for (var i in data)
	options.push([data[i], data[i]]);

    settings.createMultiOpt("country", "Country for the nearest stations", options, function(v) {
	service.country = v;
    });

    // discard favorites
    settings.createAction("cleanFavorites", "Clean My Favorites", function() {
        store.list = "[]";
        showtime.notify('Favorites has been cleaned successfully', 2);
    });

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

    function appendStation(page, station) {
	    var bce = {}
	    try {
		bce = plugin.cacheGet(STREAMURL_STASH, station.id);
		if (!bce) {
		    bce = getJSON('broadcast/getbroadcastembedded?broadcast=' + station.id);
		    plugin.cachePut(STREAMURL_STASH, station.id, bce, 84600);
		}
	    } catch(e) {}

	    var item = page.appendItem("icecast:" + trim(bce.streamURL), "station", {
		station: station.name,
		description: station.genresAndTopics,
		icon: station.pictureBaseURL + station.picture1Name,
		album_art: station.pictureBaseURL + station.picture1Name,
		title: station.name,
                onair: fixMB(station.currentTrack),
		bitrate: station.bitrate,
		format: station.streamContentFormat
	    });

	    item.url = "icecast:" + trim(bce.streamURL);
	    item.station = station.name;
	    item.description = station.genresAndTopics;
	    item.icon = station.pictureBaseURL + station.picture1Name;
	    item.album_art = station.pictureBaseURL + station.picture1Name;
	    item.bitrate = station.bitrate;
	    item.format = station.streamContentFormat;

            if (typeof Duktape != 'undefined') {
	        item.onEvent("addFavorite", function(item) {
		    var entry = showtime.JSONEncode({
		        url: this.url,
		        icon: this.icon,
		        album_art: this.icon,
                        station: this.station,
                        title: this.station,
		        description: this.description,
		        bitrate: this.bitrate,
                        format: this.format
		    });
                    store.list = showtime.JSONEncode([entry].concat(eval(store.list)));
		    showtime.notify("'" + this.station + "' has been added to My Favorites.", 2);
	        }.bind(item));
            } else {
	        item.onEvent("addFavorite", function(item) {
		    var entry = showtime.JSONEncode({
		        url: this.url,
		        icon: this.icon,
		        album_art: this.icon,
                        station: this.station,
                        title: this.station,
		        description: this.description,
		        bitrate: this.bitrate,
                        format: this.format
		    });
                    store.list = showtime.JSONEncode([entry].concat(eval(store.list)));
		    showtime.notify("'" + this.station + "' has been added to My Favorites.", 2);
	        });
            }
	    item.addOptAction("Add '" + station.name + "' to My Favorites", "addFavorite");
    }

    function fill_fav(page) {
	var list = eval(store.list);
        if (!list || !list.toString()) {
           page.error("My Favorites list is empty");
           return;
        }
        var pos = 0;
	for (var i in list) {
	    var itemmd = showtime.JSONDecode(list[i]);
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
		showtime.notify("'" + showtime.JSONDecode(list[item]).station + "' has been removed from My Favorites.", 2);
	        list.splice(item, 1);
		store.list = showtime.JSONEncode(list);
                page.flush();
                fill_fav(page);
	    });
            pos++;
	}
    }

    // Favorites
    plugin.addURI(plugin.getDescriptor().id + ":favorites", function(page) {
        setPageHeader(page, "My Favorites");
        fill_fav(page);
    });

    function getJSON(url) {
        return showtime.JSONDecode(showtime.httpReq(BASE_URL + url));
    }

    // Handle hardcoded lists
    plugin.addURI(plugin.getDescriptor().id + ":list:(.*):(.*)", function(page, title, url) {
        setPageHeader(page, plugin.getDescriptor().id + " - " + unescape(title));
        page.loading = true;
	var json = getJSON(url);
	for (var i in json)
            appendStation(page, json[i]);
        page.loading = false;
    });

    // Nearest
    plugin.addURI(plugin.getDescriptor().id + ":getByCategory:(.*):(.*)", function(page, category, value) {
        setPageHeader(page, "rad.io - " + "Nearest stations");
        page.loading = true;
	var json = getJSON('menu/broadcastsofcategory?category=_' + unescape(category) + '&value=' + encodeURIComponent(unescape(value)));
    	for (var i in json)
            appendStation(page, json[i]);
        page.loading = false;
    });

    // List by category
    plugin.addURI(plugin.getDescriptor().id + ":category:(.*)", function(page, category) {
        page.metadata.title = "Stations by (" + category + ")";
        page.metadata.logo = logo;
	page.type = "directory";
	page.contents = "items";
        page.loading = false;

        var json = getJSON('menu/valuesofcategory?category=_' + category);
        for (var i in json) {
            page.appendItem(plugin.getDescriptor().id + ":getByCategory:" + escape(category) + ":" + escape(json[i]), "directory", {
                title: json[i]
            });
        };
    });

    // Start page
    plugin.addURI(plugin.getDescriptor().id + ":start", function(page) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.logo = logo;
	page.metadata.title = plugin.getDescriptor().id;
     	page.loading = false;

	page.appendItem(plugin.getDescriptor().id + ":favorites", "directory", {
	    title: "My Favorites"
	});

        if (!service.country) service.country = "Ukraine";
        page.appendItem(plugin.getDescriptor().id + ":getByCategory:country:" + service.country, "directory", {
	    title: "Nearest stations (by settings)"
	});

        page.appendItem("", "separator", {
        });

        page.appendItem(plugin.getDescriptor().id + ':list:Highlights:broadcast/gethighlights', "directory", {
            title: 'Highlights'
	});

        page.appendItem(plugin.getDescriptor().id + ':list:Recommendations:broadcast/editorialreccomendationsembedded', "directory", {
            title: 'Recommendations'
	});

        page.appendItem(plugin.getDescriptor().id + ':list:Top 100:menu/broadcastsofcategory?category=_top', "directory", {
            title: 'Top 100'
	});

        page.appendItem("", "separator", {
            title: "Stations by"
        });

        page.appendItem(plugin.getDescriptor().id + ":category:genre", "directory", {
	    title: "Genre"
	});

        page.appendItem(plugin.getDescriptor().id + ":category:topic", "directory", {
	    title: "Topic"
	});

        page.appendItem(plugin.getDescriptor().id + ":category:country", "directory", {
	    title: "Country"
	});


        page.appendItem(plugin.getDescriptor().id + ":category:city", "directory", {
	    title: "City"
	});

        page.appendItem(plugin.getDescriptor().id + ":category:language", "directory", {
	    title: "Language"
	});
    });

    plugin.addSearcher(plugin.getDescriptor().id, logo, function(page, query) {
        setPageHeader(page, plugin.getDescriptor().id);
        var fromPage = 0, tryToSearch = true;
        page.entries = 0;

        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
	    var json = getJSON('index/searchembeddedbroadcast?q=' +
                query.replace(' ', '+') + '&start=' + fromPage + '&rows=30');
    	    for (var i in json) {
                appendStation(page, json[i]);
                page.entries++;
	    }
            page.loading = false;
            if (!json) return tryToSearch = false;
            fromPage += 30;
            return true;
        };
        loader();
        page.paginator = loader;
    });
})(this);