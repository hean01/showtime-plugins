/**
 * EX.UA plugin for Showtime
 *
 *  Copyright (C) 2013 lprot
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

    var PREFIX = 'ex_ua';
    var BASE_URL = 'http://ex.ua';
    var logo = plugin.path + "logo.png";

    function setPageHeader(page, title) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
    }

    var service = plugin.createService("ex.ua", PREFIX + ":start", "video", true, logo);

    var settings = plugin.createSettings("EX.UA", plugin.path + "logo.png", "EX.UA: Server of information exchange");
    settings.createDivider('Settings');
    settings.createMultiOpt("lang", "Language", [
        ['en', 'english', true],
        ['ru', 'русский'],
        ['uk', 'українська'],
        ['es', 'espanol'],
        ['de', 'deutsch'],
        ['fr', 'français'],
        ['pl', 'polski'],
        ['ja', '日本語'],
        ['kk', 'қазақ']
    ], function(l) {
        service.lang = l;
    });

    function startPage(page) {
        page.loading = false;
        var response = showtime.httpGet(BASE_URL, "", {
            'Cookie': 'ulang=' + service.lang
        });
        var re = /<title>([\S\s]*?)<\/title>/;
        setPageHeader(page, re.exec(response)[1]);
        re = /alt='EX'>[\S\s]*?<a href=[\S\s]*?>([^\<]+)[\S\s]*?<a href=[\S\s]*?>([^\<]+)[\S\s]*?<a href=[\S\s]*?>([^\<]+)[\S\s]*?<a href=[\S\s]*?>([^\<]+)[\S\s]*?<a href=[\S\s]*?>([^\<]+)[\S\s]*?<a href=[\S\s]*?>([^\<]+)/;
        var match = re.exec(response);

        page.appendItem(PREFIX + ':index:/view/81708', 'directory', {
            title: match[1],
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/view/81709', 'directory', {
            title: match[2],
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/view/81710', 'directory', {
            title: match[3],
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/view/81711', 'directory', {
            title: match[4],
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/view/81712', 'directory', {
            title: match[5],
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/view/81713', 'directory', {
            title: match[6],
            icon: logo
        });
    };

    // Play megogo links
    plugin.addURI(PREFIX + ":playmego:(.*)", function(page, url) {
        var re = /[\S\s]*?([\d+^\?]+)/gi;
        var match = re.exec(url);
        var sign = showtime.md5digest('video=' + match[1] + '1e5774f77adb843c');
        sign = showtime.httpGet('http://megogo.net/p/info?' + 'video=' + match[1] + '&sign=' + sign + '_samsungtv');
        sign = showtime.JSONDecode(sign);
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(sign.title),
            canonicalUrl: PREFIX + ":playmego:" + url,
            sources: [{
                url: unescape(sign.src)
            }]
        });
        page.loading = false;
    });

    // Index page at URL
    plugin.addURI(PREFIX + ":index:(.*)", function(page, url) {
        function loader() {
            if (!url) return false;
            var response = showtime.httpGet(BASE_URL + url, "", {
                'Cookie': 'ulang=' + service.lang
            });
            var re = /<title>([\S\s]*?)<\/title>/;
            setPageHeader(page, re.exec(response)[1]);

            re = /valign=center><a href='([\S\s]*?)'>([\S\s]*?)<b>([\S\s]*?)<\/b><\/a><.*?>([\S\s]*?)>\&nbsp\;/g;
            // 1 = link, 2 = raw image link or empty field, 3 = title, 4 = additional info
            var match = re.exec(response);
            if (!match) {
                // check if that is megogo page
                // TODO: add appendItem items fill code
                re = /class="button">[\S\s]*?<a href="([^\?]+)/;
                match = re.exec(response);
                if (match) {
                    page.appendItem(PREFIX + ":playmego:" + match[1], "video", {
                        title: new showtime.RichText(page.metadata.title), //new showtime.RichText(match[3] + (match[4] ? ('<font color="6699CC"> (' + (match[4]) + ')</font>') : "")),
                        icon: icon
                    });
                    url = 0;
                    return false;
                }
                // Scraping the page as a folder
                // 1 - link, 2 - title
                re = /i_disk.jpg[\S\s]*?<a href='([^\']+)' title='([\S\s]*?)'/g;
                match = re.exec(response);
                if (match) {
                    while (match) {
                        var icon = logo;
                        page.appendItem(BASE_URL + match[1], "video", {
                            title: new showtime.RichText(match[2]),
                            icon: icon
                        });
                        page.entries++;
                        match = re.exec(response);
                    }
                    url = 0;
                    return false;
                }
                showtime.message("Error: Looks like the page is empty, sorry ;)", true, false);
                return false;
            }

            while (match) {
                var icon = logo;
                if (match[2]) {
                    var re2 = /<img src='([^\']+)/; // we can change ' to ? for full size images
                    icon = re2.exec(match[2])[1];
                }
                var regex = /(<([^>]+)>)/ig;
                match[4] = match[4] + ">";
                match[4] = match[4].replace("class=info>", "> ");
                match[4] = match[4].replace(regex, "");
                match[4] = match[4].replace(/(^\s*)|(\s*$)/gi, "");
                page.appendItem(PREFIX + ":index:" + match[1], "directory", { //match[2] ? "video" : "directory", {
                    title: new showtime.RichText(match[3] + (match[4] ? ('<font color="6699CC"> (' + (match[4]) + ')</font>') : "")),
                    icon: icon
                });
                page.entries++;
                match = re.exec(response);
            }
            var re = /alt='перейти на следующую страницу[\S\s]*?<a href='([^']+)/;
            url = re.exec(response);
            if (!url) {
                return false
            } else {
                url = url[1];
                return true;
            }
        }
        loader();
        page.loading = false;
        page.paginator = loader;
    });

    plugin.addURI(PREFIX + ":start", startPage);

    plugin.addSearcher("ex.ua", logo,

    function(page, query) {
        try {
            var url = BASE_URL + "/search?s=" + query.replace(/\s/g, '\+');
            function loader() {
                if (!url) return false;
                var response = showtime.httpGet(url, "", {
                    'Cookie': 'ulang=' + service.lang
                });
                var re = /<title>([\S\s]*?)<\/title>/;
                setPageHeader(page, re.exec(response)[1]);
                //1-link 2-title
                re = /<tr><td><a href='([^']+)'[\S\s]*?<b>([\S\s]*?)<\/b><\/a>/g;
                var match = re.exec(response);
                while (match) {
                    page.appendItem(PREFIX + ":index:" + match[1], "directory", {
                        title: new showtime.RichText(match[2]),
                        icon: logo
                    });
                    page.entries++;
                    match = re.exec(response);
                };
                re = /alt='перейти на следующую страницу[\S\s]*?<a href='([^']+)/;
                url = re.exec(response);
                if (!url) return false;
                url = BASE_URL + url[1];
                return true;
            };
            loader();
            page.loading = false;
            page.paginator = loader;
        } catch (err) {
            showtime.trace('EX.UA - Search error: ' + err)
        }
    });

})(this);

