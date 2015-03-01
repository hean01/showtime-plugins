/**
 * Revision3 plugin for Movian Media Center
 *
 *  Copyright (C) 2015 lprot
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
    var BASE_URL = 'http://revision3.com';
    var logo = plugin.path + "logo.png"

    var blue = "6699CC", orange = "FFA500";

    function colorStr(str, color) {
        return '<font color="' + color + '">(' + str + ')</font>';
    }

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    function setPageHeader(page, title) {
        if (page.metadata) {
            page.metadata.title = decodeURIComponent(title);
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
        page.loading = true;
    }

    function trim(s) {
        return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ");
    }

    var service = plugin.createService(plugin.getDescriptor().title, plugin.getDescriptor().id + ":start", "video", true, logo);

    plugin.addURI(plugin.getDescriptor().id + ":play:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var videoId = showtime.httpReq(BASE_URL + unescape(url)).toString().match(/\'video_id\', (.*)\)/)[1];
        var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/api/getPlaylist.json?api_key=ba9c741bce1b9d8e3defcc22193f3651b8867e62&codecs=h264&video_id=' + videoId));
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: decodeURIComponent(title),
            canonicalUrl: plugin.getDescriptor().id + ':play:' + url + ':' + title,
            sources: [{
                url: 'hls:' + json.items[0].media.h264.hls.url
            }]
        });
        page.loading = false;
    });

    plugin.addURI(plugin.getDescriptor().id + ":start", function(page) {
        setPageHeader(page, plugin.getDescriptor().title);
        var doc = showtime.httpReq(BASE_URL).toString();
        page.loading = false;
        // 1 - link, 2 - icon, 3 - title, 4 - description
        var featured = doc.match(/<div class="featured">[\s\S]*?<a href="([\s\S]*?)"[\s\S]*?background-image: url\(([\s\S]*?)\)[\s\S]*?title">([\s\S]*?)<\/p>[\s\S]*?subtitle">([\s\S]*?)<\/p>/);
        if (featured) {
            page.appendItem("", "separator", {
                title: 'Featured'
            });
            page.appendItem(plugin.getDescriptor().id + ':play:' + escape(featured[1]) + ':' + encodeURIComponent(featured[3]), "video", {
                title: featured[3],
                icon: featured[2],
                description: featured[4]
            });
        }

        page.appendItem("", "separator", {
            title: 'Menu'
        });
        // 1 - url, 2 - title
        var re = /<li class="item navItem">[\s\S]*?<a class="" href="([\s\S]*?)" data-track-attrs=\'\{"Tab": "([\s\S]*?)"\}\'>/g;
        var match = re.exec(doc);
        while (match) {
            page.appendItem(plugin.getDescriptor().id + ':index:' + escape(match[1] + ':' + encodeURIComponent(match[2])), "directory", {
                title: match[2]
            });
            match = re.exec(doc);
        }

        page.appendItem("", "separator", {
            title: 'Recent'
        });
        var tryToSearch = true, offset = 0;

        // 1 - icon, 2 - title, 3 - url, 4 - description, 5 - show's name, 6 - show's url, 7 - time
        var re = /class="episode[\s\S]*?src="([\s\S]*?)"[\s\S]*?<a rel="([\s\S]*?)" href="([\s\S]*?)">[\s\S]*?<p class="description">([\s\S]*?)<\/p>[\s\S]*?rel="([\s\S]*?)" href="([\s\S]*?)"[\s\S]*?class="time">([\s\S]*?)<\/time>/g;

        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            doc = showtime.httpReq(BASE_URL + '/episodes/page?offset=' + offset);
            page.loading = false;
            var match = re.exec(doc);
            if (!match)
                return tryToSearch = false
            while (match) {
                page.appendItem(plugin.getDescriptor().id + ':play:' + escape(match[3]) + ':' + encodeURIComponent(match[2]), "video", {
                    title: match[2],
                    icon: match[1],
                    description: new showtime.RichText(coloredStr('Show name: ', orange) + match[5] +
                        coloredStr('\nAdded: ', orange) + match[7] +
                        coloredStr('\nDescription: ', orange) + trim(match[4])
                    )
                });
                offset++;
                match = re.exec(doc);
            }
            return true;
        };

        loader();
        page.paginator = loader;
    });

    plugin.addURI(plugin.getDescriptor().id + ":index:(.*)", function(page, url, title) {
        setPageHeader(page, title);
        var doc = showtime.httpReq(BASE_URL + unescape(url)).toString();

    });

    plugin.addSearcher(plugin.getDescriptor().title, logo, function(page, query) {
        var doc = showtime.httpReq(BASE_URL + '/search/?q=' + escape(query)).toString();
        page.entries = 0;
        var tryToSearch = true;
        page.metadata.title += ' (' + trim(doc.match(/<div class="resultsCount">([\s\S]*?)<\/div>/)[1]) + ')';

        // 1 - icon, 2 - title, 3 - url, 4 - description
        var re = /class="search-result-item">[\s\S]*?src="([\s\S]*?)"[\s\S]*?<a rel="([\s\S]*?)" href="([\s\S]*?)">[\s\S]*?<p class="search-result-description">([\s\S]*?)<li/g;

        function loader() {
            if (!tryToSearch) return false;
            var match = re.exec(doc);
            while (match) {
                page.appendItem(plugin.getDescriptor().id + ':index:' + escape(match[3] + ':' + encodeURIComponent(match[2])), "video", {
                    title: match[2],
                    icon: match[1],
                    description: new showtime.RichText(coloredStr('Description: ', orange) + trim(match[4]))
                });
                page.entries++;
                match = re.exec(doc);
            }
            var next = doc.match(/<a class="nextPage" href="([\S\s]*?)">/);
            if (next) {
                 page.loading = true;
                 doc = showtime.httpReq(BASE_URL + next[1]).toString();
                 page.loading = false;
                 return true;
            }
            return page.loading = tryToSearch = false;
        };

        loader();
        page.paginator = loader;
    });
})(this);