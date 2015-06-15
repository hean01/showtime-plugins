/**
 * TED Talks plugin for Movian Media Center
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
    var BASE_URL = 'https://www.ted.com';
    var logo = plugin.path + "logo.png";

    function setPageHeader(page, title) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    }

    function trim(str) {
        return str.replace(/^\s+|\s+$/g,"");
    }

    var blue = "6699CC", orange = "FFA500";

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    var service = plugin.createService(plugin.getDescriptor().title, plugin.getDescriptor().id + ":start", "video", true, logo);

    function appendItem(page, url, title, description) {
        if (url.match(/m3u8/))
            url = 'hls:' + url;

        var link = "videoparams:" + showtime.JSONEncode({
                title: title,
                //canonicalUrl: plugin.getDescriptor().id + ':play:' + url + ':' + title,
                sources: [{
                    url: url
                }],
                no_subtitle_scan: true
            });

        if (url.match(/m3u8/))
            title = coloredStr('HLS ', orange) + title;

        if (url.match(/mp4/))
            title = coloredStr('MP4 ', orange) + title;

        page.appendItem(link, "video", {
            title: new showtime.RichText(title),
            description: description
        });
    }

    plugin.addURI(plugin.getDescriptor().id + ":talk:(.*):(.*)", function(page, link, title) {
        setPageHeader(page, decodeURIComponent(title));
        page.loading = true;
        var doc = showtime.httpReq(BASE_URL + decodeURIComponent(link)).toString();
        page.loading = false;

        var description = trim(doc.match(/<p class='talk-description' lang='[\s\S]*?'>([\s\S]*?)<\/p>/)[1]);
        appendItem(page, doc.match(/"stream":"([\s\S]*?)"/)[1],
            decodeURIComponent(title),
            description);

        appendItem(page, doc.match(/"high":"([\s\S]*?)"/)[1],
            showtime.entityDecode(decodeURIComponent(title)),
            description);

        var json = showtime.JSONDecode(doc.match(/"subtitledDownloads":([\s\S]*?),"audioDownload"/)[1]);
        var first = true;
        for (var i in json) {
             if (first) {
                 page.appendItem("", "separator", {
                     title: 'With subtitles:'
                 });
                 first = false;
             }
             if (json[i].high)
                 appendItem(page, json[i].high, json[i].name, null);
             else
                 appendItem(page, json[i].low, json[i].name, null);
        }
    });

    function scraper(page, params) {
        var tryToSearch = true, first = true, param = '', pageNum = 1;
        page.entries = 0;
        var url = params;
        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var doc = showtime.httpReq(url + param).toString();
            page.loading = false;
            // 1-icon, 2-duration, 3-speaker, 4-link, 5-title, 6-posted, 7-rated
            var re = /<div class='media media--sm-v'>[\s\S]*?src="([\s\S]*?)"[\s\S]*?class="thumb__duration">([\s\S]*?)<\/span>[\s\S]*?speaker'>([\s\S]*?)<[\s\S]*?<a href='([\s\S]*?)'>([\s\S]*?)<\/a>[\s\S]*?<span class='meta__val'>([\s\S]*?)<\/span>[\s\S]*?<span class='meta__val'>([\s\S]*?)<\/span>/g;
            var match = re.exec(doc);
            while (match) {
                page.appendItem(plugin.getDescriptor().id + ':talk:' + encodeURIComponent(match[4]) + ':' + encodeURIComponent(trim(match[5])), "video", {
                    title: showtime.entityDecode(match[3]) + ' - ' + showtime.entityDecode(trim(match[5])),
                    icon: match[1],
                    duration: match[2],
                    description: new showtime.RichText(coloredStr('Speaker: ', orange) + match[3] +
                        coloredStr('\nTitle: ', orange) + trim(match[5]) +
                        coloredStr('\nPosted: ', orange) + trim(match[6]) +
                        coloredStr('\nRated: ', orange) + trim(match[7])
                    )
                });
                page.entries++;
                match = re.exec(doc);
            }
            if (!doc.match(/rel="next"/))
                return tryToSearch = false;
            pageNum++;
            if (url.match(/\?/))
                param = '&page=' + pageNum;
            else
                param = '?page=' + pageNum;
            return true;
        }
        loader();
        page.paginator = loader;
       page.loading = false;
    }

    plugin.addURI(plugin.getDescriptor().id + ":index:(.*):(.*)", function(page, sort, title) {
        setPageHeader(page, plugin.getDescriptor().title + ' - Sorted by: ' + decodeURIComponent(title));
        scraper(page, BASE_URL + '/talks?sort=' + sort);
    });

    plugin.addURI(plugin.getDescriptor().id + ":start", function(page) {
        setPageHeader(page, plugin.getDescriptor().title + ' - Sort by:');
        page.loading = true;
        var doc = showtime.httpReq(BASE_URL + '/talks').toString();
        page.loading = false;
        var sort = doc.match(/<optgroup label="Sort by([\s\S]*?)<\/optgroup>/)[1];
        // 1-uri component, 2-title
        var re = /<option value="([\s\S]*?)">([\s\S]*?)<\/option>/g;
        var match = re.exec(sort);
        while (match) {
            page.appendItem(plugin.getDescriptor().id + ':index:' + match[1] + ':' + encodeURIComponent(match[2]), "directory", {
                title: match[2]
            });
            match = re.exec(sort);
        }
    });

    plugin.addSearcher(plugin.getDescriptor().title, logo, function (page, query) {
        setPageHeader(page, plugin.getDescriptor().title);
        scraper(page, BASE_URL + '/talks?q=' + encodeURIComponent(query));
    });
})(this);