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
    var API = "http://api.shoutcast.com", k = 'sh1t7hyn3Kh0jhlV';
    var logo = plugin.path + "logo.png";

    function setPageHeader(page, title) {
        page.loading = false;
        if (page.metadata) {
            page.metadata.title = showtime.entityDecode(unescape(title));
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
    if (!store.list)
        store.list = "[]";

    // create plugin service
    plugin.createService(plugin.getDescriptor().id, plugin.getDescriptor().id + ":start", "audio", true, logo);

    // create settings
    var settings = plugin.createSettings(plugin.getDescriptor().id, logo, plugin.getDescriptor().synopsis);

    settings.createAction("cleanFavorites", "Clean My Favorites", function() {
        store.list = "[]";
        showtime.notify('My Favorites has been succesfully cleaned.', 2);
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
	for (var i in list) {
	    var itemmd = showtime.JSONDecode(list[i]);

	    var item = page.appendItem(itemmd.url, "station", {
		title: itemmd.station,
		station: itemmd.station
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

    plugin.addURI(plugin.getDescriptor().id + ":genresearch:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, 'Shoutcast - ' + title);
        getStationsFromXML(page, API+'/legacy/genresearch?k='+k+'&genre='+showtime.entityDecode(unescape(title)).replace(/\s/g,'\+'));
    });

    plugin.addURI(plugin.getDescriptor().id + ":subgenre:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, 'Shoutcast - ' + title);
        page.loading = true;
        var json = showtime.JSONDecode(showtime.httpReq(API+'/genre/secondary?parentid='+id+'&k='+k+'&f=json').toString());
        page.loading = false;

        if (json.response.data.genrelist.genre) {
        for (var i in json.response.data.genrelist.genre) {
            var genre = json.response.data.genrelist.genre[i];
	    page.appendItem(plugin.getDescriptor().id + ":genresearch:"+genre.id+":"+escape(genre.name), "directory", {
		title: showtime.entityDecode(genre.name)
	    });
        };
        }
        getRandomStations(page);
    });

    plugin.addURI(plugin.getDescriptor().id + ":genres", function(page) {
        setPageHeader(page, 'Shoutcast - Genres');
        page.loading = true;
        var json = showtime.JSONDecode(showtime.httpReq(API + '/genre/primary?k=' + k + '&f=json').toString());
        page.loading = false;

        for (var i in json.response.data.genrelist.genre) {
            var genre = json.response.data.genrelist.genre[i];
            page.appendItem(plugin.getDescriptor().id + (genre.haschildren ? ':subgenre:' : ':genresearch:') + genre.id+":"+escape(genre.name), "directory", {
	        title: showtime.entityDecode(genre.name)
     	    });
        };
        getRandomStations(page);
    });

    function addItemToFavorites(item) {
        var entry = showtime.JSONEncode({
            url: item.url,
            title: item.title,
            station: item.station
        });
        store.list = showtime.JSONEncode([entry].concat(eval(store.list)));
        showtime.notify("'" + item.station + "' has been added to My Favorites.", 2);
    };

    function getRandomStations(page) {
        page.loading = true;
        var xml = showtime.httpReq(API + '/station/randomstations?k=' + k + '&f=xml').toString();
        page.loading = false;
        // 1-title, 2-genre, 3-now playing, 4-format, 5-id, 6-bitrate, 7-listeners
        var re = /<station name="([\s\S]*?)" genre="([\s\S]*?)"[\s\S]*?ct="([\s\S]*?)" mt="audio\/([\s\S]*?)" id="([\s\S]*?)" br="([\s\S]*?)" lc="([\s\S]*?)"/g;
        var match = re.exec(xml);
        while (match) {
            var item = page.appendItem('icecast:http://yp.shoutcast.com/sbin/tunein-station.pls?id=' + match[5], "station", {
                title: new showtime.RichText(match[1]+colorStr(match[2], orange) +
                    colorStr(match[7], orange)+colorStr(match[4]+' '+match[6], orange))
            });
            item.url = 'icecast:http://yp.shoutcast.com/sbin/tunein-station.pls?id=' + match[3];
            item.title = match[1] + colorStr(match[2], orange) +
                         colorStr(match[7], orange) + colorStr(match[4] + ' ' + match[6], orange);
            item.station = match[1];

            if (typeof Duktape != "undefined") {
                item.onEvent("addFavorite", function(item) {
                    addItemToFavorites(this);
	        }.bind(item));
            } else {
	        item.onEvent("addFavorite", function(item) {
                    addItemToFavorites(this);
                });
            }

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
            var xml = showtime.httpReq(url + '&limit=' + offset + ',' + 20).toString();
            // 1-title, 2-format, 3-id, 4-bitrate, 5-genre, 6-now playing, 7-listeners
            var re = /<station name="([\s\S]*?)" mt="audio\/([\s\S]*?)" id="([\s\S]*?)" br="([\s\S]*?)" genre="([\s\S]*?)"[\s\S]*?ct="([\s\S]*?)" lc="([\s\S]*?)"/g;
            page.loading = false;

            var match = re.exec(xml);
            if (!match) return tryToSearch = false;
            while (match) {
                var item = page.appendItem('icecast:http://yp.shoutcast.com/sbin/tunein-station.pls?id='+match[3], "station", {
                    title: new showtime.RichText(match[1]+colorStr(match[5], orange) +
                        colorStr(match[7], orange)+colorStr(match[2]+' '+match[4], orange))
	        });
                item.url = 'icecast:http://yp.shoutcast.com/sbin/tunein-station.pls?id='+match[3];
                item.title = match[1] + colorStr(match[5], orange) +
                             colorStr(match[7], orange) + colorStr(match[2] + ' ' + match[4], orange),
                item.station = match[1];

                if (typeof Duktape != "undefined") {
	            item.onEvent("addFavorite", function(item) {
                        addItemToFavorites(this);
	            }.bind(item));
                } else {
	            item.onEvent("addFavorite", function(item) {
                        addItemToFavorites(this);
                    });
                }

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
    plugin.addURI(plugin.getDescriptor().id + ":start", function(page) {
        setPageHeader(page, plugin.getDescriptor().synopsis);

     	page.appendItem(plugin.getDescriptor().id + ":genres", "directory", {
	    title: "Genres"
	});

	page.appendItem(plugin.getDescriptor().id + ":favorites", "directory", {
	    title: "My Favorites"
	});

        getStationsFromXML(page, API + '/legacy/Top500?k=' + k);
    });

    plugin.addSearcher("Shoutcast", logo, function(page, query) {
        getStationsFromXML(page, API + '/legacy/stationsearch?k=' + k + '&search=' + encodeURI(query));
    });

})(this);
