/**
 * uletfilm.net plugin for Showtime
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

    var PREFIX = 'uletfilm';
    var BASE_URL = 'http://uletfilm.net';

    var logo = plugin.path + "logo.png";

    function base64_decode(data) {
        // http://kevin.vanzonneveld.net
        // +   original by: Tyler Akins (http://rumkin.com)
        // +   improved by: Thunder.m
        // +      input by: Aman Gupta
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   bugfixed by: Onno Marsman
        // +   bugfixed by: Pellentesque Malesuada
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +      input by: Brett Zamir (http://brett-zamir.me)
        // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // *     example 1: base64_decode('S2V2aW4gdmFuIFpvbm5ldmVsZA==');
        // *     returns 1: 'Kevin van Zonneveld'
        // mozilla has this native
        // - but breaks in 2.0.0.12!
        //if (typeof this.window['atob'] == 'function') {
        //    return atob(data);
        //}
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

    function unicode2win1251(str) {
        if (str == 0) return 0;
        var result = "";
        var uniCode = 0;
        var winCode = 0;
        for (var i = 0; i < str.length; i++) {
            uniCode = str.charCodeAt(i);
            if (uniCode == 1105) {
                winCode = 184;
            } else if (uniCode == 1025) {
                winCode = 168;
            } else if (uniCode > 1039 && uniCode < 1104) {
                winCode = uniCode - 848;
            } else {
                winCode = uniCode;
            }
            result += String.fromCharCode(winCode);
        }
        var encoded = "";
        for (var i = 0; i < result.length; ++i) {
            var code = Number(result.charCodeAt(i));
            encoded += "%" + code.toString(16).toUpperCase();
        }
        return encoded;
    }

    function blueStr(str) {
        return '<font color="6699CC"> (' + str + ')</font>';
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

    var service = plugin.createService("uletfilm.net", PREFIX + ":start", "video", true, logo);

    function startPage(page) {
        setPageHeader(page, 'uletfilm.net - Улетный кинотеатр');

        // Popular on the site
        var response = showtime.httpGet(BASE_URL);
        var re = /class="topnews">([\S\s]*?)<\/ul>/;
        var htmlBlob = re.exec(response);
        if (htmlBlob) {
            htmlBlob = htmlBlob[0];
            page.appendItem("", "separator", {
                title: 'Топ сайта:'
            });
            // 1 - title, 2 - link, 3 - image
            re = /<li><h2>(.*?)<\/h2><a href="(.*?)" title=".*?"><img src="(.*?)"/g;
            var match = re.exec(htmlBlob);
            while (match) {
                page.appendItem(PREFIX + ':video:' + match[2] + ':' + escape(match[1]), 'video', {
                    title: new showtime.RichText(match[1]),
                    icon: BASE_URL + match[3]
                });
                match = re.exec(htmlBlob);
            }
        };

        // Genres
        var re = /class="orangemenu">([\s\S]*?)<\/tr>/;
        var htmlBlob = re.exec(response);
        if (htmlBlob) {
            htmlBlob = htmlBlob[0];
            page.appendItem("", "separator", {
                title: 'HD фильмы по жанрам'
            });
            re = /<li><a href="(.*?)">(.*?)<\/a>/g;
            var match = re.exec(htmlBlob);
            while (match) {
                page.appendItem(PREFIX + ':index:' + match[1] + ':' + match[2], 'directory', {
                    title: match[2],
                    icon: logo
                });
                match = re.exec(htmlBlob);
            }
        }

        page.appendItem("", "separator", {
            title: 'Все HD фильмы онлайн:'
        });

        function loader() {
            // 1 - link, 2 - title, 3 - image, 4 - views, 5 - description
            re = /class="roltitle">[\S\s]*?<a href="([^"]+)">([\S\s]*?)<\/a>[\S\s]*?<img src="([\S\s]*?)"[\S\s]*?align="absmiddle"> (\d+)[\S\s]*?class="storyinfo"[\S\s]*?<tr>([\S\s]*?)<\/div></g;
            match = re.exec(response);
            while (match) {
                page.appendItem(PREFIX + ':video:' + escape(match[1]) + ':' + escape(match[2]), 'video', {
                    title: new showtime.RichText(match[2] + blueStr(match[4])),
                    icon: BASE_URL + match[3],
                    description: new showtime.RichText(match[5])
                });
                match = re.exec(response);
            }
            re = /<a href="([^"]+)">Далее<\/a>/;
            match = re.exec(response);
            if (!match) return false;
            response = showtime.httpGet(match[1]);
            return true;
        };
        loader();
        page.loading = false;
        page.paginator = loader;
    };

    // Indexes page
    plugin.addURI(PREFIX + ":index:(.*):(.*)", function(page, url, title) {
        setPageHeader(page, title);
        var response = showtime.httpGet(BASE_URL + url);

        function loader() {
            // 1 - link, 2 - title, 3 - image, 4 - views, 5 - description
            var re = /class="roltitle">[\S\s]*?<a href="([^"]+)">([\S\s]*?)<\/a>[\S\s]*?<img src="([\S\s]*?)"[\S\s]*?align="absmiddle"> (\d+)[\S\s]*?class="storyinfo"[\S\s]*?<tr>([\S\s]*?)<\/div></g;
            var match = re.exec(response);
            while (match) {
                page.appendItem(PREFIX + ':video:' + escape(match[1]) + ':' + escape(match[2]), 'video', {
                    title: new showtime.RichText(match[2] + blueStr(match[4])),
                    icon: BASE_URL + match[3],
                    description: new showtime.RichText(match[5])
                });
                match = re.exec(response);
            }
            re = /<a href="([^"]+)">Далее<\/a>/;
            match = re.exec(response);
            if (!match) return false;
            response = showtime.httpGet(match[1]);
            return true;
        };
        loader();
        page.loading = false;
        page.paginator = loader;
    });

    function unhash(hash) {
        var hash1 = "QWXBMI52cxps6Rk0Hzlb431t8=";
        var hash2 = "yaV9LwniuvZ7GYmJDdTgfoNUeq";
        for (var i = 0; i < hash1.length; i++) {
            hash = hash.split(hash1[i]).join('--');
            hash = hash.split(hash2[i]).join(hash1[i]);
            hash = hash.split('--').join(hash2[i]);
        }
        return base64_decode(hash);
    }

    // Play uletfilm links
    plugin.addURI(PREFIX + ":video:(.*):(.*)", function(page, url, title) {
        var response = showtime.httpGet(unescape(url));
        var re = /"file":"(.*?)"/;
        response = re.exec(response);
        showtime.print(response[1]);
        if (response) response = unhash(response[1]);
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            canonicalUrl: PREFIX + ":video:" + url,
            sources: [{
                url: response
            }]
        });
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":start", startPage);

    plugin.addSearcher("uletfilm.net", logo,

    function(page, query) {
        try {
            setPageHeader(page, 'uletfilm.info - ' + query);
            var response = showtime.httpGet(BASE_URL + '/?do=search&subaction=search&story=' + unicode2win1251(query));

            var counter = 0;

            function loader() {
                if (counter) return false;
                // 1 - image, 2 - description, 3 - link, 4 - title
                var re = /<img src="([\S\s]*?)" [\S\s]*?class="quote">[\S\s]*?<div id='[\S\s]*?'>([\S\s]*?)<\/div>[\S\s]*?class="roltitle"><br \/><a href="([\S\s]*?)" > ([\S\s]*?)<\/a>/g;
                var match = re.exec(response);
                while (match) {
                    page.appendItem(PREFIX + ':video:' + escape(match[3]) + ':' + escape(match[4]), 'video', {
                        title: new showtime.RichText(match[4]),
                        icon: BASE_URL + match[1],
                        description: new showtime.RichText(match[2])
                    });
                    page.entries++;
                    match = re.exec(response);
                }
                re = /<a href="([^"]+)">Далее<\/a>/;
                match = re.exec(response);
                if (!match) {
                    counter = 1;
                    return false;
                }
                response = showtime.httpGet(match[1]);
                return true;

            };
            loader();
            page.loading = false;
            page.paginator = loader;

        } catch (err) {
            showtime.trace('uletfilm.info - Ошибка поиска: ' + err)
        }
    });

})(this);
