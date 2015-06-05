/**
 * Docu.im plugin for Movian Media Center
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
    var PREFIX = 'docuim';
    var BASE_URL = 'http://docu.im';
    var logo = plugin.path + "logo.png";

    function base64_decode(data) { // http://kevin.vanzonneveld.net
        var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
            ac = 0,
            dec = "",
            tmp_arr = [];
        if (!data) {
            return data;
        }
        data += '';
        do { // unpack four hexets into three octets using index points in b64
            h1 = b64.indexOf(data.charAt(i++));
            h2 = b64.indexOf(data.charAt(i++));
            h3 = b64.indexOf(data.charAt(i++));
            h4 = b64.indexOf(data.charAt(i++));
            bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;
            o1 = bits >> 16 & 0xff;
            o2 = bits >> 8 & 0xff;
            o3 = bits & 0xff;
            if (h3 == 64) {
                tmp_arr[ac++] = String.fromCharCode(o1);
            } else if (h4 == 64) {
                tmp_arr[ac++] = String.fromCharCode(o1, o2);
            } else {
                tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
            }
        } while (i < data.length);
        dec = tmp_arr.join('');
        return dec;
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

    function trim(s) {
        return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ").replace(/\t/g, ' ');
    }

    var blue = '6699CC', orange = 'FFA500', red = 'EE0000', green = '008B45';

    function colorStr(str, color) {
        return '<font color="' + color + '"> (' + str + ')</font>';
    }

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    function titleJoin(title1, title2) {
        if ((title1 == title2) || (trim(title2) == '')) return title1;
        else return title1 + " | " + title2;
    }

    function unhash(hash) {
        hash = "" + hash;
        var hash1 = "Zv6WmygXboVdktMQu5DeJszfL=",
            hash2 = "aG9w1NlTIR72nB4H3U0pYcix8q";
        for (var i = 0; i < hash1.length; i++) {
            hash = hash.split(hash1[i]).join('--');
            hash = hash.split(hash2[i]).join(hash1[i]);
            hash = hash.split('--').join(hash2[i]);
        }
        //showtime.print(base64_decode(hash));
        return base64_decode(hash);
    }

    var service = plugin.createService(plugin.getDescriptor().title, PREFIX + ":start", "video", true, logo);

    // Index best
    plugin.addURI(PREFIX + ":best", function(page) {
        setPageHeader(page, plugin.getDescriptor().title + ' - Лучшее');
        page.loading = true;
        var response = showtime.httpReq(BASE_URL + '/best');
        page.loading = false;
        addNews(page, response);
    });

    // Index new
    plugin.addURI(PREFIX + ":latest", function(page) {
        setPageHeader(page, plugin.getDescriptor().title + ' - Новинки');
        page.loading = true;
        var response = showtime.httpReq(BASE_URL + '/latest');
        page.loading = false;
        addNews(page, response);
    });

    // Index page
    plugin.addURI(PREFIX + ":indexPage:(.*)", function(page, url) {
        var response = showtime.httpReq(BASE_URL + url) + '';
        setPageHeader(page, response.match(/<title>(.*?)<\/title>/)[1]);

        var fromPage = 2, tryToSearch = true;

        function loader() {
            if (!tryToSearch) return false;
            addItems(page, response);
            if (response.match(/<li class="last hidden">/)) return tryToSearch = false;
            page.loading = true;
            response = showtime.httpReq(BASE_URL + url + '/page/' + fromPage++) + '';
            page.loading = false;
            return true;
        };
        loader();
        page.paginator = loader;
    });

    // Index nowplay
    plugin.addURI(PREFIX + ":nowplay", function(page) {
        setPageHeader(page, plugin.getDescriptor().title + ' - Фильмы и сериалы которые смотрят сейчас');
        page.loading = true;
        var response = showtime.httpReq(BASE_URL + '/nowplay');
        page.loading = false;
        // 1 - poster, 2 - likes, 3 - views, 4 - comments, 5 - link, 6 - title
        var re = /<div class='movie thumb small'>[\S\s]*?src="(.*?)"[\S\s]*?title='Рейтинг'><\/i>(.*?)<span[\S\s]*?title='Просмотров'><\/i>(.*?)<span[\S\s]*?title='Комментариев'><\/i>(.*?)<\/div>[\S\s]*?<a href='(.*?)' title='([\S\s]*?)'>/g;
        var match = re.exec(response);
        while (match) {
            page.appendItem(PREFIX + ':index:' + escape(match[5]) + ':' + escape(match[6]), 'video', {
                title: new showtime.RichText(match[6]),
                icon: match[1],
                description: new showtime.RichText(coloredStr('Рейтинг: ', orange) + trim(match[2]) +
                    coloredStr(' Просмотров: ', orange) + trim(match[3]) +
                    coloredStr(' Комментариев: ', orange) + trim(match[4]))
            });
            match = re.exec(response);
        };
    });

    // 1-icon, 2-rating, 3-views, 4-comments, 5-link, 6-title, 7-orig_title, 8-year, 9-description
    var rgex = /<div class='movie full clearfix'>[\S\s]*?src="(.*?)"[\S\s]*?title='Рейтинг'><\/i>(.*?)<span[\S\s]*?title='Просмотров'><\/i>(.*?)<span[\S\s]*?title='Комментариев'><\/i>(.*?)<\/div>[\S\s]*?<a href='(.*?)'>([\S\s]*?)<\/a>[\S\s]*?<a href='.*?'>([\S\s]*?)<\/a>[\S\s]*?class='heading'>Год : <\/span> <span><a href='.*?'>(.*?)<\/a>([\S\s]*?)<\/div>/g;

    // Index links
    plugin.addURI(PREFIX + ":index:(.*):(.*)", function(page, url, title) {
        setPageHeader(page, unescape(title));
        page.loading = true;
        showtime.print(BASE_URL + unescape(url));
        var response = showtime.httpReq(BASE_URL + unescape(url)).toString();
        page.loading = false;

        var match = rgex.exec(response);
        if (!match) // retry
            match = rgex.exec(response);
        var year = +match[8];
        var icon = match[1];
        var description = new showtime.RichText(getDescription(match));
        var movieID = unescape(url).match(/[\S\s]*?([\d+^\?]+)/i)[1];
        if (showtime.entityDecode(response).match(/<div id='season-switch-items'>/)) { // serials
            var re = /<a class='season'>([\S\s]*?)<\/a>/g;
            match = re.exec(response);

            var season = 1;
            while (match) {
                var seasonName = match[1];
                page.loading = true;
                var json = showtime.JSONDecode(unhash(showtime.httpReq(BASE_URL + '/movie/player/' + movieID + '/playlist.txt?season=' + season)));
                page.loading = false;
                var re2 = /audioIndex=\{(.*?)\}/;
                if (json.playlist[0] == null) {
                    page.error("Видео временно не доступно");
                    return;
                };

                var tracks = re2.exec(json.playlist[0].file)[1].split(';');
                for (i in tracks) {
                    if (trim(tracks[i]) == '') continue;
                    page.appendItem("", "separator", {
                        title: 'Аудиодорожка ' + i
                    });
                    for (n in json.playlist) {
                        re2 = /\[(.*?)\]/;
                        var links = re2.exec(json.playlist[n].file);
                        if (links)
                            links = links[1].split(',')
                        else
                            links = json.playlist[n].file;
                        var link = links[0];
                        if (trim(links[i]) != '') link = links[i];
                        var videoparams = {
                            sources: [{
                                url: json.playlist[n].file.replace(/\[(.*?)\]/, link).replace(/audioIndex=\{(.*?)\}/, "audioIndex=" + tracks[i])
                            }],
                            title: seasonName + ' - ' + json.playlist[n].comment,
                            canonicalUrl: PREFIX + ':index:' + url + ':' + title + ':' + json.playlist[n].id + ':' + i,
                            subtitles: []
                        };
                        if (json.playlist[n].sub) {
                            videoparams.subtitles.push({
                                url: BASE_URL + json.playlist[n].sub,
                                language: 'Русский'
                            });
                        };
                        var v = "videoparams:" + showtime.JSONEncode(videoparams);
                        page.appendItem(v, 'video', {
                            title: new showtime.RichText(seasonName + ' - ' + json.playlist[n].comment),
                            year: year,
                            description: description,
                            icon: icon
                        });
                    };
                };
                match = re.exec(response);
                season++;
            }
        } else { // movies
            page.loading = true;
            var json = showtime.JSONDecode(unhash(showtime.httpReq(BASE_URL + '/movie/player/' + movieID + '/playlist.txt?season=1')));
            page.loading = false;
            re = /audioIndex=\{(.*?)\}/;
            var tracks = re.exec(json.playlist[0].file)[1].split(';');
            re = /\[(.*?)\]/;
            var links = re.exec(json.playlist[0].file);
            if (links)
                links = links[1].split(',')
            else
                links = json.playlist[0].file;
            var link = links[0];
            for (i in tracks) {
                if (trim(tracks[i]) == "") continue;
                page.appendItem("", "separator", {
                    title: 'Аудиодорожка ' + i
                });
                if (trim(links[i]) != '') link = links[i];
                var hls = json.playlist[0].file.replace(/\[(.*?)\]/, link).replace(/audioIndex=\{(.*?)\}/, "audioIndex=" + tracks[i]);
                var videoparams = {
                    sources: [{
                        url: hls.match('m3u8') ? 'hls:' + hls : hls
                    }],
                    title: unescape(title),
                    canonicalUrl: PREFIX + ':index:' + url + ':' + title + ':' + json.playlist[0].id + ':' + i,
                    subtitles: []
                };
                if (json.playlist[0].sub) {
                    videoparams.subtitles.push({
                        url: BASE_URL + json.playlist[0].sub,
                        language: 'Русский'
                    });
                };
                var v = "videoparams:" + showtime.JSONEncode(videoparams);

                page.appendItem(v, 'video', {
                    title: new showtime.RichText(unescape(title)),
                    year: year,
                    description: description,
                    icon: icon
                });
            };
        };
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":start", function(page) {
        setPageHeader(page, plugin.getDescriptor().synopsis);
        page.appendItem(PREFIX + ':latest', 'directory', {
            title: 'Новинки',
            icon: logo
        });
        page.appendItem(PREFIX + ':indexPage:/movies', 'directory', {
            title: 'Фильмы',
            icon: logo
        });
        page.appendItem(PREFIX + ':indexPage:/serials', 'directory', {
            title: 'Сериалы',
            icon: logo
        });
        page.appendItem(PREFIX + ':best', 'directory', {
            title: 'Лучшее',
            icon: logo
        });
        page.appendItem(PREFIX + ':nowplay', 'directory', {
            title: 'Сейчас смотрят',
            icon: logo
        });
        page.appendItem("", "separator", {
            title: 'Сейчас смотрят:'
        });
        page.loading = true;
        var response = showtime.httpReq(BASE_URL).toString();
        page.loading = false;
        addItems(page, response);

        page.appendItem("", "separator", {
            title: 'Рекомендуемое:'
        });
        // 1 - poster, 2 - link, 3 - title, 4 - altTitle
        var re = /<img class='announce-img' src='(.*?)'[\S\s]*?<a href='(.*?)'>([\S\s]*?)<\/a>[\S\s]*?<a href='.*?'>([\S\s]*?)<\/a>/g;
        var match = re.exec(response);
        while (match) {
            page.appendItem(PREFIX + ':index:' + escape(match[2]) + ':' + escape(titleJoin(match[3], match[4])), 'video', {
                title: new showtime.RichText(titleJoin(match[3], match[4])),
                icon: BASE_URL + match[1]
            });
            match = re.exec(response);
        };

        page.appendItem("", "separator", {
            title: 'Новинки фильмов и сериалов:'
        });
        addNews(page, response);

        response = response.match(/<ul id='carousel'>([\S\s]*?)<\/ul>/);
        if (response) {
            response = response[1];
            var first = true;
            // 1 - link, 2 - poster, 3 - title
            re = /<a href='(.*?)'[\S\s]*?<img src="(.*?)" alt="" \/>([\S\s]*?)<\/a>/g;
            match = re.exec(response);
            while (match) {
                if (first) {
                    page.appendItem("", "separator", {
                        title: 'Смотрите также:'
                    });
                    first =false;
                }
                page.appendItem(PREFIX + ':index:' + escape(match[1]) + ':' + escape(trim(match[3])), 'video', {
                    title: new showtime.RichText(trim(match[3])),
                    icon: match[2]
                });
                match = re.exec(response);
            };
        }
    });

    function addNews(page, blob) {
        // 1 - poster, 2 - likes, 3 - views, 4 - comments, 5 - link, 6 - title
        var re = /<div class='movie thumb medium'>[\S\s]*?src="(.*?)"[\S\s]*?title='Рейтинг'><\/i>(.*?)<span[\S\s]*?title='Просмотров'><\/i>(.*?)<span[\S\s]*?title='Комментариев'><\/i>(.*?)<\/div>[\S\s]*?<a href='(.*?)' title='([\S\s]*?)'>/g;
        var match = re.exec(blob);
        while (match) {
            page.appendItem(PREFIX + ':index:' + escape(match[5]) + ':' + escape(match[6]), 'video', {
                title: new showtime.RichText(match[6]),
                icon: match[1],
                description: new showtime.RichText(coloredStr('Рейтинг: ', orange) + trim(match[2]) +
                    coloredStr(' Просмотров: ', orange) + trim(match[3]) +
                    coloredStr(' Комментариев: ', orange) + trim(match[4]))
            });
            match = re.exec(blob);
        };
    };

    function getDescription(match) {
        return coloredStr('Рейтинг: ', orange) + trim(match[2]) +
            coloredStr(' Просмотров: ', orange) + trim(match[3]) +
            coloredStr(' Комментариев: ', orange) + trim(match[4]) + '\n' +
            trim(showtime.entityDecode(showtime.entityDecode(match[9])).replace(/<br \/>/g, '\n'));
    }

    function addItems(page, blob) {
        var match = rgex.exec(blob);
        if (!match) // retry
            match = rgex.exec(blob);

        while (match) {
            page.appendItem(PREFIX + ':index:' + escape(match[5]) + ':' + escape(titleJoin(match[6], match[7])), 'video', {
                title: new showtime.RichText(titleJoin(match[6], match[7])),
                icon: match[1],
                year: +match[8],
                description: new showtime.RichText(getDescription(match))
            });
            match = rgex.exec(blob);
            page.entries++;
        };
    }

    plugin.addSearcher(plugin.getDescriptor().title, logo, function(page, query) {
        page.entries = 0;
        var fromPage = 1, tryToSearch = true;

        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var response = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/search/result', {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                postdata: {
                    'viewAs': 'list',
                    'p': fromPage,
                    'f': '{"title":"' + query + '","genres":[],"directors":[],"actors":[],"countries":[],"studios":[]}'
                }
            }));
            page.loading = false;
            for (var i in response.items)
                addItems(page, response.items[i].html);
            if (response.pagination.totalPages == fromPage) return tryToSearch = false;
            fromPage++;
            return true;
        };
        loader();
        page.paginator = loader;
    });
})(this);