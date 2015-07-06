/**
 * EX.UA plugin for Movian Media Center
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
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

(function(plugin) {
    var PREFIX = 'ex_ua';
    var BASE_URL = 'http://www.ex.ua';
    var logo = plugin.path + "logo.png";
    var doc;
    var service = plugin.createService(plugin.getDescriptor().id, PREFIX + ":start", "video", true, logo);

    var settings = plugin.createSettings(plugin.getDescriptor().id, logo, plugin.getDescriptor().synopsis);
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
            case "mts":
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
            case "wv":
                return "audio";
            default:
                return "file";
        }
    }

    function checkLink(url) {
        return url.substr(0, 4) == 'http' ? url : BASE_URL + url;
    }

    function setPageHeader(page, title) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    }

    // Search IMDB ID by title
    function getIMDBid(title) {
        var imdbid = null;
        var title = showtime.entityDecode(unescape(title)).toString();
        showtime.print('Splitting the title for IMDB ID request: ' + title);
        var splittedTitle = title.split('|');
        if (splittedTitle.length == 1)
            splittedTitle = title.split('/');
        if (splittedTitle.length == 1)
            splittedTitle = title.split('-');
        showtime.print('Splitted title is: ' + splittedTitle);
        if (splittedTitle[1]) { // first we look by original title
            var cleanTitle = splittedTitle[1].trim();
            var match = cleanTitle.match(/[^\(|\[|\.]*/);
            if (match)
                cleanTitle = match;
            showtime.print('Trying to get IMDB ID for: ' + cleanTitle);
            resp = showtime.httpReq('http://www.imdb.com/find?ref_=nv_sr_fn&q=' + encodeURIComponent(cleanTitle)).toString();
            imdbid = resp.match(/<a href="\/title\/(tt\d+)\//);
            if (!imdbid && cleanTitle.indexOf('/') != -1) {
                splittedTitle2 = cleanTitle.split('/');
                for (var i in splittedTitle2) {
                    showtime.print('Trying to get IMDB ID for: ' + splittedTitle2[i].trim());
                    resp = showtime.httpReq('http://www.imdb.com/find?ref_=nv_sr_fn&q=' + encodeURIComponent(splittedTitle2[i].trim())).toString();
                    imdbid = resp.match(/<a href="\/title\/(tt\d+)\//);
                    if (imdbid) break;
                }
            }
        }
        if (!imdbid)
            for (var i in splittedTitle) {
                if (i == 1) continue; // we already checked that
                var cleanTitle = splittedTitle[i].trim();
                var match = cleanTitle.match(/[^\(|\[|\.]*/);
                if (match)
                    cleanTitle = match;
                showtime.print('Trying to get IMDB ID for: ' + cleanTitle);
                resp = showtime.httpReq('http://www.imdb.com/find?ref_=nv_sr_fn&q=' + encodeURIComponent(cleanTitle)).toString();
                imdbid = resp.match(/<a href="\/title\/(tt\d+)\//);
                if (imdbid) break;
            }

        if (imdbid) {
            showtime.print('Got following IMDB ID: ' + imdbid[1]);
            return imdbid[1];
        }
        showtime.print('Cannot get IMDB ID :(');
        return imdbid;
    };

    plugin.addURI(PREFIX + ":play:(.*):(.*):(.*)", function(page, url, title, imdbTitle) {
        page.type = 'video';
        page.loading = true;
        page.metadata.title = unescape(title);

        var season = null, episode = null;
        var name = unescape(title).toUpperCase();
        var series = name.match(/S(\d{1,2})E(\d{3})/); // SxExxx, SxxExxx
        if (!series) series = name.match(/S(\d{1,2})E(\d{2})/); // SxExx, SxxExx
        if (series) {
            season = +series[1];
            episode = +series[2];
            showtime.print('Season: ' + season + ' Episode: ' + episode);
        }

        page.source = "videoparams:" + showtime.JSONEncode({
            title: showtime.entityDecode(unescape(title)),
            canonicalUrl: PREFIX + ':play:' + url + ':' + title + ':' + imdbTitle,
            imdbid: getIMDBid(imdbTitle),
            season: season,
            episode: episode,
            sources: [{
                url: BASE_URL + unescape(url)
            }]
        });
        page.loading = false;
    });

    // Index page at URL
    plugin.addURI(PREFIX + ":index:(.*)", function(page, url) {
        page.loading = true;
        function loader() {
            if (!url) return false;
            getDoc(page, url);
            setPageHeader(page, showtime.entityDecode(doc.match(/<title>([\S\s]*?)<\/title>/)[1]));

            var re = /valign=center><a href='([\S\s]*?)'>([\S\s]*?)<b>([\S\s]*?)<\/b><\/a><.*?>([\S\s]*?)>\&nbsp\;/g;
            // 1 = link, 2 = raw image link or empty field, 3 = title, 4 = additional info
            var match = re.exec(doc);
            if (!match) { // try the page as texts
                re = /class=include([\S\s]*?)<\/tr><\/table>/;
                match = re.exec(doc);
                if (match) doc = match[1];
                // 1 = link, 2 = raw image link or empty field, 3 = title, 4 = additional info
                re = /<tr><td><a href='([\S\s]*?)'>([\S\s]*?)<b>([\S\s]*?)<\/b><\/a><.*?>([\S\s]*?)>\&nbsp\;/g;
                match = re.exec(doc);
            }

            if (!match) {
                // check if that is megogo page
                match = doc.match(/class="button">[\S\s]*?<a href="([^\?]+)/);
                if (match) {
                    page.appendItem('megogo:indexByID:' + match[1].match(/\d+/)[0] + ':' + escape(page.metadata.title), "video", {
                        title: new showtime.RichText(page.metadata.title)
                    });
                    url = 0;
                    return false;
                }
                // Scraping the page as a folder 
                // 1 - img link, 2 - description
                re = /valign=top>[\S\s]*?<img src='([^\']+)[\S\s]*?<\/small>([\S\s]*?)<\/td>/;
                match = re.exec(doc);
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
                match = re.exec(doc);
                var artist = 0;
                if (match) {
                    artist = 1;
                    re = /playlist: \[ "([^"]+)/;
                    var match2 = re.exec(doc);
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
                    match2 = re.exec(doc);
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
                match = re.exec(doc);
                if (match) {
                    while (match) {
                        var type = getType(match[2].split('.').pop());
                        if (type == "video") {
                            page.appendItem(PREFIX + ':play:' + escape(match[1]) + ':' + escape(match[2]) + ':' + escape(page.metadata.title), type, {
                                title: showtime.entityDecode(match[2]),
                                icon: logo
                            });
                        } else
                            page.appendItem(BASE_URL + match[1], type, {
                                title: showtime.entityDecode(match[2]),
                                icon: logo
                            });
                        match = re.exec(doc);
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
                var match = re.exec(doc);
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
                    match = re.exec(doc);
                };
                url = doc.match(/alt='перейти на следующую страницу[\S\s]*?<a href='([^']+)/);
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
                match = re.exec(doc);
            }
            var re = /alt='перейти на следующую страницу[\S\s]*?<a href='([^']+)/;
            url = re.exec(doc);
            if (!url) return false;
            url = url[1];
            return true;
        }
        loader();
        page.loading = false;
        page.paginator = loader;
    });

    plugin.addURI(PREFIX + ":start", function(page) {
        getDoc(page, BASE_URL);
        setPageHeader(page, doc.match(/<title>([\S\s]*?)<\/title>/)[1]);
        var match = doc.match(/alt='EX'>[\S\s]*?<a href=[\S\s]*?>([^\<]+)[\S\s]*?<a href=[\S\s]*?>([^\<]+)[\S\s]*?<a href=[\S\s]*?>([^\<]+)[\S\s]*?<a href=[\S\s]*?>([^\<]+)[\S\s]*?<a href=[\S\s]*?>([^\<]+)[\S\s]*?<a href=[\S\s]*?>([^\<]+)[\S\s]*?<a href=[\S\s]*?>([^\<]+)/);
        page.appendItem(PREFIX + ':index:/view/81708', 'directory', {
            title: match[2],
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/view/81709', 'directory', {
            title: match[3],
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/view/81710', 'directory', {
            title: match[4],
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/view/81711', 'directory', {
            title: match[5],
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/view/81712', 'directory', {
            title: match[6],
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/view/81713', 'directory', {
            title: match[7],
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
    });

    function getDoc(page, url) {
        if (url.substr(0, 4) != 'http') url = BASE_URL + url;
        page.loading = true;
        doc = showtime.httpReq(url, {
            headers: {
                Cookie: 'ulang=' + service.lang
            }
        }).toString();
    }

    plugin.addSearcher(plugin.getDescriptor().id, logo, function(page, query) {
        page.entries = 0;
        var tryToSearch = true;
        var url = '/search?s=' + query.replace(/\s/g, '\+');
        //1-link 2-title 3-additional info
        var re = /<tr><td><a href='([^']+)'><img src='[\S\s]*?<b>([\S\s]*?)<\/b><\/a>([\S\s]*?)<\/td>/g;
        function loader() {
            if (!tryToSearch) return false;
            getDoc(0, url);
            var match = re.exec(doc);
            while (match) {
                var title = "";
                if (match[3].match(/class=info>([^<]+)/))
                    title += match[3].match(/class=info>([^<]+)/)[1];
                if (match[3].match(/<small>([\S\s]*?)<\/small>[\S\s]*?<small>([\S\s]*?)<\/small>/)) {
                    if (title)
                        title += ", ";
                    title += match[3].match(/<small>([\S\s]*?)<\/small>[\S\s]*?<small>([\S\s]*?)<\/small>/)[2];
                }

                page.appendItem(PREFIX + ":index:" + match[1], "directory", {
                    title: new showtime.RichText(match[2] + (title ? ('<font color="6699CC"> (' + (title) + ')</font>') : "")),
                    icon: logo
                });
                page.entries++;
                match = re.exec(doc);
            };
            url = doc.match(/alt='перейти на следующую страницу[\S\s]*?<a href='([^']+)/);
            if (!url) return tryToSearch = false;
            url = url[1];
            return true;
        };
        loader();
        page.paginator = loader;
    });
})(this);