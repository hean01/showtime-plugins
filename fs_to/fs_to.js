/**
 * sdf.to plugin for Showtime
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

    var PREFIX = 'sdf_to';
    var BASE_URL = 'http://sdf.to';

    var logo = plugin.path + "logo.png";

    var sURL = {};
    var sTitle = {};

    var service = plugin.createService("sdf.to", PREFIX + ":start", "video", true, logo);

    function setPageHeader(page, title) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    }

    // remove multiple, leading or trailing spaces and line feeds
    function trim(s) {
        return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ");
    }

    function removeSlashes(s) {
        return s.replace(/\\'/g, '\'').replace(/\\"/g, '"').replace(/\\0/g, '\0').replace(/\\\\/g, '\\');
    }

    function blueStr(str) {
        return '<font color="6699CC">' + str + '</font>';
    }

    function startPage(page) {
        setPageHeader(page, 'sdf.to - Рекомендательная видеосеть');
        page.loading = false;
        page.appendItem(PREFIX + ':updates', 'directory', {
            title: 'Последние обновления',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/video/films/?sort=rating&view=list', 'directory', {
            title: 'Фильмы',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/video/serials/?sort=rating&view=list', 'directory', {
            title: 'Сериалы',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/video/cartoons/?sort=rating&view=list', 'directory', {
            title: 'Мультфильмы',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/video/cartoonserials/?sort=rating&view=list', 'directory', {
            title: 'Мультсериалы',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/video/tvshow/?sort=rating&view=list', 'directory', {
            title: 'Телепередачи',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/video/clips/?sort=rating&view=list', 'directory', {
            title: 'Клипы',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/video/concerts/?sort=rating&view=list', 'directory', {
            title: 'Концерты',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/audio/albums/?sort=rating&view=list', 'directory', {
            title: 'Альбомы',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/audio/singles/?sort=rating&view=list', 'directory', {
            title: 'Синглы',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/audio/collections/?sort=rating&view=list', 'directory', {
            title: 'Сборники',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/audio/soundtracks/?sort=rating&view=list', 'directory', {
            title: 'Саундтреки',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/games/traditional/?sort=rating&view=list', 'directory', {
            title: 'Игры традиционные',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/games/online/?sort=rating&view=list', 'directory', {
            title: 'Игры онлайн',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/games/casual/?sort=rating&view=list', 'directory', {
            title: 'Игры казуальные',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/texts/fiction/?sort=rating&view=list', 'directory', {
            title: 'Литература художественная',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/texts/other/?sort=rating&view=list', 'directory', {
            title: 'Литература прикладная',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/texts/journals/?sort=rating&view=list', 'directory', {
            title: 'Литература журналы',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/texts/comix/?sort=rating&view=list', 'directory', {
            title: 'Литература комиксы',
            icon: logo
        });
    };

    function getFontColor(type) {
        switch (type) {
            case "Видео":
                return '"FFDE00"';
            case "Аудио":
                return '"FF0000"';
            case "Игры":
                return '"92CD00"';
            case "Литература":
                return '"6699CC"';
            default:
                return '"FFDE00"';
        }
    }

    // Shows what's new page
    plugin.addURI(PREFIX + ":updates", function(page) {
        setPageHeader(page, 'Последние обновления');
        var p = 0;

        function loader() {
            var response = showtime.httpGet(BASE_URL + "/updates.aspx?page=" + p);
            //1-type 2-link 3-title 4-date 5-time
            var re = /class="m-themed">([^\<]+)[\S\s]*?a href="([^"]+)" class="item-link" title="[^"]+">([^\<]+)[\S\s]*?class="col-date"[\S\s]*?\>([^\<]+)[\S\s]*?class="col-time">([^\<]+)/g;
            var match = re.exec(response);
            while (match) {
                page.appendItem(PREFIX + ":listRoot:" + escape(match[2]) + ":" + escape(match[3]), "directory", {
                    title: new showtime.RichText(match[3] + '<font color=' + getFontColor(match[1]) + '> (' + match[1] + ')</font> ' + match[4] + ' ' + match[5])
                });
                match = re.exec(response);
            }
            p++;
            re = /<b>Следующая страница<\/b>/;
            if (re.exec(response)) return true;
            return false;
        }
        loader();
        page.paginator = loader;
    });

    function index(page, url) {
        setPageHeader(page, '');
        var p = 0;

        function loader() {
            var response = showtime.httpGet(url + "&page=" + p);
            var re = /class="selected">([\S\s]*?)\</;
            var match = re.exec(response);
            if (match) if (page.metadata) page.metadata.title = match[1];

            // Show populars only above the first page
            if (p == 0) {
                re = /<div class="b-posters[\S\s]*?">([\S\s]*?)<div class="b-clear">/;
                var what_else = re.exec(response);
                if (!what_else) {
                    re = /<div class="b-poster-series[\S\s]*?">([\S\s]*?)<div class="b-clear">/;
                    what_else = re.exec(response)[1];
                    // 1 - link, 2 - image, 3 - title
                    re = /<a href="([^"]+)[\S\s]*?url\('([^']+)[\S\s]*?<span[\S\s]*?>([\S\s]*?)<\/span>/g;
                } else {
                    what_else = what_else[1];
                    // 1 - link, 2 - image, 3 - title
                    re = /<a href="([^"]+)[\S\s]*?url\('([^']+)[\S\s]*?<span class="m-poster-new__full_title">([\S\s]*?)<\/span>/g;
                }
                page.appendItem("", "separator", {
                    title: 'Самое просматриваемое сейчас'
                });
                var m = re.exec(what_else);
                while (m) {
                    title = trim(m[3].replace('<p>', " / ")).replace('</p><p>', " ").replace('</p>', "");
                    page.appendItem(PREFIX + ":listRoot:" + m[1] + ":" + escape(title), "video", {
                        title: new showtime.RichText(title),
                        icon: m[2]
                    });
                    m = re.exec(what_else);
                }
                page.appendItem("", "separator", {
                    title: ''
                });
            }

            //1-link 2-img 3-short title 4-date 5-description
	    re = /class="subject-link" href="([^"]+)[\S\s]*?<img src="([^"]+)[\S\s]*?alt=\'([\S\s]*?)'\/>([\S\s]*?)class="subject-link m-full">[\S\s]*?\<span>([\S\s]*?)\<\/span>/g;
            match = re.exec(response);
            var re2 = /class="date">\(([^\)]+)/;
	    if (!match) return p = 1;
            var match2 = re2.exec(match[4]);
            var date = "";
            if (match2) date = '<font color="6699CC"> (' + match2[1] + ')</font>';
            while (match) {
                var title = removeSlashes(match[5].replace('<p>', " / ").replace('</p><p>', " ").replace('</p>', ""));
                page.appendItem(PREFIX + ":listRoot:" + escape(match[1]) + ":" + escape(match[3]), "video", {
                    title: new showtime.RichText(title + date),
                    icon: match[2],
                    description: new showtime.RichText(match[5])
                });
                match = re.exec(response);
                if (match) {
                    match2 = re2.exec(match[4]);
                    date = "";
                    if (match2) date = '<font color="6699CC"> (' + match2[1] + ')</font>';
                }
            }
            p++;
            var re = /<b>Следующая страница<\/b>/;
            if (re.exec(response)) return true;
            return false;
        }
        loader();
        page.paginator = loader;
    }

    // Index page at URL
    plugin.addURI(PREFIX + ":index:(.*)", function(page, url) {
        index(page, BASE_URL + url);
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

    // Appends the item and lists it's root folder
    plugin.addURI(PREFIX + ":listRoot:(.*):(.*)", function(page, url, title) {
        title = unescape(title);
        setPageHeader(page, title);
        var response = showtime.httpGet(BASE_URL + url).toString();
	var icon = response.match(/<link rel="image_src" href="([^"]+)"/);
	if (icon) icon = icon[1];
	var description = response.match(/<p class="item-decription [^"]+">([\S\s]*?)<\/p>/);
	if (description) description = description[1]; else description = '';
        var what_else = response.match(/<div class="b-posters">([\S\s]*?)<div class="clear">/);
        page.appendItem(PREFIX + ":playOnline:" + url + ":" + escape(title), "video", {
            title: new showtime.RichText(title),
            icon: icon,
            description: new showtime.RichText(description)
        });
        response = showtime.httpGet(BASE_URL + url + '?ajax&blocked=0&folder=0');
        var re = /<ul class="filelist[^"]+[\S\s]*?<\/ul>/;
        response = re.exec(response);
        var start = 0,
            end = 0;
        if (response) {
            response = response[0].replace(/(class="b-transparent-area")/g, "");
            start = response.indexOf('<li class="', start + 1);
            end = response.indexOf('</li>', start + 1);
            // 1 - type, 2 - folder_id, 3 - name, 4 - size, 5 - details, 6 - date
            re = /<li class="([^"]+)[\S\s]*?rel="{parent_id: ([^}]+)}"[\S\s]*?>([\S\s]*?)<\/a>[\S\s]*?<span class="material-size">([\S\s]*?)<span class="material-details">([^\<]+)[\S\s]*?<span class="material-date">([^\<]+)/;
            var m = re.exec(response.substring(start, end));
        }
        while (m && (start > 0)) {
            m[3] = trim(m[3]);
            // Material size clean & join
            m[4] = m[4].replace(/<span class="material-size">/g, "");
            m[4] = m[4].replace(/<\/span>/g, "");
            m[4] = trim(m[4]);
            if (m[1] == "folder") {
                page.appendItem(PREFIX + ":listFolder:" + escape(url) + ":" + m[2].replace("\'", "") + ":" + escape(title), "directory", {
                    title: new showtime.RichText(m[3] + '<font color="6699CC"> (' + m[4] + ')</font> ' + m[5] + " " + m[6])
                });
            };
            start = response.indexOf('<li class="', start + 1);
            end = response.indexOf('</li>', start + 1);
            m = re.exec(response.substring(start, end));
        }
        if (what_else) {
            what_else = what_else[1];
            page.appendItem("", "separator", {
                title: 'Похожие материалы'
            });
            // 1 - link, 2 - image, 3 - title
            re = /<a href="([^"]+)[\S\s]*?url\('([^']+)[\S\s]*?<span class="m-poster-new__full_title">([\S\s]*?)<\/span>/g;
            m = re.exec(what_else);
            while (m) {
                title = m[3].replace('<p>', " / ");
                title = title.replace('</p><p>', " ");
                title = title.replace('</p>', "");
                page.appendItem(PREFIX + ":listRoot:" + m[1] + ":" + escape(title), "video", {
                    title: new showtime.RichText(title),
                    icon: m[2]
                });
                m = re.exec(what_else);
            }
        }
    });

    plugin.addURI(PREFIX + ":listFolder:(.*):(.*):(.*)", function(page, url, folder, title) {
        title = unescape(title);
        setPageHeader(page, title);
        var response = showtime.httpGet(BASE_URL + unescape(url) + '?ajax&blocked=0&folder=' + folder);
        var re = /<li class="([^"]+)([\S\s]*?)<\/li>/g;
        var m = re.exec(response); // parsed list will live here
        while (m) {
            if (m[1].indexOf("file") > -1) {
                var re2 = /a href="([^"]+)/;
                var flv_link = "";
                if (re2.exec(m[2])) flv_link = re2.exec(m[2])[1];
                re2 = /span class="[\S\s]*?filename-text">([\S\s]*?)<\/span>/;
                var name = re2.exec(m[2])[1];
                re2 = /span class="[\S\s]*?material-size">([\S\s]*?)<\/span>/;
                var size = re2.exec(m[2])[1];
                re2 = /" href="([^"]+)/;
                var direct_link = re2.exec(m[2])[1];
                if (getType(direct_link.split('.').pop()) == 'video') {
                    sURL[direct_link] = flv_link;
                    sTitle[direct_link] = name;
                    page.appendItem(PREFIX + ":play:" + direct_link, getType(direct_link.split('.').pop()), {
                        title: new showtime.RichText(name + '<font color="6699CC"> (' + size + ')</font>')
                    });
                } else {
                    page.appendItem(BASE_URL + direct_link, getType(direct_link.split('.').pop()), {
                        title: new showtime.RichText(name + '<font color="6699CC"> (' + size + ')</font>')
                    });
                }
            } else {
                if (m[1] == "folder") {
                    var re2 = /<li class="([^"]+)[\S\s]*?href="([^"]+)[\S\s]*?class="link-material" ><span style="">([\S\s]*?)<\/span>[\S\s]*?<span class="material-size">([\S\s]*?)<\/span>/;
                    var n = re2.exec(m[2]);
                    if (n) { // checking for opened folder
                        re2 = /<li class="([^"]+)[\S\s]*?" href="([^"]+)[\S\s]*?class="link-material" ><span style="">([\S\s]*?)<\/span>[\S\s]*?<span class="material-size">([\S\s]*?)<\/span>/;
                        n = re2.exec(m[2]);
                        page.appendItem(n[2], getType(n[1]), {
                            title: new showtime.RichText(n[3] + '<font color="6699CC"> (' + n[4] + ')</font>')
                        });
                    } else {
                        var re2 = /rel="{parent_id: ([^}]+)}">([\S\s]*?)<\/a>[\S\s]*?<span class="material-size">([\S\s]*?)<\/span>[\S\s]*?<span class="material-details">([^\<]+)[\S\s]*?<span class="material-date">([^\<]+)/;
                        var n = re2.exec(m[2]);
                        n[2] = trim(n[2]);
                        page.appendItem(PREFIX + ":listFolder:" + escape(url) + ":" + n[1].replace("'", "") + ":" + escape(title), "directory", {
                            title: new showtime.RichText(n[2] + '<font color="6699CC"> (' + n[3] + ')</font> ' + n[4] + " " + n[5])
                        });
                    }
                }
            }
            m = re.exec(response);
        }
    });

    // Processes "Play online" button 
    plugin.addURI(PREFIX + ":playOnline:(.*):(.*)", function(page, url, title) {
        var response = showtime.httpGet(BASE_URL + url).toString();
        var re = /playlist: \[[\S\s]*?url: '([^']+)/;
        url = re.exec(response) // Some clips autoplay
        if (!url) {
            re = /<div id="page-item-viewonline"[\S\s]*?<a href="([^"]+)/;
            response = showtime.httpGet(BASE_URL + re.exec(response)[1]).toString();
            re = /<a id="[\S\s]*?" href="([\S\s]*?)" title="([\S\s]*?)"/;
            response = re.exec(response);
            if (!response) {
                page.error("Линк на проигрывание отсутствует :(");
                return;
            }
            re = /playlist: \[[\S\s]*?url: '([^']+)/;
            url = re.exec(showtime.httpGet(BASE_URL + response[1]));
        }
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            sources: [{
                url: BASE_URL + url[1]
            }]
        });
        page.loading = false;
    });

    // Play URL
    plugin.addURI(PREFIX + ":play:(.*)", function(page, url) {
        page.type = "video";
        if (showtime.probe(BASE_URL + url).result == 0) {
            page.source = "videoparams:" + showtime.JSONEncode({
                title: sTitle[url],
                canonicalUrl: PREFIX + ":play:" + url,
                sources: [{
                    url: BASE_URL + url
                }]
            });
            page.loading = false;
            return;
        }
        var origURL = url;
        if (sURL[url]) url = sURL[url];
        var response = showtime.httpGet(BASE_URL + url).toString();
        var start = 0,
            end = 0;
        start = response.indexOf('<title>', start + 1);
        end = response.indexOf('</title>', start + 1);
        var re = /<title>([\S\s]+)/;
        var title = re.exec(response.substring(start, end))[1]; // problem lives here
        start = response.indexOf('class="b-view-material"', start + 1);
        end = response.indexOf('</div>', start + 1);
        re = /<a href="([^"]+)/;
        if (start > 0) {
            var link = re.exec(response.substring(start, end))[1];
        }
        if (!link) {
            re = /playlist: \[[\S\s]*?url: '([^']+)/;
            m = re.exec(response);
        } else {
            re = /playlist: \[[\S\s]*?url: '([^']+)/;
            var m = re.exec(showtime.httpGet(BASE_URL + link));
        }
        if (!m) { // first file from the first folder
            re = /class="filelist m-current"[\S\s]*?" href="([^"]+)/;
            m = re.exec(showtime.httpGet(BASE_URL + url + '?ajax&blocked=0&folder=0'));
        }
        if (m) {
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                canonicalUrl: PREFIX + ":play:" + origURL,
                sources: [{
                    url: BASE_URL + m[1]
                }]
            });
        } else page.error("Линк не проигрывается :(");
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":start", startPage);

    plugin.addSearcher("sdf.to", logo, function(page, query) {
        var fromPage = 1, tryToSearch = true;
        //1-link, 2-title, 3-image, 4 - description, 5 - type, 6 - type in text, 7 - genre
        var re = /class="image-wrap">[\S\s]*?<a href="([^"]+)" title="([^"]+)"><img src="([^"]+)[\S\s]*?<p class="text">([\S\s]*?)<\/p>[\S\s]*?<span class="section ([^"]+)">([\S\s]*?)<\/span>[\S\s]*?<span class="genre"><span class="caption">Жанр:<\/span><span>([\S\s]*?)<\/span>/g;
        var re2 = /<b>Следующая страница<\/b>/;

        function loader() {
            if (!tryToSearch) return false;
	    var link = BASE_URL + "/search.aspx?search=" + query.replace(/\s/g, '\+') 
            if (fromPage != 1) link = link + "&page=" + fromPage;
            var response = showtime.httpGet(link);
            var match = re.exec(response);
            while (match) {
                page.appendItem(PREFIX + ":listRoot:" + escape(match[1]) + ":" + escape(match[2]), "video", {
                    title: new showtime.RichText(match[2]),
                    icon: match[3],
                    genre: match[7],
                    description: new showtime.RichText('Раздел: ' + blueStr(match[6]) + '\n' + match[4])
                });
                page.entries++;
                match = re.exec(response);
            };

            if (!re2.exec(response)) return tryToSearch = false;
            fromPage++;
            return true;
        };
        loader();
        page.paginator = loader;
    });
})(this);
