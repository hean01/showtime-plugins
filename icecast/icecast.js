/*
 *  icecast directory
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

    var BASE_URL = "http://dir.xiph.org";
    var PREFIX = "icecast:";

    var genres = [
	"80s",
	"Alternative",
	"Ambient",
	"Breaks",
	"Chillout",
	"Dance",
	"Dubstep",
	"Drumnbass",
	"Electronic",
	"Funk",
	"Gothic",
	"Harcore",
	"Hardstyle",
	"Hardtrance",
	"Hip Hop",
	"House",
	"Jazz",
	"Jungle",
	"Lounge",
	"Metal",
	"Minimal",
	"Mixed",
	"Pop",
	"Progressive",
	"Punk",
	"Radio",
	"Rock",
	"Techno",
	"Top40",
	"Trance",
	"Tribal",
	"Various"
    ];


    // create plugin favorites store
    var store = plugin.createStore('favorites', true)
    if (!store.list) {
        store.version = "1";
        store.background = "";
        store.title = "icecast » My Favorites";
        store.list = "[]";
    }

    // create plugin service
    plugin.createService("icecast", PREFIX + "start", "audio", true,
			 plugin.path + "icecast_square.png");

    // create settins
    var settings = plugin.createSettings("icecast", plugin.path + "icecast_square.png",
			 "icecast: radio stream directory");

    settings.createAction("cleanFavorites", "Clean Local Favorites", 
			  function () {
        store.list = "[]";
        showtime.trace('Local Favorites were clean succesfully');
    });


    function trim(str) {
        return str.replace(/^\s+|\s+$/g,"");
    }

    function fixup_html(doc) {
	doc = doc.replace(/\&amp;/g,'&');
	doc = doc.replace(/\&gt;/g,'>');
	doc = doc.replace(/\&lt;/g,'<');
	doc = doc.replace(/\&#039;/g,'\'');
	return doc;
    }

    function getValue(doc, start, end) {
	var s = doc.indexOf(start);
	if (s < 0)
	    return null;

	s = s + start.length;

	if (end != null) {
	    var e = doc.indexOf(end,s);
	    if (e < 0)
		return null;

	    return doc.substr(s, e-s);
	} 

	return doc.substr(s);
    }

    function scrape_page(page, doc) {

	var itemmd = {};
	doc = fixup_html(doc);
	while(1) {
	    var str = "<tr class=\"row";
	    var s = doc.indexOf(str, 2);
	    if (s < 0)
		break;
	    doc = doc.substr(s);

	    // get title
	    str = getValue(doc, "<span class=\"name\">","</span>");
	    if (str == null) continue;
	    if (str.indexOf("<a href=") >= 0) {
		// name is a link
		str = getValue(str, ">","</a>");
		if (str == null) continue;
	    }
	    itemmd.station = itemmd.title = trim(str);

	    // description [optional]
	    str =  getValue(doc, "<p class=\"stream-description\">","</p>");
	    if (str) {
		itemmd.description = str;
		showtime.trace("Description: '"+itemmd.description+"'");
	    }

	    // get listeners
	    str = getValue(doc, "<span class=\"listeners\">","</span>");
	    if (str == null) continue;
	    str = getValue(str, "[","&nbsp;listeners]");
	    if (str == null) continue;
	    itemmd.listeners = trim(str);

	    // get current track playing
	    str = getValue(doc, "<p class=\"stream-onair\">","</p>");
	    if (str == null) continue;
	    str = getValue(str, "</strong>", null);
	    if (str == null) continue;
	    itemmd.current_track = trim(str);
	    
	    // get playlist url
	    var str = "<a href=\"/listen/";
	    var s = doc.indexOf(str, 2);
	    if (s < 0)
		continue;
	    doc = doc.substr(s);
	    str = getValue(doc, "<a href=\"","\"");
	    if(str == null) continue;
	    itemmd.url = trim(str);

	    // get format and bitrate
	    var str = "<p class=\"format\" title=\"";
	    var s = doc.indexOf(str, 2);
	    if (s < 0)
		continue;
	    doc = doc.substr(s);

	    str = getValue(doc, "title=\"", "\"");
	    if (str == null) continue;
	    itemmd.bitrate = trim(str);

	    str = getValue(doc, "streams\">", "<span");
	    if (str == null) continue;
	    itemmd.format = trim(str);

	    // add item to showtime page
	    var item = page.appendItem("shoutcast:" + BASE_URL + itemmd.url, "station", {		
		title: itemmd.current_track,
		station: itemmd.station,
		description: itemmd.description,
		bitrate: itemmd.bitrate,
		format: itemmd.format,
		listeners: itemmd.listeners
	    }); 

	    item.url = "shoutcast:" + BASE_URL + itemmd.url;
	    item.title = itemmd.title;
	    item.station = itemmd.station;
	    item.description = itemmd.description;
	    item.bitrate = itemmd.bitrate;
	    item.format = itemmd.format;


	    item.addOptAction("Add station to favorites", "addFavorite");
	    
	    item.onEvent("addFavorite", function(item) {
		var entry = {
		    url: this.url,
		    title: this.station,
		    station: this.station,
		    description: this.description,
		    format: this.format,
		    bitrate: this.bitrate
		};
		var list = eval(store.list);
                var array = [showtime.JSONEncode(entry)].concat(list);
                store.list = showtime.JSONEncode(array);
		showtime.notify("Station was added to your favorites.", 2);		
	    });
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
	page.metadata.title = "Search result: " + query;
	page.metadata.logo = plugin.path + "icecast_square.png";
	page.metadata.glwview = plugin.path + "views/array.view";
	page_menu(page);

	page.loading = true;
	var doc = showtime.httpGet(BASE_URL + "/search?search=" + query, {}).toString();
	scrape_page(page, doc);
	page.loading = false;
    });

    // Favorites
    plugin.addURI(PREFIX + "favorites", function(page) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.title = "Favorites";
	page.metadata.logo = plugin.path + "icecast_square.png";
	page.metadata.glwview = plugin.path + "views/array.view";
	page_menu(page);

	var list = eval(store.list);
	for each (item in list) {
	    var itemmd = showtime.JSONDecode(item);

	    // add item to showtime page
	    var item = page.appendItem(itemmd.url, "station", {
		title: itemmd.station,
		station: itemmd.station,
		description: itemmd.description,
		bitrate: itemmd.bitrate,
		format: itemmd.format,
		listeners: itemmd.listeners
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

    plugin.addURI(PREFIX + "search:(.*)", function(page, query) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.title = "Search result: " + query;
	page.metadata.logo = plugin.path + "icecast_square.png";
	page.metadata.glwview = plugin.path + "views/array.view";
	page_menu(page);
	var doc = showtime.httpGet(BASE_URL + "/search?search=" + query, {}).toString();
	scrape_page(page, BASE_URL + "/search?search=" + doc);
	page.loading = false;
    });


    // Genre
    plugin.addURI(PREFIX + "genre:(.*)", function(page, genre) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.logo = plugin.path + "di_square.png";
	page.metadata.title = "icecast directory - " + genre;
	page.metadata.glwview = plugin.path + "views/array.view";
	page_menu(page);
	var doc = showtime.httpGet(BASE_URL + "/by_genre/" + genre, {}).toString();
	scrape_page(page, doc);
	page.loading = false;
    });

    // Start page
    plugin.addURI(PREFIX + "start", function(page) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.logo = plugin.path + "di_square.png";
	page.metadata.title = "icecast directory";

	page.appendItem(PREFIX + "search", "item", {
	    title: "Search"
	});

	page.appendItem(PREFIX + "favorites", "item", {
	    title: "My Favorites"
	});

        page.appendPassiveItem("divider");  
	
	for each (genre in genres) {
	    page.appendItem(PREFIX + "genre:"+genre, "item", {
		title: genre
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
