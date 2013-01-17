/**
 * FS.UA plugin for Showtime
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

    var PREFIX = 'fs_ua';
    var BASE_URL = 'http://fs.ua';

    var logo = plugin.path + "logo.png";

    var sURL = {};
    var sTitle = {};

    function setPageHeader(page, title) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
    }

    var service = plugin.createService("fs.ua", PREFIX + ":start", "video", true, logo);

    // remove multiple, leading or trailing spaces and line feeds

    function trim(s) {
        s = s.replace(/(\r\n|\n|\r)/gm, "");
        s = s.replace(/(^\s*)|(\s*$)/gi, "");
        s = s.replace(/[ ]{2,}/gi, " ");
        return s;
    }

    function startPage(page) {
        setPageHeader(page, 'fs.ua - Рекомендательная видеосеть');
        page.loading = false;
        page.appendItem(PREFIX + ':updates', 'directory', {
            title: 'Новое в каталоге',
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
        setPageHeader(page, 'Новое в каталоге');
        var p = 0;
        var url = BASE_URL + "/updates.aspx?page=";

        function loader() {
            showtime.trace('updates: Trying to httpGet: ' + url + p);
            var response = showtime.httpGet(url + p);
            showtime.trace("updates: Got response from httpGet: " + url + p);

            //1-type 2-link 3-title 4-date 5-time
            var re = /class="m-themed">([^\<]+)[\S\s]*?a href="([^"]+)" class="item-link">([^\<]+)[\S\s]*?class="col-date"[\S\s]*?\>([^\<]+)[\S\s]*?class="col-time">([^\<]+)/g;
            showtime.trace('updates: Regexing the classes...');
            var match = re.exec(response);
            showtime.trace('updates: Done regexing the classes...');
            while (match) {
                page.appendItem(PREFIX + ":listRoot:" + escape(match[2]) + ":" + escape(match[3]), "directory", {
                    title: new showtime.RichText(match[3] + '<font color=' + getFontColor(match[1]) + '> (' + match[1] + ')</font> ' + match[4] + ' ' + match[5])
                });
                showtime.trace('updates: Regexing an item inside of the loop...');
                match = re.exec(response);
                showtime.trace('updates: Done regexing the item inside of the loop...');
            }
            p++;
            var re = /<b>Следующая страница<\/b>/;
            showtime.trace('updates: Trying to check if the page is last...');
            if (!re.exec(response)) {
                showtime.trace('updates: This is the last page...');
                return false
            } else {
                showtime.trace('updates: This is not the last page...');
                return true;
            }
        }
        loader();
        page.loading = false;
        page.paginator = loader;
        showtime.trace('updates: PAGE IS LOADED...');
    });

    function removeSlashes(str) {
        str = str.replace(/\\'/g, '\'');
        str = str.replace(/\\"/g, '"');
        str = str.replace(/\\0/g, '\0');
        str = str.replace(/\\\\/g, '\\');
        return str;
    }

    function index(page, url) {
        setPageHeader(page, '');
        var p = 0;

        function loader() {
            showtime.trace('index: Trying to httpGet: ' + url + "&page=" + p);
            var response = showtime.httpGet(url + "&page=" + p);
            showtime.trace("index: Got response from httpGet: " + url + "&page=" + p);
            var re = /class="selected">([\S\s]*?)\</;
            showtime.trace('index: Regexing class="selected"');
            var match = re.exec(response);
            showtime.trace('index: Done regexing class="selected"');
            if (match) if (page.metadata) page.metadata.title = match[1];
            //1-link 2-img 3-title 4-date 5-description
            re = /class="subject-link" href="([^"]+)[\S\s]*?<img src="([^"]+)[\S\s]*?alt=\'([\S\s]*?)'\/>([\S\s]*?)class="subject-link m-full">[\S\s]*?\<span>([\S\s]*?)\<\/span>/g;
            showtime.trace('index: Regexing an item...');
            match = re.exec(response);
            showtime.trace('index: Done regexing the item...');
            var re2 = /class="date">\(([^\)]+)/;
            showtime.trace('index: Regexing the date inside of the item...');
            var match2 = re2.exec(match[4]);
            showtime.trace('index: Done regexing the date inside of the item...');
            var date = "";
            if (match2) date = '<font color="6699CC"> (' + match2[1] + ')</font>';

            while (match) {
                page.appendItem(PREFIX + ":listRoot:" + escape(match[1]) + ":" + escape(match[3]), "video", {
                    title: new showtime.RichText(removeSlashes(match[3]) + date),
                    icon: match[2],
                    description: new showtime.RichText(match[5])
                });
                showtime.trace('index: Regexing an item inside of the loop...');
                match = re.exec(response);
                if (match) {
                    showtime.trace('index: Regexing the date inside of the item inside of the loop...');
                    match2 = re2.exec(match[4]);
                    showtime.trace('index: Done regexing the date inside of the item inside of the loop...');
                    date = "";
                    if (match2) date = '<font color="6699CC"> (' + match2[1] + ')</font>';
                }
                showtime.trace('index: Done regexing the item inside of the loop...');
            }
            p++;
            var re = /<b>Следующая страница<\/b>/;
            showtime.trace('index: Trying to check if the page is last...');
            if (!re.exec(response)) {
                showtime.trace('index: This is the last page...');
                return false
            } else {
                showtime.trace('index: This is not the last page...');
                return true;
            }
        }
        loader();
        page.loading = false;
        page.paginator = loader;
        showtime.trace('index: PAGE IS LOADED...');
    }

    // Index page at URL
    plugin.addURI(PREFIX + ":index:(.*)", function(page, url) {
        index(page, BASE_URL + url);
    });

    function getType(type) {
        switch (type) {
            case "file mkv":
            case "file avi":
            case "file flv":
            case "file mp4":
            case "file mov":
            case "file ts":
            case "file mpg":
            case "file mpeg":
            case "file vob":
            case "file iso":
                return "video";
            case "file jpg":
            case "file jpeg":
            case "file png":
            case "file bmp":
                return "image";
            case "file mp3":
            case "file flac":
            case "file wav":
            case "file ogg":
            case "file aac":
            case "file m4a":
            case "file ape":
            case "file dts":
            case "file ac3":
                return "audio";
            default:
                return "file";
        }
    }

    plugin.addURI(PREFIX + ":listFolder:(.*):(.*):(.*)", function(page, url, folder, title) {
        title = unescape(title);
        setPageHeader(page, title);
        showtime.trace('listFolder: Trying to httpGet: ' + BASE_URL + unescape(url) + '?ajax&folder=' + folder);
        var response = showtime.httpGet(BASE_URL + unescape(url) + '?ajax&folder=' + folder);
        showtime.trace('listFolder: Got response from httpGet: ' + BASE_URL + unescape(url) + '?ajax&folder=' + folder);
        var re = /<li class="([^"]+)([\S\s]*?)<\/li>/g;
        var m = re.exec(response); // parsed list will live here
        showtime.trace('listFolder: Done regexing folder/file item list...');
        while (m) {
            if (m[1].substring(0, 4) == "file") {
                // 1 - link, 2 - name, 3 - size, 4 - raw flv link
                var re2 = /[\S\s]*?href="([^"]+)[\S\s]*?class="link-material" ><span style="">([\S\s]*?)<\/span>[\S\s]*?<span class="material-size">([\S\s]*?)<\/span>([\S\s]*?)<\/tr>/;
                showtime.trace('listFolder: Regexing the file item...');
                var n = re2.exec(m[2]);
                showtime.trace('listFolder: Done regexing the file item...');
                var re3 = /[\S\s]*?<a href="([^"]+)/;
                showtime.trace('listFolder: Regexing flv link of the file item...');
                var l = re3.exec(n[4]);
                showtime.trace('listFolder: Done regexing flv link of the file item...');
                if (l) sURL[n[1]] = l[1];
                if (getType(m[1]) == "video") {
                    sTitle[n[1]] = unescape(n[2]);
                    page.appendItem(PREFIX + ":play:" + n[1], getType(m[1]), {
                        title: new showtime.RichText(n[2] + '<font color="6699CC"> (' + n[3] + ')</font>')
                    })
                } else {
                    page.appendItem(n[1], getType(m[1]), {
                        title: new showtime.RichText(n[2] + '<font color="6699CC"> (' + n[3] + ')</font>')
                    })
                }
            } else {
                if (m[1] == "folder") {
                    var re2 = /<li class="([^"]+)[\S\s]*?href="([^"]+)[\S\s]*?class="link-material" ><span style="">([\S\s]*?)<\/span>[\S\s]*?<span class="material-size">([\S\s]*?)<\/span>/;
                    showtime.trace('listFolder: Regexing folder item...');
                    var n = re2.exec(m[2]);
                    showtime.trace('listFolder: Done regexing folder item...');
                    if (n) { // checking for opened folder
                        re2 = /<li class="([^"]+)[\S\s]*?" href="([^"]+)[\S\s]*?class="link-material" ><span style="">([\S\s]*?)<\/span>[\S\s]*?<span class="material-size">([\S\s]*?)<\/span>/;
                        showtime.trace('listFolder: Regexing for opened folder item...');
                        n = re2.exec(m[2]);
                        showtime.trace('listFolder: Done regexing for opened folder item...');
                        page.appendItem(n[2], getType(n[1]), {
                            title: new showtime.RichText(n[3] + '<font color="6699CC"> (' + n[4] + ')</font>')
                        });
                    } else {
                        var re2 = /rel="{parent_id: ([^}]+)}">([\S\s]*?)<\/a>[\S\s]*?<span class="material-size">([\S\s]*?)<\/span>[\S\s]*?<span class="material-details">([^\<]+)[\S\s]*?<span class="material-date">([^\<]+)/;
                        showtime.trace('listFolder: Regexing a folder item...');
                        var n = re2.exec(m[2]);
                        showtime.trace('listFolder: Done regexing a folder item...');
                        n[2] = trim(n[2]);
                        page.appendItem(PREFIX + ":listFolder:" + escape(url) + ":" + n[1].replace("'", "") + ":" + escape(title), "directory", {
                            title: new showtime.RichText(n[2] + '<font color="6699CC"> (' + n[3] + ')</font> ' + n[4] + " " + n[5])
                        });
                    }
                }
            }
            m = re.exec(response);
        }
        showtime.trace('listFolder: PAGE IS LOADED...');
        page.loading = false;
    });

    // Appends the item and lists it's root folder
    plugin.addURI(PREFIX + ":listRoot:(.*):(.*)", function(page, url, title) {
        title = unescape(title);
        showtime.trace("listRoot: Trying to httpGet: " + BASE_URL + url);
        var response = showtime.httpGet(BASE_URL + url);
        showtime.trace("listRoot: Got response from httpGet: " + BASE_URL + url);
        var re = /<div class="poster-main">[\S\s]*?<img src="([^"]+)" alt="([^"]+)/;
        showtime.trace("listRoot: Trying to regex poster...");
        var m = re.exec(response);
        showtime.trace("listRoot: Got poster...");
        var icon = 0;
        var description = '';
        if (m) {
            icon = m[1];
            title = m[2];
            re = /<div class="item-info">([\S\s]*?)<\/div>/;
            showtime.trace("listRoot: Setting description...");
            description = new showtime.RichText(trim(re.exec(response)[1].toString()).replace('>еще</a>', ""));
            showtime.trace("listRoot: Description is set...");
        }
        setPageHeader(page, title);
        page.appendItem(PREFIX + ":play:" + url, "video", {
            title: new showtime.RichText(title),
            icon: icon,
            description: description
        });

        showtime.trace("listRoot: Getting url of the root folder...");
        response = showtime.httpGet(BASE_URL + url + '?ajax&folder=0');
        showtime.trace("listRoot: Got url of the root folder...");

        re = /<ul class="filelist ">[\S\s]*?<\/ul>/;
        showtime.trace("listRoot: Regexing filelist... ");
        response = re.exec(response);
        showtime.trace("listRoot: Got filelist... ");
        var start = 0;
        var end = 0;
        if (response) {
            showtime.trace("listRoot: Removing b-transparent-area... ");
            response = response[0].replace(/(class="b-transparent-area")/g, "");
            showtime.trace("listRoot: b-transparent-area is removed... ");
            start = response.indexOf('<li class="', start + 1);
            end = response.indexOf('</li>', start + 1);
            // 1 - type, 2 - folder_id, 3 - name, 4 - size, 5 - details, 6 - date
            re = /<li class="([^"]+)[\S\s]*?rel="{parent_id: ([^}]+)}"[\S\s]*?>([\S\s]*?)<\/a>[\S\s]*?<span class="material-size">([\S\s]*?)<span class="material-details">([^\<]+)[\S\s]*?<span class="material-date">([^\<]+)/;
            showtime.trace("listRoot: Regexing folder/file... ");
            m = re.exec(response.substring(start, end));
            showtime.trace("listRoot: Done regexing folder/file... ");
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
            showtime.trace("listRoot: Regexing folder/file inside of the loop... ");
            m = re.exec(response.substring(start, end));
            showtime.trace("listRoot: Done regexing folder/file inside of the loop... ");
        }
        showtime.trace("listRoot: THE PAGE IS LOADED... ");
        page.loading = false;
    });

    // Play URL
    plugin.addURI(PREFIX + ":play:(.*)", function(page, url) {
        page.type = "video";
        if (showtime.probe(url).result == 0) {
            page.source = "videoparams:" + showtime.JSONEncode({
                title: sTitle[url],
                canonicalUrl: PREFIX + ":play:" + url,
                sources: [{
                    url: url
                }]
            });
            page.loading = false;
            return;
        }
        var origURL = url;
        if (sURL[url]) url = sURL[url];

        showtime.trace("play: Trying to httpGet: " + BASE_URL + url);
        var response = showtime.httpGet(BASE_URL + url).toString();
        showtime.trace("play: Got response from httpGet: " + BASE_URL + url);
        var start = 0;
        var end = 0;
        start = response.indexOf('<title>', start + 1);
        end = response.indexOf('</title>', start + 1);
        var re = /<title>([\S\s]+)/;
        showtime.trace("play: Regexing title...");
        var title = re.exec(response.substring(start, end))[1]; // problem lives here
        showtime.trace("play: Done regexing title...");
        start = response.indexOf('class="b-view-material"', start + 1);
        end = response.indexOf('</div>', start + 1);
        re = /<a href="([^"]+)/;
        if (start > 0) {
            showtime.trace("play: Regexing b-view-material link...");
            var link = re.exec(response.substring(start, end))[1];
            showtime.trace("play: Done regexing b-view-material link...");
        }
        if (!link) {
            re = /playlist: \[[\S\s]*?url: '([^']+)/;
            showtime.trace("play: Regexing the link from playlist url...");
            m = re.exec(response);
            showtime.trace("play: Done regexing the link from playlist url...");
        } else {
            re = /playlist: \[[\S\s]*?url: '([^']+)/;
            showtime.trace("play: (2) Regexing the link from playlist url...");
            var m = re.exec(showtime.httpGet(BASE_URL + link));
            showtime.trace("play: (2) Done regexing the link from playlist url...");
        }
        if (!m) { // first file from the first folder
            re = /class="filelist m-current"[\S\s]*?" href="([^"]+)/;
            showtime.trace("play: Trying to regex httpGet: " + BASE_URL + url + '?ajax&folder=0');
            m = re.exec(showtime.httpGet(BASE_URL + url + '?ajax&folder=0'));
            showtime.trace("play: Done trying regexing httpGet: " + BASE_URL + url + '?ajax&folder=0');
        }
        if (m) {
            showtime.trace("play: Trying to play the link: " + m[1]);
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                canonicalUrl: PREFIX + ":play:" + origURL,
                sources: [{
                    url: m[1]
                }]
            });
            showtime.trace("play: Done playing the link: " + m[1]);
        };
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":start", startPage);

    plugin.addSearcher("fs.ua", logo,

    function(page, query) {
        try {
            var url = BASE_URL + "/search.aspx?search=" + escape(query.replace(/\s/g, '\+'));
            var p = 0;
            setPageHeader(page, '');

            function loader() {
                var response = showtime.httpGet(unescape(url) + "&page=" + p);
                var re = /class="selected">([\S\s]*?)\</;
                var match = re.exec(response);
                if (match) if (page.metadata) page.metadata.title = match[1];
                //1-link 2-title 3-image 
                re = /class="image-wrap">[\S\s]*?\<a href="([^"]+)" title="([^"]+)"><img src="([^"]+)/g;
                match = re.exec(response);
                while (match) {
                    page.appendItem(PREFIX + ":listRoot:" + escape(match[1]) + ":" + escape(match[2]), "video", {
                        title: new showtime.RichText(match[2]),
                        icon: match[3]
                    });
                    page.entries++;
                    match = re.exec(response);
                }
                p++;
                var re = /<b>Следующая страница<\/b>/;
                if (!re.exec(response)) return false
                return true;
            }
            loader();
            page.loading = false;
            page.paginator = loader;

        } catch (err) {
            showtime.trace('FS.UA - Ошибка поиска: ' + err)
        }
    });

})(this);
