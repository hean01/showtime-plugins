/**
 * TED Talks plugin for Showtime Media Center
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

    plugin.addURI(plugin.getDescriptor().id + ":talk:(.*):(.*)", function(page, link, title) {
        setPageHeader(page, decodeURIComponent(title));
        page.loading = true;
        var doc = showtime.httpReq(BASE_URL + decodeURIComponent(link)).toString();
        page.loading = false;
        page.appendItem(doc.match(/"high":"([\s\S]*?)"/)[1], "video", {
            title: decodeURIComponent(title),
            description: trim(doc.match(/<p class='talk-description' lang='[\s\S]*?'>([\s\S]*?)<\/p>/)[1])
        });

        var json = showtime.JSONDecode(doc.match(/"subtitledDownloads":([\s\S]*?),"audioDownload"/)[1]);
        var first = true;
        for (var i in json) {
             if (first) {
                 page.appendItem("", "separator", {
                     title: 'With subtitles:'
                 });
                 first = false;
             }
             page.appendItem(json[i].high, "video", {
                 title: json[i].name
             });
        }
    });

    plugin.addURI(plugin.getDescriptor().id + ":index:(.*):(.*)", function(page, sort, title) {
        setPageHeader(page, plugin.getDescriptor().title + ' - Sorted by: ' + decodeURIComponent(title));
        var tryToSearch = true, first = true, param = '', counter = 1;
        var url = BASE_URL + '/talks?sort=' + sort;
        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var doc = showtime.httpReq(url + param).toString();
            page.loading = false;
            // 1-icon, 2-duration, 3-speaker, 4-link, 5-title, 6-views, 7-date
            var re = /<div class='media media--sm-v'>[\s\S]*?src="([\s\S]*?)"[\s\S]*?class="thumb__duration">([\s\S]*?)<\/span>[\s\S]*?speaker'>([\s\S]*?)<[\s\S]*?<a href='([\s\S]*?)'>([\s\S]*?)<\/a>[\s\S]*?<span class='meta__val'>([\s\S]*?)views[\s\S]*?<span class='meta__val'>([\s\S]*?)<\/span>/g;
            var match = re.exec(doc);
            while (match) {
                page.appendItem(plugin.getDescriptor().id + ':talk:' + encodeURIComponent(match[4]) + ':' + encodeURIComponent(trim(match[5])), "video", {
                    title: match[3] + ' - ' + trim(match[5]),
                    icon: match[1],
                    duration: match[2],
                    description: new showtime.RichText(coloredStr('Speaker: ', orange) + match[3] +
                        coloredStr('\nTitle: ', orange) + trim(match[5]) +
                        coloredStr('\nViews: ', orange) + trim(match[6]) +
                        coloredStr('\nAdded: ', orange) + trim(match[7])
                    )
                });
                match = re.exec(doc);
            }
            if (!doc.match(/rel="next"/))
                return tryToSearch = false;
            counter++;
            param = '&page=' + counter;
            return true;
        }
        loader();
        page.paginator = loader;
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
})(this);