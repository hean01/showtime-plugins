/*
 *  icecast directory
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
    var BASE_URL = "http://dir.xiph.org";
    var logo = plugin.path + "icecast_square.png";

    function setPageHeader(page, title) {
        if (page.metadata) {
	    page.metadata.title = title;
	    page.metadata.logo = logo;
	    page.metadata.glwview = plugin.path + "views/array.view";
        }
        if (page.options) {
            page.options.createInt('childTilesX', 'Number of X Child Tiles', 6, 1, 10, 1, '', function (v) {
                page.metadata.childTilesX = v;
            }, true);
            page.options.createInt('childTilesY', 'Number of Y Child Tiles', 2, 1, 4, 1, '', function (v) {
                page.metadata.childTilesY = v;
            }, true);
            page.options.createBool('informationBar', 'Information Bar', true, function (v) {
                page.metadata.informationBar = v;
            }, true);
        }
        page.type = "directory";
	page.contents = "items";
	page.loading = false;
    }

    function setStdPageHeader(page, title) {
        if (page.metadata) {
	    page.metadata.title = title;
	    page.metadata.logo = logo;
        }
        page.type = "directory";
	page.contents = "items";
	page.loading = false;
    }

    // create plugin favorites store
    var store = plugin.createStore('favorites', true)
    if (!store.list)
        store.list = "[]";

    // create plugin service
    plugin.createService(plugin.getDescriptor().id, plugin.getDescriptor().id + ":start", "audio", true, logo);

    // create settins
    var settings = plugin.createSettings("icecast", logo, plugin.getDescriptor().synopsis);

    settings.createAction("cleanFavorites", "Clean My Favorites", function () {
        store.list = "[]";
        showtime.notify('My Favorites has been cleaned succesfully', 2);
    });

    function trim(str) {
        if (!str) return '';
        return showtime.entityDecode(str).replace(/^\s+|\s+$/g,"");
    }

    var blue = "6699CC", orange = "FFA500";

    function colorStr(str, color) {
        return '<font color="' + color + '"> (' + str + ')</font>';
    }

    function scrape_page(page, url, noReq, searcher) {
        page.entries = 0;
        var nextPage = '';
	var tryToSearch = true;

        function loader() {
            var doc;
            if (!tryToSearch) return false;
            if (noReq)
                doc = url;
            else {
                page.loading = true;
                if (searcher && page.entries)
                    doc = showtime.entityDecode(showtime.httpReq(BASE_URL + '/search' + nextPage)).toString();
                else
                    doc = showtime.entityDecode(showtime.httpReq(url + nextPage)).toString();
                page.loading = false;
            }
	    var itemmd = {};
            var re = /<tr class="row([\S\s]*?)<\/tr>/g;
            var match = re.exec(doc);
	    while (match) {
                var title = match[1].match(/<span class="name"><a href="[\S\s]*?;">([\S\s]*?)<\/a>/);
                if (title)
                    itemmd.station = title[1];
                else
                    itemmd.station = itemmd.title = match[1].match(/<span class="name">([\S\s]*?)<\/span>/)[1];
	        itemmd.listeners = match[1].match(/<span class="listeners">\[([\S\s]*?)\]<\/span>/)[1];
                var description = match[1].match(/<p class="stream-description">([\S\s]*?)<\/p>/);
                if (description) itemmd.description = description[1];
                var onair = match[1].match(/<p class="stream-onair"><strong>On Air:<\/strong>([\S\s]*?)<\/p>/);
                if (onair) itemmd.current_track = onair[1];
                itemmd.url = match[1].match(/<td class="tune-in">[\S\s]*?<a href="([\S\s]*?)"/)[1];
                itemmd.bitrate = match[1].match(/<p class="format" title="([\S\s]*?)">/)[1];
                itemmd.format = match[1].match(/<p class="format"[\S\s]*?class="no-link" title="[\S\s]*?">([\S\s]*?)<span/)[1];

	        // add item to showtime page
	        var item = page.appendItem("icecast:" + BASE_URL + itemmd.url, "station", {
		    title: new showtime.RichText(itemmd.station + colorStr(itemmd.format + " " + itemmd.bitrate, orange)),
		    station: itemmd.station,
                    onair: trim(itemmd.current_track),
		    description: trim(itemmd.description),
		    bitrate: itemmd.bitrate,
		    format: itemmd.format,
		    listeners: trim(itemmd.listeners)
	        });
                match = re.exec(doc);
                page.entries++;

	        item.url = "icecast:" + BASE_URL + itemmd.url;
	        item.title = itemmd.title;
	        item.station = itemmd.station;
	        item.description = itemmd.description;
	        item.bitrate = itemmd.bitrate;
	        item.format = itemmd.format;

	        item.addOptAction("Add '" + itemmd.station + "' to My Favorites", "addFavorite");
                function setEventHandler(obj) {
                }

                if (typeof Duktape != "undefined") {
	            item.onEvent("addFavorite", function(item) {
		        var entry = showtime.JSONEncode({
		            url: this.url,
		            title: this.station,
		            station: this.station,
		            description: this.description,
		            format: this.format,
		            bitrate: this.bitrate
		        });
                        store.list = showtime.JSONEncode([entry].concat(eval(store.list)));
    		        showtime.notify("'" + this.station + "' has been added to My Favorites.", 2);
	            }.bind(item));
                } else {
	            item.onEvent("addFavorite", function(item) {
		        var entry = showtime.JSONEncode({
		            url: this.url,
		            title: this.station,
		            station: this.station,
		            description: this.description,
		            format: this.format,
		            bitrate: this.bitrate
		        });
                        store.list = showtime.JSONEncode([entry].concat(eval(store.list)));
    		        showtime.notify("'" + this.station + "' has been added to My Favorites.", 2);
	            });
                }
	    }

            var next = doc.match(/<ul class="pager">([\S\s]*?)<\/ul>/);
            if (next)
                next = next[1].substr(next[1].lastIndexOf('<a href='));
            else
                return tryToSearch = false;
            next = next.match(/<a href="([\S\s]*?)">»<\/a>/);
            if (!next)
                return tryToSearch = false;
            nextPage = next[1];
            return true;
        }
        loader();
        page.paginator = loader;
        page.loading = false;
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
		title: itemmd.station,
		station: itemmd.station,
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

    // Filter
    plugin.addURI(plugin.getDescriptor().id + ":filter:(.*):(.*)", function(page, url, title) {
        setPageHeader(page, plugin.getDescriptor().synopsis + " - " + title);
	scrape_page(page, BASE_URL + url);
    });

    // Genres
    var genres;
    plugin.addURI(plugin.getDescriptor().id + ":genres", function(page) {
        setStdPageHeader(page, "Genres");
        // 1-link, 2-title
        var re = /<span class="context">[\S\s]*?<\/span><a href="([\S\s]*?)"[\S\s]*?title="[\S\s]*?">([\S\s]*?)<\/a>/g;
        if (genres) {
            page.appendItem("", "separator", {
                title: "Genres"
            });
            var rec = re.exec(genres[1])
            while (rec) {
	        page.appendItem(plugin.getDescriptor().id + ":filter:" + rec[1] + ":" + rec[2], "directory", {
		    title: rec[2]
	        });
                rec = re.exec(genres[1]);
            };
        };
    });

    // Formats
    var formats;
    plugin.addURI(plugin.getDescriptor().id + ":formats", function(page) {
        setStdPageHeader(page, "Formats");
        // 1-link, 2-title
        var re = /<li><a href="([\S\s]*?)">([\S\s]*?)<\/a>/g;
        if (formats) {
            page.appendItem("", "separator", {
                title: "Formats"
            });
            var rec = re.exec(formats[1])
            while (rec) {
	        page.appendItem(plugin.getDescriptor().id + ":filter:" + rec[1] + ":" + rec[2], "directory", {
		    title: rec[2]
	        });
                rec = re.exec(formats[1]);
            };
        };
    });

    // Start page
    plugin.addURI(plugin.getDescriptor().id + ":start", function(page) {
	page.metadata.logo = logo;
	page.metadata.title = plugin.getDescriptor().synopsis;
	page.type = "directory";
	page.contents = "items";
	page.loading = false;
        page.loading = true;
        var resp = showtime.entityDecode(showtime.httpReq(BASE_URL));
        page.loading = false;

        // Statistics
        var match = resp.match(/<div id="sidebar-statistics">[\S\s]*?<ul>([\S\s]*?)<\/ul>/);
        // 1-stream type, 2-counter
        var re = /<li>([\S\s]*?)<strong>([\S\s]*?)<\/strong>/g;
        var stat = '', pos = 0;
        if (match) {
            var rec = re.exec(match[1])
            while (rec) {
                if (pos) stat += ', ' + rec[1] + rec[2]; else stat += rec[1] + rec[2];
                pos++;
                rec = re.exec(match[1]);
            };
            page.appendItem("", "separator", {
                title: stat
            });
        }

        // Genres
        genres = resp.match(/<div id="search-genre">([\S\s]*?)<\/ul>/);
	page.appendItem(plugin.getDescriptor().id + ":genres", "directory", {
	    title: "Genres"
	});

        // Formats
        formats = resp.match(/<div id="search-format">([\S\s]*?)<\/ul>/);
	page.appendItem(plugin.getDescriptor().id + ":formats", "directory", {
	    title: "Formats"
	});

	page.appendItem(plugin.getDescriptor().id + ":favorites", "directory", {
	    title: "My Favorites"
	});

        // Random selection
        page.appendItem("", "separator", {
            title: "Random selection"
        });
        scrape_page(page, resp, 1);
    });

    plugin.addSearcher("icecast", logo, function(page, query) {
        setPageHeader(page, plugin.getDescriptor().id);
	scrape_page(page, BASE_URL + "/search?search=" + query.replace(/\s/g, '+'), 0 , 1);
    });
})(this);