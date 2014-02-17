/**
 * btvm.biz plugin for Showtime
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
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

(function(plugin) {
    var PREFIX = 'btvm';
    var BASE_URL = 'http://btvm.biz';
    var logo = plugin.path + "logo.png";

    function fixNumEntities(s) {
        return s.replace(/&#([^\s]*);/g, function(match, match2) { return String.fromCharCode(Number(match2)); });
    }

    function setPageHeader(page, title) {
        page.loading = false;
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
    }

    var service = plugin.createService("btvm.biz", PREFIX + ":start", "video", true, logo);

    function startPage(page) {
        setPageHeader(page, 'btvm.biz - Bei uns erleben Sie Online Movie Deutsch und Russisch, Online TV Deutsch, Russisch und Englisch.');
        page.appendItem(PREFIX + ':index:/RUSS/?site=page/:1', 'directory', {
            title: 'Movie (Russian)',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/DEU/?site=:2', 'directory', {
            title: 'Movie (German)',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/XXX/18.php?site=page/:1', 'directory', {
            title: '+18',
            icon: logo
        });
    };

    plugin.addURI(PREFIX + ":start", startPage);

    plugin.addURI(PREFIX + ":index:(.*):(.*)", function(page, url, startFrom) {
        var URL = BASE_URL + url;
        var p = startFrom;

        function loader() {
            var response = showtime.httpReq(URL + p).toString();
            setPageHeader(page, response.match(/<title>([\S\s]*?)<\/title>/)[1]);
            var re = /<center><font size="6">([\s\S]*?)<\/font>[\s\S]*?<img src="([\s\S]*?)"[\s\S]*?<!--dle_image_end-->([\s\S]*?)<div style="[\s\S]*?<a href="([\s\S]*?)">/g;
            var match = re.exec(response);
            while (match) {
                page.appendItem(PREFIX + ":indexItem:" + match[4], 'video', {
                    title: fixNumEntities(showtime.entityDecode(match[1])),
                    icon: match[2],
                    description: new showtime.RichText(match[3].replace(/<br>/,'').replace(/PLAY/,''))
                });
                match = re.exec(response);
            }
            p++;
            match = response.match(/<div style="text-align: center;"><a href="([\S\s]*?)">/);
            if (match) return true;
            return false;
        }
        loader();
        page.paginator = loader;
    });

    plugin.addURI(PREFIX + ":indexItem:(.*)", function(page, url) {
        var response = showtime.httpReq(url).toString();
        setPageHeader(page, response.match(/<title>([\S\s]*?)<\/title>/)[1]);
        page.loading = true;
        // Try to parse as RUSS
        var re = /<a id="boxplus002" href="([\s\S]*?)"/g;
        var match = re.exec(response);
        var added = 0;
        while (match) {
            if (match[1].indexOf("download") != -1) {
                var title = match[1].replace(/http:\/\/btvm.biz\/[\S\s]*?\/download.php\?mov=\/[\S\s]*?\//, '');
                title = title.replace(/http:\/\/btvm.biz\/[\S\s]*?\/download.php\?mov=lib\/[\S\s]*?\//, '');
                title = title.replace(/.html/, '');
                title = title.replace(/<\/b>/, '');
                title = title.replace(/.rar/, '');
                page.appendItem(match[1].replace(/<\/b>/,''), 'video', {
                    title: title
                });
                added++;
            }
            match = re.exec(response);
        };

        if (!added) { // Try to parse as DEU
            var re = /bold;"><a href="([\S\s]*?)" target=[\S\s]*?pointer;">([\S\s]*?)</g;
            var match = re.exec(response);
            while (match) {
                page.appendItem(match[1], 'video', {
                    title: match[2].replace(/Download /, '')
                });
                added++;
                match = re.exec(response);
            }
        };
        page.loading = false;
    });
})(this);