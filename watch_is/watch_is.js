/**
 * watch.is plugin for Showtime
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
    var PREFIX = 'watch_is';
    var BASE_URL = 'http://watch.is';

    var logo = plugin.path + "logo.png";

    function trim(s) {
        return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ");
    }

    function blueStr(str) {
        return '<font color="6699CC">' + str + '</font>';
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

    var service = plugin.createService("watch.is", PREFIX + ":start", "video", true, logo);
    var Genre = "0",
        Year = "0",
        Sorting = "added",
        Order = "desc";

    function startPage(page) {
        var v, tryToSearch = true;

        function topPart() {
            page.appendItem(PREFIX + ':best', 'directory', {
                title: "Лучшие"
            });
            v = showtime.httpGet(BASE_URL + "/?genre=" + Genre + "&year=" + Year + "&sorting=" + Sorting + "&order=" + Order).toString();

            // let's show genres
            var genres = v.match(/<ul>([\S\s]*?)<\/ul>/);
            var re = /<li><a href="([\S\s]*?)">([\S\s]*?)<\/a><\/li>/g;
            var match = re.exec(genres[1]);
            while (match) {
                page.appendItem(PREFIX + ':genres:' + escape(match[1]) + ":" + escape(match[2]), 'directory', {
                    title: new showtime.RichText(match[2])
                });
                match = re.exec(genres[1]);
            }
        };

        function loader() {
            if (!tryToSearch) return false;
            // 1 - link, 2 - image, 3 - HD, 4 - votes, 5 - views, 6 - comments, 7 - title_rus, 8 - title_orig
            var re = /<div class="poster">[\S\s]*?<a href="([^"]+)"><img src="([\S\s]*?)"([\S\s]*?)<span class="text">([\S\s]*?)<\/span>[\S\s]*?<span class="text">([\S\s]*?)<\/span>[\S\s]*?<span class="text">([\S\s]*?)<\/span>[\S\s]*?<div class="name"><a href="[^"]+" class="name"><strong>([\S\s]*?)<\/strong> <span>([\S\s]*?)<\/span>/g;
            var match = re.exec(v);
            while (match) {
                var hd = match[3].match(/<div class="hd">/);
                page.appendItem(PREFIX + ':video:' + escape(match[1]) + ":" + escape(trim(match[7]) + (match[8] ? " | " + trim(match[8]) : "")), 'video', {
                    title: new showtime.RichText(trim(match[7]) + (match[8] ? " | " + trim(match[8]) : "") + (hd ? blueStr(" (HD)") : "")),
                    icon: BASE_URL + match[2],
                    description: new showtime.RichText("Голосов: " + blueStr(match[4]) + "\nПросмотров: " + blueStr(match[5]) + "\nКомментариев: " + blueStr(match[6]))
                });
                match = re.exec(v);
            };
            re = /class="page next" href="([^"]+)">/;
            match = re.exec(v);
            if (!match) return tryToSearch = false;
            v = showtime.httpGet(BASE_URL + match[1]);
            return true;
        };

        setPageHeader(page, 'watch.is - Онлайн фильмы');
        var showAuthCredentials = false;
        while (1) {
            var credentials = plugin.getAuthCredentials("Watch.is - Онлайн фильмы", "Login required", showAuthCredentials);
            if (credentials.rejected) return; //rejected by user
            if (credentials) {
                // var v = showtime.httpPost(BASE_URL + '/login', {
                //  'username': credentials.username,
                //  'password': credentials.password,
                //  'login': '+'
                // }, "", "", {
                //  'noFollow': 'true'
                // });
                // var re = /class="page-login"/;
                var v = showtime.httpGet(BASE_URL + '/api/', {
                    'username': credentials.username,
                    'password': credentials.password
                }, "", {
                    'noFollow': 'true'
                });
                showAuthCredentials = v.toString().match(/<error>/);
                if (!showAuthCredentials) break;
            };
            showAuthCredentials = true;
        };

        topPart();

        // add genres to the page.options
        var genre = [],
            obj = [];
        var re = /<select name="genre">([\S\s]*?)<\/select>/;
        var genres = re.exec(v);
        re = /<option label="([\S\s]*?)" value="([\S\s]*?)"[\S\s]*?<\/option>/g;
        var match = re.exec(genres[1]);
        var defOpt = true;
        while (match) {
            obj[0] = match[2];
            obj[1] = match[1];
            obj[2] = defOpt;
            genre.push(obj);
            obj = [];
            defOpt = false;
            match = re.exec(genres[1]);
        };

        // add years to the page.options
        var year = [];
        re = /<select name="year">([\S\s]*?)<\/select>/;
        var genres = re.exec(v);
        re = /<option label="([\S\s]*?)" value="([\S\s]*?)"[\S\s]*?<\/option>/g;
        var match = re.exec(genres[1]);
        var defOpt = true;
        while (match) {
            obj[0] = match[2];
            obj[1] = match[1];
            obj[2] = defOpt;
            year.push(obj);
            obj = [];
            defOpt = false;
            match = re.exec(genres[1]);
        };

        // add sorting to the page.options
        var sorting = [];
        re = /<select name="sorting">([\S\s]*?)<\/select>/;
        var genres = re.exec(v);
        re = /<option label="([\S\s]*?)" value="([\S\s]*?)"[\S\s]*?<\/option>/g;
        var match = re.exec(genres[1]);
        var defOpt = true;
        while (match) {
            obj[0] = match[2];
            obj[1] = match[1];
            obj[2] = defOpt;
            sorting.push(obj);
            obj = [];
            defOpt = false;
            match = re.exec(genres[1]);
        };

        // add sorting to the page.options
        var order = [];
        re = /<select name="order">([\S\s]*?)<\/select>/;
        var genres = re.exec(v);
        re = /<option label="([\S\s]*?)" value="([\S\s]*?)"[\S\s]*?<\/option>/g;
        var match = re.exec(genres[1]);
        var defOpt = true;
        while (match) {
            obj[0] = match[2];
            obj[1] = match[1];
            obj[2] = defOpt;
            order.push(obj);
            obj = [];
            defOpt = false;
            match = re.exec(genres[1]);
        };

        page.options.createMultiOpt("genre", "Жанр", genre, function(res) {
            Genre = res;
        });
        page.options.createMultiOpt("year", "Год", year, function(res) {
            Year = res;
        });
        page.options.createMultiOpt("sorting", "Сортировка", sorting, function(res) {
            Sorting = res;
        });
        page.options.createMultiOpt("order", "Порядок", order, function(res) {
            Order = res;
        });
        page.options.createAction('apply', 'Выбрать', function() {
            page.paginator = function dummy() {
                return true
            };
            page.flush();
            topPart();
            tryToSearch = true;
            loader();
            page.paginator = loader;
        });
        loader();
        page.loading = false;
        page.paginator = loader;
    };

    plugin.addURI(PREFIX + ":genres:(.*):(.*)", function(page, url, title) {
        var v = showtime.httpGet(BASE_URL + unescape(url));
        setPageHeader(page, unescape(title));
        var done = false;

        function loader() {
            if (done) return false;
            // 1 - link, 2 - image, 3 - HD, 4 - votes, 5 - views, 6 - comments, 7 - title_rus, 8 - title_orig
            var re = /<div class="poster">[\S\s]*?<a href="([^"]+)"><img src="([\S\s]*?)"([\S\s]*?)<span class="text">([\S\s]*?)<\/span>[\S\s]*?<span class="text">([\S\s]*?)<\/span>[\S\s]*?<span class="text">([\S\s]*?)<\/span>[\S\s]*?<div class="name"><a href="[^"]+" class="name"><strong>([\S\s]*?)<\/strong> <span>([\S\s]*?)<\/span>/g;
            var match = re.exec(v);
            while (match) {
                var hd = match[3].match(/<div class="hd">/);
                page.appendItem(PREFIX + ':video:' + escape(match[1]) + ":" + escape(trim(match[7]) + (match[8] ? " | " + trim(match[8]) : "")), 'video', {
                    title: new showtime.RichText(trim(match[7]) + (match[8] ? " | " + trim(match[8]) : "") + (hd ? blueStr(" (HD)") : "")),
                    icon: BASE_URL + match[2],
                    description: new showtime.RichText("Голосов: " + blueStr(match[4]) + "\nПросмотров: " + blueStr(match[5]) + "\nКомментариев: " + blueStr(match[6]))
                });
                match = re.exec(v);
            };
            re = /class="page next" href="([^"]+)">/;
            match = re.exec(v);
            if (!match) {
                done = true;
                return false;
            }
            v = showtime.httpGet(BASE_URL + match[1]);
            return true;
        };
        loader();
        page.loading = false;
        page.paginator = loader;
    });

    plugin.addURI(PREFIX + ":best", function(page) {
        var v = showtime.httpGet(BASE_URL + "/top");
        var re = /<title>(.*?)<\/title>/;
        setPageHeader(page, re.exec(v)[1]);
        page.loading = false;
        // 1 - link, 2 - image, 3 - HD, 4 - votes, 5 - views, 6 - comments, 7 - title_rus, 8 - title_orig
        var re = /<div class="poster">[\S\s]*?<a href="([^"]+)"><img src="([\S\s]*?)"([\S\s]*?)<span class="text">([\S\s]*?)<\/span>[\S\s]*?<span class="text">([\S\s]*?)<\/span>[\S\s]*?<span class="text">([\S\s]*?)<\/span>[\S\s]*?<div class="name"><a href="[^"]+" class="name"><strong>([\S\s]*?)<\/strong> <span>([\S\s]*?)<\/span>/g;
        var match = re.exec(v);
        while (match) {
            var hd = match[3].match(/<div class="hd">/);
            page.appendItem(PREFIX + ':video:' + escape(match[1]) + ":" + escape(trim(match[7]) + (match[8] ? " | " + trim(match[8]) : "")), 'video', {
                title: new showtime.RichText(trim(match[7]) + (match[8] ? " | " + trim(match[8]) : "") + (hd ? blueStr(" (HD)") : "")),
                icon: BASE_URL + match[2],
                description: new showtime.RichText("Голосов: " + blueStr(match[4]) + "\nПросмотров: " + blueStr(match[5]) + "\nКомментариев: " + blueStr(match[6]))
            });
            match = re.exec(v);
        };
    });

    // Search IMDB ID by title
    function getIMDBid(title) {
        var resp = showtime.httpGet('http://www.google.com/search?q=imdb+' + encodeURIComponent(showtime.entityDecode(unescape(title)).replace(" (HD)", "")).toString()).toString();
        var re = /http:\/\/www.imdb.com\/title\/(tt\d+).*?<\/a>/;
        var imdbid = re.exec(resp);
        if (imdbid) imdbid = imdbid[1];
        else {
            re = /http:\/\/<b>imdb<\/b>.com\/title\/(tt\d+).*?\//;
            imdbid = re.exec(resp);
            if (imdbid) imdbid = imdbid[1];
        }
	return imdbid;
    };

    // Play links
    plugin.addURI(PREFIX + ":video:(.*):(.*)", function(page, url, title) {
        var re = /[\S\s]*?([\d+]+)/i;
        var match = re.exec(unescape(url));
        var v = showtime.httpGet(BASE_URL + '/api/watch/' + match[1]);
        re = /<hdvideo>([\s\S]*?)<\/hdvideo>/;
        match = re.exec(v);
        if (!match) {
            re = /<video>([\s\S]*?)<\/video>/;
            match = re.exec(v);
        }

	if (showtime.probe(match[1]).result) { // handling API database errors
		v = showtime.httpGet(BASE_URL+unescape(url)).toString();
		match = v.match(/file:"([^"]+)/);
	}

        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: showtime.entityDecode(unescape(title)),
            imdbid: getIMDBid(title),
	    no_fs_scan: true,
            canonicalUrl: PREFIX + ":video:" + url + ":" + title,
            sources: [{
                url: match[1]
            }]
        });
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":start", startPage);

    plugin.addSearcher("Watch.is", logo,

    function(page, query) {
        var credentials = plugin.getAuthCredentials("Watch.is - Онлайн фильмы", "Login required", false);
        if (credentials) {
            var v = showtime.httpPost(BASE_URL + '/login', {
                'username': credentials.username,
                'password': credentials.password,
                'login': '+'
            }, "", "", {
                'noFollow': 'true'
            }).toString();
            if (v.match(/class="page-login"/)) return;
        };
        var v = showtime.httpGet(BASE_URL + '/?search=' + query.replace(/\s/g, '\+'));
        var tryToSearch = true;

        function loader() {
            if (!tryToSearch) return false;
            // 1 - link, 2 - image, 3 - HD, 4 - votes, 5 - views, 6 - comments, 7 - title_rus, 8 - title_orig
            var re = /<div class="poster">[\S\s]*?<a href="([^"]+)"><img src="([\S\s]*?)"([\S\s]*?)<span class="text">([\S\s]*?)<\/span>[\S\s]*?<span class="text">([\S\s]*?)<\/span>[\S\s]*?<span class="text">([\S\s]*?)<\/span>[\S\s]*?<div class="name"><a href="[^"]+" class="name"><strong>([\S\s]*?)<\/strong> <span>([\S\s]*?)<\/span>/g;
            var match = re.exec(v);
            while (match) {
                var hd = match[3].match(/<div class="hd">/);
                page.appendItem(PREFIX + ':video:' + escape(match[1]) + ":" + escape(trim(match[7]) + (match[8] ? " | " + trim(match[8]) : "")), 'video', {
                    title: new showtime.RichText(trim(match[7]) + (match[8] ? " | " + trim(match[8]) : "") + (hd ? blueStr(" (HD)") : "")),
                    icon: BASE_URL + match[2],
                    description: new showtime.RichText("Голосов: " + blueStr(match[4]) + "\nПросмотров: " + blueStr(match[5]) + "\nКомментариев: " + blueStr(match[6]))
                });
                page.entries++;
                match = re.exec(v);
            };
            re = /class="page next" href="([^"]+)">/;
            match = re.exec(v);
            if (!match) return tryToSearch = false;
            v = showtime.httpGet(BASE_URL + match[1]);
            return true;
        };
        loader();
        page.loading = false;
        page.paginator = loader;
    });
})(this);
