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
        page.appendItem(PREFIX + ':index:/top', 'directory', {
            title: 'Самое популярное (Most popular)',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/top/1', 'directory', {
            title: 'Самое обсуждаемое (Most discussed)',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/top/2', 'directory', {
            title: 'Самое рекомендуемое (Most recommended)',
            icon: logo
        });
    };

    // Play megogo links
    plugin.addURI(PREFIX + ":playmego:(.*)", function(page, url) {
        var re = /[\S\s]*?([\d+^\?]+)/i;
        var match = re.exec(url);
        var sign = showtime.md5digest('video=' + match[1] + '1e5774f77adb843c');
        sign = showtime.JSONDecode(showtime.httpGet('http://megogo.net/p/info?video=' + match[1] + '&sign=' + sign + '_samsungtv'));
        if (!sign.src) {
            page.loading = false;
            showtime.message("Error: This video is not available in your region :(", true, false);
            return;
        }
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(sign.title),
            canonicalUrl: PREFIX + ":playmego:" + url,
            sources: [{
                url: sign.src
            }]
        });
        page.loading = false;
    });

    function getType(type) {
        type = type.toLowerCase();
        switch (type) {
            case "mkv":
            case "avi":
            case "flv":
            case "mp4":
            case "mov":
            case "ts":
            case "mpg":
            case "mpeg":
            case "vob":
            case "iso":
            case "m4v":
            case "wmv":
            case "m2ts":
                return "video";
            case "jpg":
            case "jpeg":
            case "png":
            case "bmp":
            case "gif":
                return "image";
            case "mp3":
            case "flac":
            case "wav":
            case "ogg":
            case "aac":
            case "m4a":
            case "ape":
            case "dts":
            case "ac3":
                return "audio";
            default:
                return "file";
        }
    }

    // Index page at URL
    plugin.addURI(PREFIX + ":index:(.*)", function(page, url) {
        function loader() {
            if (!url) return false;
            var response = showtime.httpGet(BASE_URL + url, "", {
                'Cookie': 'ulang=' + service.lang
            });
            var re = /<title>([\S\s]*?)<\/title>/;
            setPageHeader(page, showtime.entityDecode(re.exec(response)[1]));

            re = /valign=center><a href='([\S\s]*?)'>([\S\s]*?)<b>([\S\s]*?)<\/b><\/a><.*?>([\S\s]*?)>\&nbsp\;/g;
            // 1 = link, 2 = raw image link or empty field, 3 = title, 4 = additional info
            var match = re.exec(response);

            if (!match) { // try the page as texts
                re = /class=include([\S\s]*?)<\/tr><\/table>/;
                match = re.exec(response);
                if (match) response = match[1];
                // 1 = link, 2 = raw image link or empty field, 3 = title, 4 = additional info
                re = /<tr><td><a href='([\S\s]*?)'>([\S\s]*?)<b>([\S\s]*?)<\/b><\/a><.*?>([\S\s]*?)>\&nbsp\;/g;
                match = re.exec(response);
            }

            if (!match) {
                // check if that is megogo page
                re = /class="button">[\S\s]*?<a href="([^\?]+)/;
                match = re.exec(response);
                if (match) {
                    var re = /[\S\s]*?([\d+^\?]+)/i;
                    var videoID = re.exec(match[1])[1];
                    var sign = showtime.md5digest('video=' + videoID + 'megogosign123');
                    sign = showtime.JSONDecode(showtime.httpGet('http://megogo.net/p/video?video=' + videoID + '&sign=' + sign));
                    page.appendItem(PREFIX + ":playmego:" + match[1], "video", {
                        title: new showtime.RichText(page.metadata.title),
                        icon: 'http://megogo.net' + unescape(sign.video[0].image.big),
                        year: +parseInt(sign.video[0].year),
                        genre: unescape(sign.video[0].genre_list[0].title),
                        rating: sign.video[0].rating_imdb * 10,
                        duration: +parseInt(sign.video[0].duration),
                        description: showtime.entityDecode(unescape(sign.video[0].description))
                    });
                    url = 0;
                    return false;
                }
                // Scraping the page as a folder 
                // 1 - img link, 2 - description
                re = /valign=top>[\S\s]*?<img src='([^\']+)[\S\s]*?<\/small>([\S\s]*?)<\/td>/;
                match = re.exec(response);
                if (match) {
                    if (match[2].indexOf("\&nbsp\;") > 0) match[2] = match[2].substring(0, match[2].indexOf("\&nbsp\;"));
                    page.appendPassiveItem("video", "", {
                        title: page.metadata.title,
                        icon: match[1],
                        description: new showtime.RichText(match[2].replace(/(\r\n|\n|\r)/gm, ""))
                    });
                };

                // Try to handle a page as a artist's page
                re = /<div class="poster">[\S\s]*?<img src="([^"]+)" \/>[\S\s]*?<div id="content_page">([\S\s]*?)<\/div>/g;
                match = re.exec(response);
                var artist = 0;
                if (match) {
                    artist = 1;
                    re = /playlist: \[ "([^"]+)/;
                    var match2 = re.exec(response);
                    if (match2) {
                        page.appendItem(match2[1], "video", {
                            title: page.metadata.title,
                            icon: match[1],
                            description: new showtime.RichText(match[2].replace(/(\r\n|\n|\r)/gm, ""))
                        });
                    } else {
                        page.appendPassiveItem("video", "", {
                            title: page.metadata.title,
                            icon: match[1],
                            description: new showtime.RichText(match[2].replace(/(\r\n|\n|\r)/gm, ""))
                        });

                    }
                    re = /<a class="active" href="[^"]+"><b>[\S\s]*?<\/b><\/a>([\S\s]*?)<!-/;
                    match2 = re.exec(response);
                    if (match2[1]) {
                        re = /<a href="([^"]+)"><b>([^<]+)<\/b>/g;
                        var match3 = re.exec(match2[1]);
                        while (match3) {
                            page.appendItem(PREFIX + ':index:' + match3[1], "directory", {
                                title: match3[2],
                                icon: logo
                            });
                            match3 = re.exec(match2[1]);
                        }
                    }
                }
                // 1 - link, 2 - title		
                re = /i_disk.jpg[\S\s]*?<a href='([^\']+)' title='([\S\s]*?)'/g;
                match = re.exec(response);
                if (match) {
                    while (match) {
                        var v = "videoparams:" + showtime.JSONEncode({
                            sources: [{
                                url: BASE_URL + match[1]
                            }],
                            title: showtime.entityDecode(match[2]),
			    canonicalUrl: match[1]
                        });
			showtime.print("I'm here!");
                        if (getType(match[2].split('.').pop()) != "video") v = BASE_URL + match[1];
                        page.appendItem(v, getType(match[2].split('.').pop()), {
                            title: showtime.entityDecode(match[2]),
                            icon: logo
                        });
                        match = re.exec(response);
                    }
                    url = 0;
                    return false;
                }
                if (artist) {
                    url = 0;
                    return false;
                }
		// Tops
                //1-link 2-title 3 - additional info
                re = /<tr><td><b style='[\S\s]*?<p><a href='([^']+)'><img src='[\S\s]*?<b>([\S\s]*?)<\/b><\/a>([\S\s]*?)<\/td>/g;
                var match = re.exec(response);
		if (match) {
                while (match) {
                    var title = "";
                    var re2 = /class=info>([^<]+)/;
                    if (re2.exec(match[3])) title += re2.exec(match[3])[1];
                    re2 = /<small>([\S\s]*?)<\/small>[\S\s]*?<small>([\S\s]*?)<\/small>/;
                    if (re2.exec(match[3])) {
                        if (title) title += ", ";
                        title += re2.exec(match[3])[2];
                    }

                    page.appendItem(PREFIX + ":index:" + match[1], "directory", {
                        title: new showtime.RichText(match[2] + (title ? ('<font color="6699CC"> (' + (title) + ')</font>') : "")),
                        icon: logo
                    });
                    page.entries++;
                    match = re.exec(response);
                };
                re = /alt='перейти на следующую страницу[\S\s]*?<a href='([^']+)/;
                url = re.exec(response);
                if (!url) return false;
                url = url[1];
                return true;
		};
		
                page.error('Похоже мы попали на пустую страницу / Looks like the page is empty, sorry :(');
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
                if (match[4].indexOf("&nbsp;") == 0) match[4] = "";
                page.appendItem(PREFIX + ":index:" + match[1], "directory", { //match[2] ? "video" : "directory", {
                    title: new showtime.RichText(match[3] + (match[4] ? ('<font color="6699CC"> (' + (match[4]) + ')</font>') : "")),
                    icon: icon
                });
                page.entries++;
                match = re.exec(response);
            }
            var re = /alt='перейти на следующую страницу[\S\s]*?<a href='([^']+)/;
            url = re.exec(response);
            if (!url) return false;
            url = url[1];
            return true;
        }
        loader();
        page.loading = false;
        page.paginator = loader;
    });

    plugin.addURI(PREFIX + ":start", startPage);

    plugin.addSearcher("ex.ua", logo,

    function(page, query) {
        try {
		    page.entries = 0;
            var tryToSearch = true;
            var url = BASE_URL + "/search?s=" + query.replace(/\s/g, '\+');
            //1-link 2-title 3-additional info
            var re = /<tr><td><a href='([^']+)'><img src='[\S\s]*?<b>([\S\s]*?)<\/b><\/a>([\S\s]*?)<\/td>/g;
            var re2 = /class=info>([^<]+)/;
            var re3 = /<small>([\S\s]*?)<\/small>[\S\s]*?<small>([\S\s]*?)<\/small>/;
            var re4 = /alt='перейти на следующую страницу[\S\s]*?<a href='([^']+)/;
            function loader() {
                if (!tryToSearch) return false;
                var response = showtime.httpGet(url, "", {
                    'Cookie': 'ulang=' + service.lang
                });
                var match = re.exec(response);
                while (match) {
                    var title = "";
                    if (re2.exec(match[3])) title += re2.exec(match[3])[1];
                    if (re3.exec(match[3])) {
                        if (title) title += ", ";
                        title += re3.exec(match[3])[2];
                    }

                    page.appendItem(PREFIX + ":index:" + match[1], "directory", {
                        title: new showtime.RichText(match[2] + (title ? ('<font color="6699CC"> (' + (title) + ')</font>') : "")),
                        icon: logo
                    });
                    page.entries++;
                    match = re.exec(response);
                };
                url = re4.exec(response);
                if (!url) return tryToSearch = false;
                url = BASE_URL + url[1];
                return true;
            };
            loader();
            page.paginator = loader;
        } catch (err) {
            showtime.trace('EX.UA - Search error: ' + err)
        }
    });
})(this);
