/*
 *  www.shoutcast.com plugin for Showtime
 *
 *  Copyright (C) 2014 lprot
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
    var BASE_URL = "http://api.shoutcast.com";
    var PREFIX = "shoutcast:";
    var logo = plugin.path + "logo.png";
    var k = 'sh1t7hyn3Kh0jhlV';

    function setPageHeader(page, title) {
        page.loading = false;
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
    }

    var blue = "6699CC", orange = "FFA500";

    function colorStr(str, color) {
        return '<font color="' + color + '"> (' + str + ')</font>';
    }

    // create plugin favorites store
    var store = plugin.createStore('favorites', true)
    if (!store.list) {
        store.version = "1";
        store.background = "";
        store.title = "Shoutcast » My Favorites";
        store.list = "[]";
    }

    // create plugin service
    plugin.createService(plugin_info.id, PREFIX + "start", "audio", true, logo);

    // create settings
    var settings = plugin.createSettings(plugin_info.id, logo, plugin_info.synopsis);

    settings.createAction("cleanFavorites", "Clean My Favorites", function() {
        store.list = "[]";
        showtime.notify('My Favorites are succesfully cleaned.', 2);
    });

    function trim(str) {
        return str.replace(/^\s+|\s+$/g,"");
    }

    function fill_fav(page) {
	var list = eval(store.list);
        if (!list || !list.toString()) {
           page.error("My Favorites list is empty");
           return;
        }

        var pos = 0;
	for (item in list) {
	    var itemmd = showtime.JSONDecode(list[item]);

	    var item = page.appendItem(itemmd.url, "station", {
		title: new showtime.RichText(itemmd.title),
                station: itemmd.station
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
        setPageHeader(page, "My Favorites");
        fill_fav(page);
    });

    plugin.addURI(PREFIX + "listStations:(.*):(.*)", function(page, title, category) {
        setPageHeader(page, 'Shoutcast - ' + unescape(unescape(title)));
        getStations(page, 'sub', '', category, '0');
    });

    plugin.addURI(PREFIX + "subgenre:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, 'Shoutcast - ' + unescape(title));
        page.loading = true;
        var json = showtime.JSONDecode(showtime.httpReq(BASE_URL+'/genre/secondary?parentid='+id+'&k='+k+'&f=json').toString());
        page.loading = false;

        if (json.response.data.genrelist.genre) {
        for (var i in json.response.data.genrelist.genre) {
            var genre = json.response.data.genrelist.genre[i];
	    page.appendItem(PREFIX + "subgenre:"+genre.id+":"+escape(genre.name), "directory", {
		title: genre.name
	    });
        };
        }
        getRandomStations(page);
    });

    plugin.addURI(PREFIX + "genres", function(page) {
        setPageHeader(page, 'Shoutcast - Genres');
        page.loading = true;
        var json = showtime.JSONDecode(showtime.httpReq(BASE_URL+'/genre/primary?k='+k+'&f=json').toString());
        page.loading = false;

        for (var i in json.response.data.genrelist.genre) {
            var genre = json.response.data.genrelist.genre[i];
	    page.appendItem(PREFIX + "subgenre:"+genre.id+":"+escape(genre.name), "directory", {
		title: genre.name
	    });
        };
        getRandomStations(page);
    });

    function getRandomStations(page) {
        page.loading = true;
        var xml = showtime.httpReq(BASE_URL+'/station/randomstations?k='+k+'&f=xml').toString();
        page.loading = false;
        // 1-title, 2-genre, 3-now playing, 4-format, 5-id, 6-bitrate, 7-listeners
        var re = /<station name="([\s\S]*?)" genre="([\s\S]*?)" ct="([\s\S]*?)" mt="audio\/([\s\S]*?)" id="([\s\S]*?)" br="([\s\S]*?)" lc="([\s\S]*?)"/g;
        var match = re.exec(xml);
        while (match) {
            var item = page.appendItem('icecast:http://yp.shoutcast.com/sbin/tunein-station.pls?id='+match[5], "station", {
                title: new showtime.RichText(match[1]+colorStr(match[2], orange) +
                    colorStr(match[7], orange)+colorStr(match[4]+' '+match[6], orange))
            });
            item.url = 'icecast:http://yp.shoutcast.com/sbin/tunein-station.pls?id='+match[3];
            item.title = match[1]+colorStr(match[2], orange) +
                         colorStr(match[7], orange)+colorStr(match[4]+' '+match[6], orange),
            item.station = match[1];
            item.onEvent("addFavorite", function(item) {
                var entry = {
                    url: this.url,
                    title: this.title,
                    station: this.station
                };
	        showtime.trace("item: "+showtime.JSONEncode(entry));
                var list = eval(store.list);
                var array = [showtime.JSONEncode(entry)].concat(list);
                store.list = showtime.JSONEncode(array);
                showtime.notify("'" + entry.station + "' has been added to My Favorites.", 2);
            });
	    item.addOptAction("Add '" + match[1] + "' to My Favorites", "addFavorite");
            match = re.exec(xml);
        };
    };

    function getStationsFromXML(page, url) {
        page.entries = 0;
	var tryToSearch = true, offset = 0;

        function loader() {
            if (!tryToSearch) return false;

            page.loading = true;
            var xml = showtime.httpReq(url+'&limit='+offset+','+20).toString();
            // 1-title, 2-format, 3-id, 4-bitrate, 5-genre, 6-now playing, 7-listeners
            var re = /<station name="([\s\S]*?)" mt="audio\/([\s\S]*?)" id="([\s\S]*?)" br="([\s\S]*?)" genre="([\s\S]*?)" ct="([\s\S]*?)" lc="([\s\S]*?)"/g;
            page.loading = false;

            var match = re.exec(xml);
            if (!match) return tryToSearch = false;
            while (match) {
                  var item = page.appendItem('icecast:http://yp.shoutcast.com/sbin/tunein-station.pls?id='+match[3], "station", {
                      title: new showtime.RichText(match[1]+colorStr(match[5], orange) +
                             colorStr(match[7], orange)+colorStr(match[2]+' '+match[4], orange))
	          });
                  item.url = 'icecast:http://yp.shoutcast.com/sbin/tunein-station.pls?id='+match[3];
                  item.title = match[1]+colorStr(match[5], orange) +
                              colorStr(match[7], orange)+colorStr(match[2]+' '+match[4], orange),
                  item.station = match[1];
                  item.onEvent("addFavorite", function(item) {
                      var entry = {
                          url: this.url,
                          title: this.title,
                          station: this.station
                      };
		      showtime.trace("item: "+showtime.JSONEncode(entry));
                      var list = eval(store.list);
                      var array = [showtime.JSONEncode(entry)].concat(list);
                      store.list = showtime.JSONEncode(array);
                      showtime.notify("'" + entry.station + "' has been added to My Favorites.", 2);
                  });
	          item.addOptAction("Add '" + match[1] + "' to My Favorites", "addFavorite");
                  page.entries++;
                  match = re.exec(xml);
            };
            offset += 20;
            return true;
        }
        loader();
        page.paginator = loader;
    }

    // Start page
    plugin.addURI(PREFIX + "start", function(page) {
        setPageHeader(page, plugin_info.synopsis);

     	page.appendItem(PREFIX + "genres", "directory", {
	    title: "Genres"
	});

	page.appendItem(PREFIX + "favorites", "directory", {
	    title: "My Favorites"
	});

        getStationsFromXML(page, BASE_URL+'/legacy/Top500?k=' + k);
    });

    plugin.addSearcher("Shoutcast", logo, function(page, query) {
        getStationsFromXML(page, BASE_URL+'/legacy/stationsearch?k=' + k+'&search='+query.replace(/\s/g,'\+'));
    });

})(this);
