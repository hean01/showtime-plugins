/*
 *  LubeTube - Showtime Plugin
 *
 *  Copyright (C) 2012-2014 Henrik Andersson, lprot
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
    var logo = plugin.path + "lubetube.png";

    function setPageHeader(page, title) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    }

    var blue = "6699CC", orange = "FFA500";

    function colorStr(str, color) {
        return '<font color="' + color + '"> (' + str + ')</font>';
    }

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    plugin.createService(plugin.getDescriptor().id, plugin.getDescriptor().id + ":start", "video", true, logo);

    function indexPornstars(page) {
        page.loading = true;
        page.entries = 0;
        var tryToSearch = true, url = '/pornstars/'

        function scraper(doc) {
	    // 1-link, 2-icon, 3-title, 4-videos, 5-views
            var re = /<li>[\S\s]*?<a href="([\S\s]*?)">[\S\s]*?src="([\S\s]*?)" title="([\S\s]*?)"[\S\s]*?<p>Videos: ([\S\s]*?) \&nbsp; Views: ([\S\s]*?)<\/p>/g;
            var match = re.exec(doc);
            while (match) {
                page.appendItem(plugin.getDescriptor().id + ":pornstar:" + escape(match[1]) + ":" + escape(match[3]), "video", {
                    title: new showtime.RichText(match[3] + colorStr(match[4], orange)),
                    icon: match[2],
                    description: new showtime.RichText(coloredStr('Views: ', orange) + match[5])
                });
                page.entries++;
                match = re.exec(doc);
            }
        }

        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var doc = showtime.httpReq(checkLink(url)).toString();
            page.loading = false;
            var mp = doc.match(/<h2>Featured Pornstars<\/h2>([\S\s]*?)<\/ul>/);
            if (mp) {
                page.appendItem("", "separator", {
                    title: 'Featured Pornstars'
                });
                scraper(mp[1]);
                page.appendItem("", "separator", {
                    title: doc.match(/<br class="clear" \/>[\S\s]*?<h2>([\S\s]*?)<\/h2>/)[1]
                });
            }
            scraper(doc.substr(doc.lastIndexOf('<div class="seperator">')));
            var next = doc.match(/<a class="next" href="([\S\s]*?)">Next<\/a>/);
            if (!next) return tryToSearch = false;
            url = next[1];
            return true;
        }
        loader();
        page.paginator = loader;
    }

    // Play videolink
    plugin.addURI(plugin.getDescriptor().id + ":play:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var doc = showtime.httpReq(unescape(url)).toString();
	page.loading = false;
        page.type = "video";
        var link = doc.match(/<a id="video-hd" href="([\S\s]*?)"/);
        if (!link) link = doc.match(/<a id="video-high" href="([\S\s]*?)"/);
        if (!link) link = doc.match(/<a id="video-standard" href="([\S\s]*?)"/);
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            canonicalUrl: plugin.getDescriptor().id + ":play:" + url + ":" + title,
            sources: [{
                url: link[1]
            }]
        });
    });

    // Sorting selected category
    plugin.addURI(plugin.getDescriptor().id + ":sorting:(.*):(.*)", function(page, title, url) {
        setPageHeader(page, 'Lubetube - ' + unescape(title));
        page.appendItem(plugin.getDescriptor().id + ':category:' + title + ":" + url, 'directory', {
            title: "Newest",
            icon: logo
        });
        page.appendItem(plugin.getDescriptor().id + ':category:' + title + ":" + url.replace("adddate", "rate"), 'directory', {
            title: "Highest rated",
            icon: logo
        });
        page.appendItem(plugin.getDescriptor().id + ':category:' + title + ":" + url.replace("adddate", "viewnum"), 'directory', {
            title: "Most Viewed",
            icon: logo
        });
        page.appendItem(plugin.getDescriptor().id + ':category:' + title + ":" + url.replace("adddate", "title"), 'directory', {
            title: "By Title",
            icon: logo
        });
    });

    // Enter category
    plugin.addURI(plugin.getDescriptor().id + ":category:(.*):(.*)", function(page, title, url) {
        setPageHeader(page, unescape(title));
        index(page, unescape(url));
    });

    // Pornstar page
    plugin.addURI(plugin.getDescriptor().id + ":pornstar:(.*):(.*)", function(page, url, title) {
        setPageHeader(page, 'Lubetube - ' + unescape(title));
        index(page, unescape(url));
    });

    // Pornstars page
    plugin.addURI(plugin.getDescriptor().id + ":pornstars", function(page) {
        setPageHeader(page, 'Lubetube - Pornstars');
        indexPornstars(page);
    });

    // Main page
    plugin.addURI(plugin.getDescriptor().id + ":movies:(.*):(.*)", function(page, url, title) {
        setPageHeader(page, 'Lubetube - ' + unescape(title));
        index(page, unescape(url));
    });


    // Categories page
    plugin.addURI(plugin.getDescriptor().id + ":categories", function(page) {
        setPageHeader(page, 'Lubetube - Categories');
        page.loading = true;
        var doc = showtime.httpReq(BASE_URL + "/categories").toString();
        page.loading = false;
        var mp = doc.match(/<ul class="gallery">([\S\s]*?)<\/ul>/)[1];
	// 1-link, 2-numofvideos, 3-icon, 4-title
        var re = /<li>[\S\s]*?<a href="([\S\s]*?)">[\S\s]*?<\/i> ([\S\s]*?)<\/span>[\S\s]*?src="([\S\s]*?)" title="([\S\s]*?)"/g;
        var match = re.exec(mp);
        while (match) {
            page.appendItem(plugin.getDescriptor().id + ":sorting:" + escape(match[4]) + ":" + escape(match[1]), "video", {
                title: new showtime.RichText(match[4] + colorStr(match[2], blue)),
                icon: match[3]
            });
            var match = re.exec(mp);
        }
    });

    function checkLink(link) {
        if (link.substr(0, 4) != 'http') return BASE_URL + link;
        return link;
    }

    function index(page, url) {
        page.loading = true;
        page.entries = 0;
        var tryToSearch = true;

        function scraper(doc) {
            // 1-link, 2-title, 3-icon, 4-length, 5-views, 6-rating
            var re = /<span class="videothumb"[\S\s]*?href="([\S\s]*?)" title="([\S\s]*?)"><img src="([\S\s]*?)"[\S\s]*?<span class="length">Length: ([^\<]+)<[\S\s]*?<span class="views">Views: ([^\<]+)<[\S\s]*?<span class="rating" style="width:([^\%]+)\%/g;
            var match = re.exec(doc);
            while (match) {
                page.appendItem(plugin.getDescriptor().id + ":play:" + escape(match[1]) + ":" + escape(match[2]), "video", {
                    title: new showtime.RichText(match[2] + colorStr(match[4], orange)),
                    icon: match[3],
                    description: new showtime.RichText(coloredStr('Views: ', orange) + match[5]),
                    genre: 'Adult',
                    duration: match[4],
                    rating: match[6] * 10
                });
                page.entries++;
                match = re.exec(doc);
            }
        }

        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var doc = showtime.httpReq(checkLink(url)).toString();
            page.loading = false;
            var mp = doc.match(/<h2>Most Popular Videos<\/h2>([\S\s]*?)<span class="seperator_rt">/);
            if (mp) {
                page.appendItem("", "separator", {
                    title: 'Most Popular Videos'
                });
                scraper(mp[1]);
                page.appendItem("", "separator", {
                    title: 'Videos (' + doc.match(/<span class="seperator_rt">[\S\s]*?of <strong>([\S\s]*?)<\/strong>/)[1] + ')'
                });
            }
            var blob = doc.match(/<span class="seperator_rt">([\S\s]*?)<\/html>/);
            if (blob)
                scraper(blob[1])
            else
                return tryToSearch = false;
            var next = doc.match(/<a class="next" href="([\S\s]*?)">Next<\/a>/);
            if (!next) return tryToSearch = false;
            url = next[1];
            return true;
        }
        loader();
        page.paginator = loader;
    }

    // Start page
    plugin.addURI(plugin.getDescriptor().id + ":start", function(page) {
        setPageHeader(page, "LubeTube - Home");
        page.appendItem(plugin.getDescriptor().id + ':movies:/view/basic/mostrecent/:Newest', 'directory', {
            title: 'Newest'
        });
        page.appendItem(plugin.getDescriptor().id + ':movies:/view/basic/toprated/:Highest Rated', 'directory', {
            title: 'Highest Rated'
        });
        page.appendItem(plugin.getDescriptor().id + ':movies:/view/basic/mostviewed/:Most Viewed', 'directory', {
            title: 'Most Viewed'
        });
        page.appendItem(plugin.getDescriptor().id + ':categories', 'directory', {
            title: 'Categories'
        });
        page.appendItem(plugin.getDescriptor().id + ':pornstars', 'directory', {
            title: 'Pornstars'
        });
        index(page, BASE_URL);
    });

    plugin.addSearcher(plugin.getDescriptor().id, logo, function(page, query) {
        index(page, BASE_URL + "/search/videos?search_id=" + encodeURI(query));
    });
})(this);
