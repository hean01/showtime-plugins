/**
 * watch.is plugin for Showtime
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
    var descriptor = getDescriptor();
    var PREFIX = 'watch_is';
    var BASE_URL = 'http://watch.is';
    var logo = plugin.path + "logo.png";
    var logged = false;

    function trim(s) {
        return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ");
    }

    var blue = '6699CC', orange = 'FFA500', red = 'EE0000', green = '008B45';

    function colorStr(str, color) {
        return '<font color="' + color + '"> (' + str + ')</font>';
    }

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    function login(page, showDialog) {
        if (logged && page) return true; // page here stands as a forced logon flag (from settings)
        var ask = showDialog;
        if (showDialog && page) ask = false; // first time we just try to read credentials silently

        while (1) {
            var credentials = plugin.getAuthCredentials(descriptor.synopsis, "Login required", ask);
            if (credentials.rejected) return false;
            if ((!credentials || !credentials.username || !credentials.password) && showDialog) {
                ask = true;
                continue;
            }
            if ((!credentials || !credentials.username || !credentials.password) && !showDialog) return false; // searcher case

            logged = false;
            page.loading = true;
            var v = showtime.httpReq(BASE_URL + '/api/', {
                args: {
                    'username': credentials.username,
                    'password': credentials.password
                },
                noFollow: true
            }).toString();
            page.loading = false;
            if (v.match(/<error>/) && !showDialog) return false; // searcher case
            if (!v.match(/<error>/)) {
                if (!page) showtime.notify('Logged in successfully', 3);
                break;
            }
        };
        return logged = true;
    }

    function setPageHeader(page, title) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
        if (!login(page, true)) {
            page.error('Error. Cannot login. Please check username/password.');
            return false;
        }
        return true;
    }

    var service = plugin.createService(descriptor.id, PREFIX + ":start", "video", true, logo);
    var settings = plugin.createSettings(descriptor.id, logo, descriptor.synopsis);
    settings.createAction(descriptor.id + '_login', 'Change account', function() {
        login(0, true);
    });

    function scraper(page, url, args) {
        page.loading = true;
        var v = showtime.httpReq(url, args);
        page.loading = false;

        page.entries = 0; var tryToSearch = true;

        function loader() {
            if (!tryToSearch) return false;
            // 1 - link, 2 - image, 3 - HD, 4 - votes, 5 - views, 6 - comments, 7 - title_rus, 8 - title_orig
            var re = /<div class="poster">[\S\s]*?<a href="([^"]+)"><img src="([\S\s]*?)"([\S\s]*?)<span class="text">([\S\s]*?)<\/span>[\S\s]*?<span class="text">([\S\s]*?)<\/span>[\S\s]*?<span class="text">([\S\s]*?)<\/span>[\S\s]*?<div class="name"><a href="[^"]+" class="name"><strong>([\S\s]*?)<\/strong> <span>([\S\s]*?)<\/span>/g;
            var match = re.exec(v);
            while (match) {
                page.appendItem(PREFIX + ':video:' + escape(match[1]) + ":" + escape(trim(match[7]) + (match[8] ? " | " + trim(match[8]) : "")), 'video', {
                    title: new showtime.RichText((match[3].match(/<div class="hd">/) ? coloredStr('HD ', blue) : '') +
                        trim(match[7]) + (match[8] ? " | " + trim(match[8]) : "")),
                    icon: BASE_URL + match[2],
                    description: new showtime.RichText(coloredStr('Голосов: ', orange) + match[4] + '\n' +
                         coloredStr('Просмотров: ', orange) + match[5] + '\n' +
                         coloredStr('Комментариев: ', orange) + match[6])
                });
                page.entries++;
                match = re.exec(v);
            };
            re = /class="page next" href="([^"]+)">/;
            match = re.exec(v);
            if (!match) return tryToSearch = false;
            v = showtime.httpReq(BASE_URL + match[1]);
            return true;
        };
        loader();
        page.loading = false;
        page.paginator = loader;
    }

    plugin.addURI(PREFIX + ":genre:(.*):(.*)", function(page, url, title) {
        if (!setPageHeader(page, unescape(title))) return;
        scraper(page, BASE_URL + unescape(url));
    });

    plugin.addURI(PREFIX + ":best", function(page) {
        if (!setPageHeader(page, 'Лучшие')) return;
        var v = showtime.httpReq(BASE_URL + "/top");

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
        var origTitle = unescape(title).split(' | ');
        origTitle[1] ? origTitle = origTitle[1] : origTitle = origTitle[0];
        var resp = showtime.httpReq('http://www.imdb.com/find?q=' + encodeURIComponent(showtime.entityDecode(origTitle.replace(/ (HD)/,''))).toString()).toString();
        var imdbid = resp.match(/class="findResult[\S\s]*?<a href="\/title\/([\S\s]*?)\/\?/);
        return imdbid ? imdbid[1] : '';
    };

    // Play links
    plugin.addURI(PREFIX + ":video:(.*):(.*)", function(page, url, title) {
	if (!setPageHeader(page, unescape(title))) return;
	page.loading = true;
        var imdbid = getIMDBid(title);

	function addItem(link, type) {
	    var vparams = "videoparams:" + showtime.JSONEncode({
		title: showtime.entityDecode(unescape(title)),
		canonicalUrl: PREFIX + ":video:" + url + ":" + title + ":" + type,
		imdbid: imdbid,
		no_fs_scan: true,
		sources: [{
		    url: link
		}]
	    });
	    page.appendItem(vparams, 'video', {
		title: new showtime.RichText(type+" "+v.match(/<title>([\S\s]*?)<\/title>/)[1]),
		icon: v.match(/<poster>([\S\s]*?)<\/poster>/)[1],
		genre: v.match(/<genre>([\S\s]*?)<\/genre>/)[1],
		year: parseInt(v.match(/<year>([\S\s]*?)<\/year>/)[1]),
		duration: parseInt(v.match(/<duration>([\S\s]*?)<\/duration>/)[1]),
		description: new showtime.RichText(orangeStr("Страна: ")+v.match(/<country>([\S\s]*?)<\/country>/)[1] +
		    orangeStr(" Режиссер: ")+v.match(/<director>([\S\s]*?)<\/director>/)[1] +
		    orangeStr(" В ролях: ")+v.match(/<cast>([\S\s]*?)<\/cast>/)[1] + "<br>" +
		    orangeStr("Описание: ")+v.match(/<about>([\S\s]*?)<\/about>/)[1])
	    });
	    page.loading = false;
	}
        var v = showtime.httpReq(BASE_URL + '/api/watch/' + unescape(url).match(/[\S\s]*?([\d+]+)/i)[1]).toString();
        var tmp = v.match(/<hdrtmp>([\S\s]*?)<\/hdrtmp>/);
	if (tmp && !showtime.probe(tmp[1]).result) addItem(tmp[1], blueStr("HD RTMP"));
        tmp = v.match(/<rtmp>([\S\s]*?)<\/rtmp>/);
	if (tmp && !showtime.probe(tmp[1]).result) addItem(tmp[1], blueStr("SD RTMP"));
        tmp = v.match(/<hdvideo>([\S\s]*?)<\/hdvideo>/);

	var html = showtime.httpReq(BASE_URL + unescape(url)).toString();
        addItem(html.match(/<video src="([\S\s]*?)"/)[1], blueStr("SD HLS"));
	page.loading = false;

	if (tmp && !showtime.probe(tmp[1]).result) addItem(tmp[1], blueStr("HD MP4"));
        tmp = v.match(/<video>([\S\s]*?)<\/video>/);
	if (tmp && !showtime.probe(tmp[1]).result) addItem(tmp[1], blueStr("SD MP4"));
	addItem(html.match(/file:"([^"]+)/)[1], blueStr("SD FILE"));

	// 1-icon, 2-nick, 3-age, 4-date/time, 5-comment
	var re = /<div class="avatar"><a href="[\s\S]*?"><img src="([\s\S]*?)"[\s\S]*?<strong>([\s\S]*?)<\/strong>[\s\S]*?<div class="sex">([\s\S]*?)<\/span>[\s\S]*?<div class="date">([\s\S]*?)<\/div>[\s\S]*?<div class="comment" id="[\s\S]*?">([\s\S]*?)<\/div>/g;
        var match = re.exec(html);
	var counter = 0;
	while (match) {
	    if (counter == 0) {
		page.appendItem("", "separator", {
		    title: 'Комментарии:'
		});
	        counter++;
	    };
            page.appendPassiveItem('video', "", {
		title: new showtime.RichText(orangeStr(match[2])+" "+match[3]+" "+match[4]),
		description: new showtime.RichText(match[5]),
		icon: match[1][0] == "/" ?  BASE_URL + match[1] : match[1]
	    });
	    match = re.exec(html);
	};
    });

    var v, Genre = "0", Year = "0", Sorting = "added", Order = "desc";

    plugin.addURI(PREFIX + ":start", function(page) {
	if (!setPageHeader(page, descriptor.synopsis)) return;
        function topPart() {
            page.appendItem(PREFIX + ':best', 'directory', {
                title: "Лучшие"
            });

            page.appendItem(PREFIX + ':genres', 'directory', {
                title: "Жанры"
            });

            v = showtime.httpReq(BASE_URL + "/?genre=" + Genre + "&year=" + Year + "&sorting=" + Sorting + "&order=" + Order).toString();
            // let's show genres
            var genres = v.match(/<ul>([\S\s]*?)<\/ul>/)[1];
            var re = /<li><a href="([\S\s]*?)">([\S\s]*?)<\/a><\/li>/g;
            var match = re.exec(genres);
            while (match) {
                page.appendItem(PREFIX + ':genres:' + escape(match[1]) + ":" + escape(match[2]), 'directory', {
                    title: new showtime.RichText(match[2])
                });
                match = re.exec(genres);
            }
        };


        topPart();

        var re = /<option label="([\S\s]*?)" value="([\S\s]*?)"[\S\s]*?<\/option>/g;
        // add genres to the page.options
        var genre = [],  obj = [];
        var genres = v.match(/<select name="genre">([\S\s]*?)<\/select>/)[1];
        var match = re.exec(genres);
        var defOpt = true;
        while (match) {
            obj[0] = match[2];
            obj[1] = match[1];
            obj[2] = defOpt;
            genre.push(obj);
            obj = [];
            defOpt = false;
            match = re.exec(genres);
        };

        // add years to the page.options
        var year = [];
        var years = v.match(/<select name="year">([\S\s]*?)<\/select>/)[1];
        var match = re.exec(years);
        var defOpt = true;
        while (match) {
            obj[0] = match[2];
            obj[1] = match[1];
            obj[2] = defOpt;
            year.push(obj);
            obj = [];
            defOpt = false;
            match = re.exec(years);
        };

        // add sorting to the page.options
        var sorting = [];
        var sorts = v.match(/<select name="sorting">([\S\s]*?)<\/select>/)[1];
        var match = re.exec(sorts);
        var defOpt = true;
        while (match) {
            obj[0] = match[2];
            obj[1] = match[1];
            obj[2] = defOpt;
            sorting.push(obj);
            obj = [];
            defOpt = false;
            match = re.exec(sorts);
        };

        // add sorting to the page.options
        var order = [];
        var orders = v.match(/<select name="order">([\S\s]*?)<\/select>/)[1];
        var match = re.exec(orders);
        var defOpt = true;
        while (match) {
            obj[0] = match[2];
            obj[1] = match[1];
            obj[2] = defOpt;
            order.push(obj);
            obj = [];
            defOpt = false;
            match = re.exec(orders);
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
    });

    plugin.addSearcher(descriptor.id, logo, function(page, query) {
        if (!login(page, false)) return;
        scraper(page, BASE_URL, {args:{search:query}});
    });
})(this);