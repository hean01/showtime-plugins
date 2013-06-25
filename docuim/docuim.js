/**
 * Docu.im plugin for Showtime
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
    }

    function trim(s) {
        s = s.replace(/(\r\n|\n|\r)/gm, "");
        s = s.replace(/(^\s*)|(\s*$)/gi, "");
        s = s.replace(/[ ]{2,}/gi, " ");
        return s;
    }

    function titleJoin(title1, title2) {
        if ((title1 == title2) || (trim(title2) == '')) return title1;
        else return title1 + " / " + title2;
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

    var service = plugin.createService("Docu.im", PREFIX + ":start", "video", true, logo);

    function startPage(page) {
        setPageHeader(page, 'Docu.im - Документальные фильмы онлайн');
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
        var response = showtime.httpGet(BASE_URL);
        page.loading = false;
        // 1 - poster, 2 - likes, 3 - views, 4 - comments, 5 - link, 6 - title, 7 - altTitle, 8 - year, 9 - description 
        var re = /<div class='movie full clearfix'>[\S\s]*?src="(.*?)"[\S\s]*?title='Рейтинг'><\/i>(.*?)<span[\S\s]*?title='Просмотров'><\/i>(.*?)<span[\S\s]*?title='Комментариев'><\/i>(.*?)<\/div>[\S\s]*?<a href='(.*?)'>([\S\s]*?)<\/a>[\S\s]*?<a href='.*?'>([\S\s]*?)<\/a>[\S\s]*?class='heading'>Год : <\/span> <span><a href='.*?'>(.*?)<\/a>[\S\s]*?<span class='heading'>([\S\s]*?)<\/div>/g;
        var match = re.exec(response);
        while (match) {
            page.appendItem(PREFIX + ':index:' + escape(match[5]) + ':' + escape(titleJoin(match[6], match[7])), 'video', {
                title: new showtime.RichText(titleJoin(match[6], match[7])),
                year: +match[8],
                icon: match[1],
                description: new showtime.RichText('Рейтинг: ' + blueStr(trim(match[2])) + ' Просмотров: ' + blueStr(trim(match[3])) + ' Комментариев: ' + blueStr(trim(match[4])) + '\n' + showtime.entityDecode(showtime.entityDecode(match[9])).replace(/<br \/>\s+/gm, '\n'))
            });
            match = re.exec(response);
        };

        page.appendItem("", "separator", {
            title: 'Рекомендуемое:'
        });
        // 1 - poster, 2 - link, 3 - title, 4 - altTitle
        re = /<img class='announce-img' src='(.*?)'[\S\s]*?<a href='(.*?)'>([\S\s]*?)<\/a>[\S\s]*?<a href='.*?'>([\S\s]*?)<\/a>/g;
        match = re.exec(response);
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
        // 1 - poster, 2 - likes, 3 - views, 4 - comments, 5 - link, 6 - title
        re = /<div class='movie thumb medium'>[\S\s]*?src="(.*?)"[\S\s]*?title='Рейтинг'><\/i>(.*?)<span[\S\s]*?title='Просмотров'><\/i>(.*?)<span[\S\s]*?title='Комментариев'><\/i>(.*?)<\/div>[\S\s]*?<a href='(.*?)' title='([\S\s]*?)'>/g;
        match = re.exec(response);
        while (match) {
            page.appendItem(PREFIX + ':index:' + escape(match[5]) + ':' + escape(match[6]), 'video', {
                title: new showtime.RichText(match[6]),
                icon: match[1],
                description: new showtime.RichText('Рейтинг: ' + blueStr(trim(match[2])) + ' Просмотров: ' + blueStr(trim(match[3])) + ' Комментариев: ' + blueStr(trim(match[4])))
            });
            match = re.exec(response);
        };
        page.appendItem("", "separator", {
            title: 'Смотрите также:'
        });
        re = /<ul id='carousel'>([\S\s]*?)<\/ul>/;
        response = re.exec(response)[1];
        // 1 - link, 2 - poster, 3 - title
        re = /<a href='(.*?)'[\S\s]*?<img src="(.*?)" alt="" \/>([\S\s]*?)<\/a>/g;
        match = re.exec(response);
        while (match) {
            page.appendItem(PREFIX + ':index:' + escape(match[1]) + ':' + escape(trim(match[3])), 'video', {
                title: new showtime.RichText(trim(match[3])),
                icon: match[2]
            });
            match = re.exec(response);
        };
    };

    // Index best
    plugin.addURI(PREFIX + ":best", function(page) {
        setPageHeader(page, 'Docu.im - Лучшее');
        var response = showtime.httpGet(BASE_URL + '/best');
        page.loading = false;
        page.appendItem("", "separator", {
            title: 'Лучшие фильмы:'
        });

        // 1 - poster, 2 - likes, 3 - views, 4 - comments, 5 - link, 6 - title
        var re = /<div class='movie thumb medium'>[\S\s]*?src="(.*?)"[\S\s]*?title='Рейтинг'><\/i>(.*?)<span[\S\s]*?title='Просмотров'><\/i>(.*?)<span[\S\s]*?title='Комментариев'><\/i>(.*?)<\/div>[\S\s]*?<a href='(.*?)' title='([\S\s]*?)'>/g;
        var match = re.exec(response);
        var counter = 0;
        while (match) {
            page.appendItem(PREFIX + ':index:' + escape(match[5]) + ':' + escape(match[6]), 'video', {
                title: new showtime.RichText(match[6]),
                icon: match[1],
                description: new showtime.RichText('Рейтинг: ' + blueStr(trim(match[2])) + ' Просмотров: ' + blueStr(trim(match[3])) + ' Комментариев: ' + blueStr(trim(match[4])))
            });
            match = re.exec(response);
            counter++;
            if (counter == 20) {
                page.appendItem("", "separator", {
                    title: 'Лучшие сериалы:'
                });
            };
        };
    });

    // Index page
    plugin.addURI(PREFIX + ":indexPage:(.*)", function(page, url) {
        setPageHeader(page, 'Docu.im - Фильмы и сериалы которые смотрят сейчас');
        var response = showtime.httpGet(BASE_URL + url);
        var re = /<title>(.*?)<\/title>/;
        setPageHeader(page, re.exec(response)[1]);
        page.loading = false;
        var pageNum = 2,
            done = false;

        function loader() {
            if (done) return false;
            // 1 - poster, 2 - likes, 3 - views, 4 - comments, 5 - link, 6 - title, 7 - altTitle, 8 - year, 9 - description 
            var re = /<div class='movie full clearfix'>[\S\s]*?src="(.*?)"[\S\s]*?title='Рейтинг'><\/i>(.*?)<span[\S\s]*?title='Просмотров'><\/i>(.*?)<span[\S\s]*?title='Комментариев'><\/i>(.*?)<\/div>[\S\s]*?<a href='(.*?)'>([\S\s]*?)<\/a>[\S\s]*?<a href='.*?'>([\S\s]*?)<\/a>[\S\s]*?class='heading'>Год : <\/span> <span><a href='.*?'>(.*?)<\/a>[\S\s]*?<span class='heading'>([\S\s]*?)<\/div>/g;
            var match = re.exec(response);
            while (match) {
                page.appendItem(PREFIX + ':index:' + escape(match[5]) + ':' + escape(titleJoin(match[6], match[7])), 'video', {
                    title: new showtime.RichText(titleJoin(match[6], match[7])),
                    year: +match[8],
                    icon: match[1],
                    description: new showtime.RichText('Рейтинг: ' + blueStr(trim(match[2])) + ' Просмотров: ' + blueStr(trim(match[3])) + ' Комментариев: ' + blueStr(trim(match[4])) + '\n' + showtime.entityDecode(showtime.entityDecode(match[9])).replace(/<br \/>\s+/gm, '\n'))
                });
                match = re.exec(response);
            };
            re = /<li class="last hidden">/;
            match = re.exec(response);
            if (match) {
                done = true;
                return false;
            }
            response = showtime.httpGet(BASE_URL + url + '/page/' + pageNum);
            pageNum++;
            return true;
        };
        loader();
        page.paginator = loader;
    });

    // Index nowplay
    plugin.addURI(PREFIX + ":nowplay", function(page) {
        setPageHeader(page, 'Docu.im - Фильмы и сериалы которые смотрят сейчас');
        var response = showtime.httpGet(BASE_URL + '/nowplay');
        page.loading = false;
        // 1 - poster, 2 - likes, 3 - views, 4 - comments, 5 - link, 6 - title
        var re = /<div class='movie thumb small'>[\S\s]*?src="(.*?)"[\S\s]*?title='Рейтинг'><\/i>(.*?)<span[\S\s]*?title='Просмотров'><\/i>(.*?)<span[\S\s]*?title='Комментариев'><\/i>(.*?)<\/div>[\S\s]*?<a href='(.*?)' title='([\S\s]*?)'>/g;
        var match = re.exec(response);
        while (match) {
            page.appendItem(PREFIX + ':index:' + escape(match[5]) + ':' + escape(match[6]), 'video', {
                title: new showtime.RichText(match[6]),
                icon: match[1],
                description: new showtime.RichText('Рейтинг: ' + blueStr(trim(match[2])) + ' Просмотров: ' + blueStr(trim(match[3])) + ' Комментариев: ' + blueStr(trim(match[4])))
            });
            match = re.exec(response);
        };
    });

    // Index links
    plugin.addURI(PREFIX + ":index:(.*):(.*)", function(page, url, title) {
        setPageHeader(page, unescape(title));
        var response = showtime.httpGet(BASE_URL + unescape(url));
        // 1 - poster, 2 - likes, 3 - views, 4 - comments, 5 - link, 6 - title, 7 - altTitle, 8 - year, 9 - description 
        var re = /<div class='movie full clearfix'>[\S\s]*?src="(.*?)"[\S\s]*?title='Рейтинг'><\/i>(.*?)<span[\S\s]*?title='Просмотров'><\/i>(.*?)<span[\S\s]*?title='Комментариев'><\/i>(.*?)<\/div>[\S\s]*?<a href='(.*?)'>([\S\s]*?)<\/a>[\S\s]*?<a href='.*?'>([\S\s]*?)<\/a>[\S\s]*?class='heading'>Год : <\/span> <span><a href='.*?'>(.*?)<\/a>[\S\s]*?<span class='heading'>([\S\s]*?)<\/div>/;
        var match = re.exec(response);
        var year = +match[8];
        var icon = match[1];
        var description = new showtime.RichText('Рейтинг: ' + blueStr(trim(match[2])) + ' Просмотров: ' + blueStr(trim(match[3])) + ' Комментариев: ' + blueStr(trim(match[4])) + '\n' + showtime.entityDecode(showtime.entityDecode(match[9])).replace(/<br \/>\s+/gm, '\n'));
        var re = /[\S\s]*?([\d+^\?]+)/i;
        var movieID = re.exec(unescape(url))[1];
        re = /<div id='season-switch-items'>/;
        if (re.exec(response)) { // serials
            re = /<a class='season'>([\S\s]*?)<\/a>/g;
            match = re.exec(response);

            var season = 1;
            while (match) {
                var seasonName = match[1];
                var json = showtime.JSONDecode(unhash(showtime.httpGet(BASE_URL + '/movie/player/' + movieID + '/playlist.txt?season=' + season)));
                var re2 = /aindex={(.*?)}/;
                if (json.playlist[0] == null) {
                    page.error("Видео временно не доступно");
                    return;
                };

                var tracks = re2.exec(json.playlist[0].file)[1].split(';');
                for (i in tracks) {
                    if (trim(tracks[i]) == '') continue;
                    page.appendItem("", "separator", {
                        title: 'Soundtrack ' + i
                    });
                    for (n in json.playlist) {
                        re2 = /\[(.*?)\]/;
                        var links = re2.exec(json.playlist[n].file)[1].split(',');
                        var link = links[0];
                        if (trim(links[i]) != '') link = links[i];
                        var videoparams = {
                            sources: [{
                                url: json.playlist[n].file.replace(/\[(.*?)\]/, link).replace(/aindex={(.*?)}/, "aindex=" + tracks[i])
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
            var json = showtime.JSONDecode(unhash(showtime.httpGet(BASE_URL + '/movie/player/' + movieID + '/playlist.txt?season=1')));
            re = /aindex={(.*?)}/;
            var tracks = re.exec(json.playlist[0].file)[1].split(';');
            re = /\[(.*?)\]/;
            var links = re.exec(json.playlist[0].file)[1].split(',');
            var link = links[0];
            for (i in tracks) {
                if (trim(tracks[i]) == "") continue;
                page.appendItem("", "separator", {
                    title: 'Soundtrack ' + i
                });
                if (trim(links[i]) != '') link = links[i];
                var videoparams = {
                    sources: [{
                        url: json.playlist[0].file.replace(/\[(.*?)\]/, link).replace(/aindex={(.*?)}/, "aindex=" + tracks[i])
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

    plugin.addURI(PREFIX + ":start", startPage);

    plugin.addSearcher("Docu.im", logo,

    function(page, query) {
        var pageNum = 1,
            done = false;

        function loader() {
            if (done) return false;
            var response = showtime.JSONDecode(showtime.httpPost(BASE_URL + '/search/result', {
                'viewAs': 'list',
                'p': pageNum,
                'f': '{"title":"' + query + '","genres":[],"directors":[],"actors":[],"countries":[],"studios":[]}'
            }, "", {
                'X-Requested-With': 'XMLHttpRequest'
            }));
            for (var i in response.items) {
                // 1 - poster, 2 - likes, 3 - views, 4 - comments, 5 - link, 6 - title, 7 - altTitle, 8 - year, 9 - description 
                var re = /<div class='movie full clearfix'>[\S\s]*?src="(.*?)"[\S\s]*?title='Рейтинг'><\/i>(.*?)<span[\S\s]*?title='Просмотров'><\/i>(.*?)<span[\S\s]*?title='Комментариев'><\/i>(.*?)<\/div>[\S\s]*?<a href='(.*?)'>([\S\s]*?)<\/a>[\S\s]*?<a href='.*?'>([\S\s]*?)<\/a>[\S\s]*?class='heading'>Год : <\/span> <span><a href='.*?'>(.*?)<\/a>[\S\s]*?<span class='heading'>([\S\s]*?)<\/div>/;
                var match = re.exec(response.items[i].html);
                if (match) {
                    page.appendItem(PREFIX + ':index:' + escape(match[5]) + ':' + escape(titleJoin(match[6], match[7])), 'video', {
                        title: new showtime.RichText(titleJoin(match[6], match[7])),
                        year: +match[8],
                        icon: match[1],
                        description: new showtime.RichText('Рейтинг: ' + blueStr(trim(match[2])) + ' Просмотров: ' + blueStr(trim(match[3])) + ' Комментариев: ' + blueStr(trim(match[4])) + '\n' + showtime.entityDecode(showtime.entityDecode(match[9])).replace(/<br \/>\s+/gm, '\n'))
                    });
                    page.entries++;
                };
            };
            if (response.pagination.totalPages == pageNum) {
                done = 1;
                return false;
            }
            pageNum++;
            return true;
        };
        loader();
        page.loading = false;
        page.paginator = loader;
    });
})(this);
