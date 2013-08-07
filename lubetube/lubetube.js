/*
 *  LubeTube - Showtime Plugin
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
    var BASE_URL = "http://lubetube.com"
    var PREFIX = "lubetube:"
    var logo = plugin.path + "lubetube.png";

    function setPageHeader(page, title) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
    }

    plugin.createService("LubeTube", PREFIX + "start", "video", true, plugin.path + "lubetube.png");

    function indexPornstars(page) {
        var title = page.metadata.title;
        var offset = 0;

        function loader() {
            var p = Math.floor(1 + (offset / 50));
            var response = showtime.httpGet(BASE_URL + "/pornstars/?page=" + p).toString();
            var re = /px;">[\S\s]*?<a href="([^"]+)[\S\s]*?class="main_gallery" src="([^"]+)[\S\s]*?title="Pornstar Name">([^\<]+)[\S\s]*?;">Videos: ([^\s\&]+)[\S\s]*?Views: ([^\<]+)/g;
            var match = re.exec(response);
            while (match) {
                page.appendItem(PREFIX + "pornstar:" + match[1] + ":" + match[3] + " (" + match[4] + ")", "video", {
                    title: new showtime.RichText(match[3] + '<font color="6699CC"> (Videos: </font>' + match[4] + '<font color="6699CC"> Views: </font>' + match[5] + '<font color="6699CC">)</font>'),
                    icon: match[2]
                });
                match = re.exec(response);
                offset++;
            }
            re = />All Pornstars \(([0-9]+)\)</;
            match = re.exec(response);
            if (match) {
                page.entries = match[1];
                page.metadata.title = title + " (" + match[1] + ")"
            }
            return offset < page.entries;
        }
        loader();
        page.loading = false;
        page.paginator = loader;
    }

    function indexVideos(page, uri) {
        var offset = 0;

        function loader() {
            var p = Math.floor(1 + (offset / 50));
            var response = showtime.httpGet(BASE_URL + uri + "page=" + p).toString();
            var re = /">next<\/a>/;
            if ((offset > 0) && (!re.exec(response))) return false;
            re = /" href="(http:\/\/lubetube.com\/video\/([^"]+))" title="([^"]+)"><img src="([^"]+)[\S\s]*?<span class="length">Length: ([^\<]+)<[\S\s]*?<span class="views">Views: ([^\<]+)<[\S\s]*?<span class="rating" style="width:([^\%]+)\%/g;
            var match = re.exec(response);
            while (match) {
                page.appendItem(PREFIX + "play:" + escape(match[1]) + ":" + escape(match[3]), "video", {
                    title: new showtime.RichText(match[3] + '<font color="6699CC"> (' + match[5] + ')</font>'),
                    icon: match[4],
                    description: new showtime.RichText('<font color="6699CC">Views: </font>' + match[6]),
                    genre: 'Adult',
                    duration: match[5],
                    rating: match[7] * 1
                });
                match = re.exec(response);
                offset++;
            }
            return true;
        }
        loader();
        page.loading = false;
        page.paginator = loader;
    }

    function index(page, url) {
        var offset = 0;
        if (page.metadata) var title = page.metadata.title;

        function loader() {
            var p = Math.floor(1 + (offset / 50));
            var response = showtime.httpGet(url + "&page=" + p).toString();
            var re = /<a class="frame" href="(http:\/\/lubetube.com\/video\/([^"]+))" title="([^"]+)"><img src="([^"]+)[\S\s]*?<span class="length">Length: ([^\<]+)<[\S\s]*?<span class="views">Views: ([^\<]+)<[\S\s]*?<span class="rating" style="width:([^\%]+)\%/g;
            var match = re.exec(response);
            while (match) {
                page.appendItem(PREFIX + "play:" + escape(match[1]) + ":" + escape(match[3]), "video", {
                    title: new showtime.RichText(match[3] + '<font color="6699CC"> (' + match[5] + ')</font>'),
                    icon: match[4],
                    description: new showtime.RichText('<font color="6699CC">Views: </font>' + match[6]),
                    genre: 'Adult',
                    duration: match[5],
                    rating: match[7] * 1
                });
                match = re.exec(response);
                offset++;
            }

            re = /<strong>([0-9]+)<\/strong> videos/;
            match = re.exec(response);
            if (match) {
                page.entries = match[1];
                if (page.metadata) page.metadata.title = title + " - found (" + match[1] + ") videos"
            }
            return offset < page.entries;
        }
        loader();
        page.loading = false;
        page.paginator = loader;
    }

    function videolink(url) {
        var response = showtime.httpGet(url).toString();
        var re = /playlist_flow_player_flv.php\?vid=[0-9]+/;
        var match = re.exec(response);
        if (match) {
            re = /url="([^"]+)"/;
            response = showtime.entityDecode(showtime.httpGet(BASE_URL + "/" + match[0]).toString());
            match = re.exec(response);
            if (match) return unescape(match[1])
        }
        return null;
    }

    // Play videolink
    plugin.addURI(PREFIX + "play:(.*):(.*)", function(page, url, title) {
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
	    canonicalUrl: PREFIX + "play:" + url + ":" + title,
            sources: [{
                url: videolink(unescape(url))
            }]
        });
    });

    // Sorting selected category
    plugin.addURI(PREFIX + "sorting:(.*):(.*)", function(page, name, uri) {
        setPageHeader(page, 'Lubetube - ' + name);
        page.loading = false;
        page.appendItem(PREFIX + 'category:' + name + ":" + uri, 'directory', {
            title: "Newest",
            icon: logo
        });
        page.appendItem(PREFIX + 'category:' + name + ":" + uri.replace("adddate", "rate"), 'directory', {
            title: "Highest rated",
            icon: logo
        });
        page.appendItem(PREFIX + 'category:' + name + ":" + uri.replace("adddate", "viewnum"), 'directory', {
            title: "Most Viewed",
            icon: logo
        });
        page.appendItem(PREFIX + 'category:' + name + ":" + uri.replace("adddate", "title"), 'directory', {
            title: "By Title",
            icon: logo
        });
    });

    // Enter category
    plugin.addURI(PREFIX + "category:(.*):(.*)", function(page, name, uri) {
        setPageHeader(page, name);
        index(page, BASE_URL + uri);
    });

    // Pornstar page
    plugin.addURI(PREFIX + "pornstar:(.*):(.*)", function(page, uri, name) {
        setPageHeader(page, 'Lubetube - ' + name);
        indexVideos(page, uri + "?");
    });

    // Pornstars page
    plugin.addURI(PREFIX + "pornstars", function(page) {
        setPageHeader(page, 'Lubetube - Pornstars');
        indexPornstars(page);
    });

    // Main page
    plugin.addURI(PREFIX + "movies:(.*):(.*)", function(page, uri, title) {
        setPageHeader(page, 'Lubetube - ' + title);
        indexVideos(page, uri);
    });


    // Categories page
    plugin.addURI(PREFIX + "categories", function(page) {
        setPageHeader(page, 'Lubetube - Categories');
        var response = showtime.httpGet(BASE_URL + "/categories");
        page.loading = false;
	// 1 - uri, 2 - image, 3 - title
        var re = /<a href="http:\/\/lubetube.com([^\s]+)page=1"><img width="[0-9]+" height="[0-9]+" alt="[^"]+" class="main_gallery" src="([^\s]+)" title="([^"]+)" \/><\/a><br \/>/g;
        var match = re.exec(response);
        while (match) {
            page.appendItem(PREFIX + "sorting:" + match[3] + ":" + match[1], "directory", {
                title: match[3],
                icon: match[2]
            });
            var match = re.exec(response);
        }
    });

    // Start page
    plugin.addURI(PREFIX + "start", function(page) {
        setPageHeader(page, "LubeTube - Home");
        page.loading = false;
        page.appendItem(PREFIX + 'movies:/view/basic/mostrecent/:Newest', 'directory', {
            title: 'Newest'
        });
        page.appendItem(PREFIX + 'movies:/view/basic/toprated/:Highest Rated', 'directory', {
            title: 'Highest Rated'
        });
        page.appendItem(PREFIX + 'movies:/view/basic/mostviewed/:Most Viewed', 'directory', {
            title: 'Most Viewed'
        });
        page.appendItem(PREFIX + 'categories', 'directory', {
            title: 'Categories'
        });
        page.appendItem(PREFIX + 'pornstars', 'directory', {
            title: 'Pornstars'
        });
    });

    plugin.addSearcher("LubeTube - Videos", logo, function(page, query) {
        index(page, BASE_URL + "/search/videos?search_id=" + query.replace(/\s/g, '\+'));
    });

})(this);
