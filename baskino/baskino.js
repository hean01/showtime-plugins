/**
 * Baskino.com plugin for Showtime
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

    var PREFIX = 'baskino';
    var BASE_URL = 'http://baskino.com';
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

    function unhash(hash, hash1, hash2) {
        hash = "" + hash;
        for (var i = 0; i < hash1.length; i++) {
            hash = hash.split(hash1[i]).join('--');
            hash = hash.split(hash2[i]).join(hash1[i]);
            hash = hash.split('--').join(hash2[i]);
        }
        //showtime.print(base64_decode(hash));
        return base64_decode(hash);
    }

    const blue = "6699CC", orange = "FFA500";

    function colorStr(str, color) {
        return '<font color="' + color + '">(' + str + ')</font>';
    }

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    function getTimestamp(str) {
        if (!str) return 0;
        var d = str.match(/\d+/g); // extract date parts
        return +Date.UTC(d[2], d[1] - 1, d[0]) / 1000; // year, month, day
    }

    function setPageHeader(page, title) {
        page.loading = false;
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
    }

    function trim(s) {
        return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ");
    }

    var service = plugin.createService("Baskino.com", PREFIX + ":start", "video", true, logo);

    // Top-250
    plugin.addURI(PREFIX + ":top", function(page) {
        var response = showtime.httpReq(BASE_URL + '/top/').toString();
        setPageHeader(page, response.match(/<title>([\S\s]*?)<\/title>/)[1]);
        page.loading = false;
        response = response.match(/<ul class="content_list_top"[\S\s]*?<\/ul>/);
        // 1-link, 2-number, 3-title, 4-year, 5-rating
        var re = /<a href="([\S\s]*?)">[\S\s]*?<b>([\S\s]*?)<\/b>[\S\s]*?<s>([\S\s]*?)<\/s>[\S\s]*?<em>([\S\s]*?)<\/em>[\S\s]*?<u>([\S\s]*?)<\/u>/g;
        var match = re.exec(response);
        while (match) {
            page.appendItem(PREFIX + ':index:' + escape(match[1]), 'video', {
                title: new showtime.RichText(match[3] + ' ' + coloredStr(match[4], blue)),
                rating: match[5].replace(',', '.') * 10
            });
            match = re.exec(response);
        };
    });


    function scrapePageAtURL(page, url, titleIsSet) {
        var p = 1,
            tryToSearch = true;

        function loader() {
            if (!tryToSearch) return false;
            var response = showtime.httpReq(BASE_URL + url + "/page/" + p + "/").toString();
            if (!titleIsSet) {
                setPageHeader(page, response.match(/<title>(.*?)<\/title>/)[1]);
                titleIsSet = true;
            }
            // 1 - link, 2 - title, 3 - image, 4 - quality, 5 - quoted full title, 6 - raiting, 7 - number of comments, 8 - date added, 9 - production date
            var re = /<div class="postcover">[\S\s]*?<a href="([\S\s]*?)">[\S\s]*?<img title="([\S\s]*?)" src="([\S\s]*?)"[\S\s]*?class="quality_type ([\S\s]*?)">[\S\s]*?<div class="posttitle">[\S\s]*?">([\S\s]*?)<\/a>[\S\s]*?<li class="current-rating" style="[\S\s]*?">([\S\s]*?)<\/li>[\S\s]*?<!-- <div class="linline">([\S\s]*?)<\/div>[\S\s]*?<div class="linline">([\S\s]*?)<\/div>[\S\s]*?<div class="rinline">([\S\s]*?)<\/div>/g;
            var match = re.exec(response);
            while (match) {
                page.appendItem(PREFIX + ':index:' + escape(match[1]), 'video', {
                    title: new showtime.RichText(match[5] + ' ' + (match[4] == "quality_hd" ? colorStr("HD", blue) : colorStr("DVD", orange))),
                    rating: +(match[6]) / 2,
                    icon: match[3],
                    description: match[7] + '\n' + match[8] + '\n' + match[9].replace(/<span class="tvs_new">/, "").replace(/<\/span>/, "")
                });
                match = re.exec(response);
            };
            if (!response.match(/">Вперед<\/a>/)) tryToSearch = false;
            p++;
            return true;
        };
        loader();
        page.paginator = loader;
    };

    plugin.addURI(PREFIX + ":indexURL:(.*)", function(page, url) {
        scrapePageAtURL(page, url, false);
    });

    plugin.addURI(PREFIX + ":movies", function(page) {
        var response = showtime.httpReq(BASE_URL).toString();
        setPageHeader(page, response.match(/<title>([\S\s]*?)<\/title>/)[1]);
        response = response.match(/<ul class="sf-menu">([\s\S]*?)<\/ul>/)[1];
        var re = /<li><a href="([\s\S]*?)">([\s\S]*?)<\/a><\/li>/g;
        var match = re.exec(response);
        while (match) {
            page.appendItem(PREFIX + ":indexURL:" + match[1], 'directory', {
                title: match[2]
            });
            match = re.exec(response);
        };
    });

    function startPage(page) {
        var response = showtime.httpReq(BASE_URL).toString();
        setPageHeader(page, 'Baskino.com - Онлайн фильмы в HD качестве');

        page.appendItem(PREFIX + ':movies', 'directory', {
            title: 'Фильмы',
            icon: logo
        });
        page.appendItem(PREFIX + ':indexURL:/new', 'directory', {
            title: 'Новинки',
            icon: logo
        });
        page.appendItem(PREFIX + ':top', 'directory', {
            title: 'Топ-250',
            icon: logo
        });
        page.appendItem(PREFIX + ':indexURL:/serial', 'directory', {
            title: 'Сериалы',
            icon: logo
        });

        page.appendItem("", "separator", {
            title: 'Рекомендуемое:'
        });
        // 1 - link, 2 - title, 3 - image, 4 - regie
        var re = /<img  onclick=\(window.location.href='(.*?)'\); title="(.*?)"[\S\s]*?src="(.*?)"[\S\s]*?'\);>(.*?)<\/span>/g;
        var match = re.exec(response);
        while (match) {
            page.appendItem(PREFIX + ':index:' + escape(BASE_URL + match[1]), 'video', {
                title: new showtime.RichText(match[2]),
                icon: match[3],
                description: new showtime.RichText('Режиссер: ' + colorStr(match[4], blue))
            });
            match = re.exec(response);
        };

        page.appendItem("", "separator", {
            title: 'Новинки:'
        });
        re = /<div class="carousel">([\S\s]*?)<\/div>/;
        var n = re.exec(response)[1];
        // 1 - link, 2 - title, 3 - image, 4 - quality
        re = /<a href="([\S\s]*?)"><img title="([\S\s]*?)" src="([\S\s]*?)"[\S\s]*?class="quality_type ([\S\s]*?)">/g;
        var match = re.exec(n);
        while (match) {
            page.appendItem(PREFIX + ':index:' + escape(BASE_URL + match[1]), 'video', {
                title: new showtime.RichText(match[2] + ' ' + (match[4] == "quality_hd" ? colorStr("HD", blue) : colorStr("DVD", orange))),
                icon: match[3]
            });
            match = re.exec(n);
        };

        page.appendItem("", "separator", {
            title: 'Фильмы онлайн:'
        });

        scrapePageAtURL(page, '', true);
    };

    // Search IMDB ID by title

    function getIMDBid(title) {
        var resp = showtime.httpReq('http://www.google.com/search?q=imdb+' + encodeURIComponent(showtime.entityDecode(unescape(title))).toString()).toString();
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

    // No video
    plugin.addURI(PREFIX + ":novideo", function(page) {
        page.error('Это видео изъято из публичного доступа. / This video is not available, sorry :(');
        page.loading = false;
    });

    //Play vk* links
    plugin.addURI(PREFIX + ":vk:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var response = showtime.httpReq(unescape(url));
        var re = /url720=(.*?)&/;
        var link = re.exec(response);
        if (!link) {
            re = /url480=(.*?)&/;
            link = re.exec(response);
        }
        if (!link) {
            re = /url360=(.*?)&/;
            link = re.exec(response);
        }
        if (!link) {
            re = /url240=(.*?)&/;
            link = re.exec(response);
        }
        if (link) {
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                imdbid: getIMDBid(title),
                sources: [{
                    url: link[1]
                }]
            });
        } else page.error('Видео не доступно. / This video is not available, sorry :(');
        page.loading = false;
    });

    //Play bk.com links
    plugin.addURI(PREFIX + ":bk:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            imdbid: getIMDBid(title),
            sources: [{
                url: unescape(url)
            }]
        });
        page.loading = false;
    });

    //Play kinostok.tv links
    plugin.addURI(PREFIX + ":kinostok:(.*):(.*)", function(page, url, title) {
        var hash1 = "Ddaf4bI7i6XeRNZ3ToJcHmlv5E",
            hash2 = "YWyzpnxMu90Ltwk2GUQBsV81g=";

        url = unescape(url).match(/value="pl=c:(.*?)&amp;/)[1];
        var v = showtime.httpReq('http://kinostok.tv/embed' + unhash(url, hash1, hash2).match(/_video\/.*\//));
        page.loading = true;
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            imdbid: getIMDBid(title),
            sources: [{
                url: showtime.JSONDecode(unhash(v, hash1, hash2)).playlist[0].file
            }]
        });
        page.loading = false;
    });

    //Play meta.ua links
    plugin.addURI(PREFIX + ":metaua:(.*):(.*)", function(page, url, title) {
        var hash1 = "N3wxDvVdIbop1c5eiYZaWL6tnq",
            hash2 = "JBmX0z4T9gkMGRy7l8sUHfu2Q=";
        var v = showtime.httpReq('http://media.meta.ua/players/getparam/?v=' + unescape(unescape(url).match(/value="fileID=(.*?)&/)[1]));
        page.loading = true;
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            imdbid: getIMDBid(title),
            sources: [{
                url: showtime.JSONDecode(unhash(v, hash1, hash2))
            }]
        });
        page.loading = false;
    });

    //Play arm-tube.am links
    plugin.addURI(PREFIX + ":armtube:(.*):(.*)", function(page, url, title) {
        var hash1 = "kVI7xeanT6ispD9l3HfGYvgBcE",
            hash2 = "XU2R1bWow0Mm4JtQy8zuNdZL5=";

        url = unescape(url).match(/;file=(.*?)&amp;/)[1];
        page.loading = true;
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            imdbid: getIMDBid(title),
            sources: [{
                url: "hls:" + unhash(url, hash1, hash2).replace('manifest.f4m', 'master.m3u8')
            }]
        });
        page.loading = false;
    });

    //Play HDSerials links
    plugin.addURI(PREFIX + ":moonwalk:(.*):(.*)", function(page, url, title) {
        var v = showtime.JSONDecode(showtime.httpPost('http://moonwalk.cc/sessions/create', {
            'video_token': unescape(url).match(/<iframe src="http:\/\/moonwalk.cc\/video\/(.*?)\//)[1]
        }, "", {
            'X-Requested-With': 'XMLHttpRequest'
        }));
        page.loading = true;
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            imdbid: getIMDBid(title),
            sources: [{
                url: 'hls:' + v['manifest_m3u8']
            }]
        });
        page.loading = false;
    });

    // Play megogo links
    plugin.addURI(PREFIX + ":megogo:(.*)", function(page, url) {
        var re = /[\S\s]*?([\d+^\?]+)/i;
        var match = re.exec(unescape(url));
        var sign = showtime.md5digest('video=' + match[1] + '1e5774f77adb843c');
        sign = showtime.JSONDecode(showtime.httpReq('http://megogo.net/p/info?video=' + match[1] + '&sign=' + sign + '_samsungtv'));
        if (!sign.src) {
            page.loading = false;
            showtime.message("Error: This video is not available in your region :(", true, false);
            return;
        }
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(sign.title),
            imdbid: getIMDBid(sign.title),
            canonicalUrl: PREFIX + ":megogo:" + url,
            sources: [{
                url: sign.src
            }]
        });
        page.loading = false;
    });

    // Index page
    plugin.addURI(PREFIX + ":index:(.*)", function(page, url) {
        var response = showtime.httpReq(unescape(url)).toString();
        var re;
        setPageHeader(page, showtime.entityDecode(response.match(/<title>(.*?)<\/title>/)[1].replace(' - смотреть онлайн бесплатно в хорошем качестве', '')));
        var description = trim(response.match(/<div class="description"[\S\s]*?<div id="[\S\s]*?">([\S\s]*?)<br\s\/>/)[1]);
        var title = response.match(/<td itemprop="name">([\S\s]*?)<\/td>/)[1];
        var origTitle = response.match(/<td itemprop="alternativeHeadline">([\S\s]*?)<\/td>/);
        if (origTitle) title += " | " + origTitle[1];
        var icon = response.match(/<img itemprop="image"[\S\s]*?src="([\S\s]*?)"/)[1];
        var year = +response.match(/>Год:<\/td>[\S\s]*?<a href="[\S\s]*?">([\S\s]*?)<\/a>/)[1];
        var country = response.match(/>Страна:<\/td>[\S\s]*?<td>([\S\s]*?)<\/td>/)[1];
        var slogan = response.match(/>Слоган:<\/td>[\S\s]*?<td>([\S\s]*?)<\/td>/)[1];
        var duration = response.match(/<td itemprop="duration">([\S\s]*?)<\/td>/);
        if (duration) duration = duration[1];
        var rating = response.match(/<b itemprop="ratingValue">([\S\s]*?)<\/b>/)[1].replace(",", ".") * 10;
        var director = response.match(/<a itemprop="director" href="[\S\s]*?">([\S\s]*?)<\/a>/)[1];
        re = /<div class="last_episode">Последняя серия добавлена ([\S\s]*?)<\/div>/;
        var timestamp = re.exec(response);
        if (timestamp) timestamp = getTimestamp(timestamp[1]);
        re = /<span itemprop="name">([\S\s]*?)<\/span>/g;
        var match = re.exec(response);
        var actors = 0;
        while (match) {
            if (!actors) actors = match[1];
            else actors += ", " + match[1];
            match = re.exec(response);
        };
        re = /<a itemprop="genre" href="[\S\s]*?">([\S\s]*?)<\/a>/g;
        var match = re.exec(response);
        var genre = 0;
        while (match) {
            if (!genre) genre = match[1];
            else genre += ", " + match[1];
            match = re.exec(response);
        };

        if (timestamp) { // serial
            var links = new Array();
            re = /"([0-9]+)":"([\S\s]*?)>"/g;
            match = re.exec(response);
            while (match) {
                var re2 = /<iframe [\S\s]*?src=\\"([\S\s]*?)\\"/; // try vk.com links
                var lnk = re2.exec(match[2]);
                if (lnk) lnk = PREFIX + ":vk:" + escape(lnk[1].replace(/\\/g, ''));
                if (!lnk) {
                    re2 = /file: \\"([\S\s]*?)\\"/; // try baskino links
                    lnk = PREFIX + ":bk:" + escape(re2.exec(match[2])[1].replace(/\\/g, ''));
                }
                links[+match[1]] = lnk;
                match = re.exec(response);
            };
            re = /<div id="episodes-([0-9]+)"([\S\s]*?)<\/div>/g;
            match = re.exec(response);
            while (match) {
                page.appendItem("", "separator", {
                    title: 'Сезон ' + match[1]
                });
                re2 = /<span onclick="showCode\(([0-9]+),this\);">([\S\s]*?)<\/span>/g;
                var match2 = re2.exec(match[2]);
                while (match2) {
                    page.appendItem(links[match2[1]] + ":" + escape(match2[2]), 'video', {
                        title: match2[2],
                        icon: icon,
                        year: year,
                        genre: genre,
                        duration: duration,
                        rating: rating,
                        timestamp: timestamp,
                        description: new showtime.RichText(coloredStr("Страна: ", orange) + country + coloredStr(" Слоган: ", orange) + slogan + coloredStr(" Режиссер: ", orange) + director + coloredStr(" В ролях: ", orange) + actors + "\n\n" + description)
                    });
                    match2 = re2.exec(match[2]);
                };
                match = re.exec(response);
            };
        } else { // movie
            var player_tabs = response.match(/<ul id="player_tabs" class="tabs">([\S\s]*?)<\/ul>/)[1];
            re = /<li rel="([\S\s]*?)">([\S\s]*?)<\/li>/g;
            match = re.exec(player_tabs);
            var num = 0;
            while (match) {
                var link = response.match(/<iframe src="http:\/\/vk(.*?)"/g); // try to get vk link
                if (link && link[num]) link = PREFIX + ":vk:" + escape(link[num]) + ":" + escape(title);
                else link = 0;
                if (!link) {
                    link = response.match(/<iframe src="http:\/\/moonwalk.cc\/video\/(.*?)\//g); // try to get hdserials link
                    if (link && link[num]) link = PREFIX + ":moonwalk:" + escape(link[num]) + ":" + escape(title);
                    else link = 0;
                }
                if (!link) {
                    link = response.match(/value="pl=c:(.*?)&amp;/g); // try kinostok link
                    if (link && link[num]) link = PREFIX + ":kinostok:" + escape(link[num]) + ":" + escape(title);
                    else link = 0;
                }
                if (!link) {
                    link = response.match(/src="http:\/\/megogo.net(.*?)"/g); // try megogo.net link
                    if (link && link[num]) link = PREFIX + ":megogo:" + escape(link[num]) + ":" + escape(title);
                    else link = 0;
                }
                if (!link) {
                    link = response.match(/;file=(.*?)&amp;/g); // try armtube link
                    if (link && link[num]) link = PREFIX + ":armtube:" + escape(link[num]) + ":" + escape(title);
                    else link = 0;
                }
                if (!link) {
                    link = response.match(/value="fileID=(.*?)&/g); // try meta.ua link
                    if (link && link[num]) link = PREFIX + ":metaua:" + escape(link[num]) + ":" + escape(title);
                    else link = 0;
                }
                if (!link) { // try baskino links
                    link = response.match(/file:"([^"]+)/);
                    if (link) {
                        link = link[1];
                        var videoparams = {
                            sources: [{
                                url: link
                            }],
                            title: title,
                            imdbid: getIMDBid(escape(title))
                        };
                        link = "videoparams:" + showtime.JSONEncode(videoparams);
                    }
                }
                page.appendItem(link, 'video', {
                    title: new showtime.RichText(title + ' ' + coloredStr(match[2], orange)),
                    icon: icon,
                    year: year,
                    genre: genre,
                    duration: duration,
                    rating: rating,
                    timestamp: timestamp,
                    description: new showtime.RichText(coloredStr("Страна: ", orange) + country + coloredStr(" Слоган: ", orange) + slogan + coloredStr(" Режиссер: ", orange) + director + coloredStr(" В ролях: ", orange) + actors + "\n\n" + description)
                });
                match = re.exec(player_tabs);
                num++;
            };

        };
        re = /<div class="related_news">([\S\s]*?)<\/li><\/ul>/;
        response = re.exec(response)[1];
        re = /<div class="mbastitle">([\S\s]*?)<\/div>/;
        page.appendItem("", "separator", {
            title: re.exec(response)[1]
        });
        // 1 - link, 2 - icon, 3 - title, 4 - quality
        re = /<a href="([\S\s]*?)"><img src="([\S\s]*?)"[\S\s]*?\/><span>([\S\s]*?)<\/span>[\S\s]*?class="quality_type ([\S\s]*?)">/g;
        match = re.exec(response);
        while (match) {
            page.appendItem(PREFIX + ":index:" + escape(match[1]), 'video', {
                title: new showtime.RichText(match[3] + ' ' + (match[4] == "quality_hd" ? colorStr("HD", blue) : colorStr("DVD", orange))),
                icon: match[2]
            });

            match = re.exec(response);
        };
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":start", startPage);

    plugin.addSearcher("baskino.com", logo,

    function(page, query) {
	    page.entries = 0;
        var fromPage = 1,
            tryToSearch = true;
        // 1-link, 2-title, 3-image, 4-quality, 5-quoted full title, 6-raiting, 7-number of comments, 8-date added, 9-production date
        var re = /<div class="postcover">[\S\s]*?<a href="([\S\s]*?)"[\S\s]*?<img title="([\S\s]*?)" src="([\S\s]*?)"[\S\s]*?class="quality_type ([\S\s]*?)">[\S\s]*?<div class="posttitle">[\S\s]*?" >([\S\s]*?)<\/a>[\S\s]*?<li class="current-rating" style="[\S\s]*?">([\S\s]*?)<\/li>[\S\s]*?<!-- <div class="linline">([\S\s]*?)<\/div>[\S\s]*?<div class="linline">([\S\s]*?)<\/div>[\S\s]*?<div class="rinline">([\S\s]*?)<\/div>/g;
        var re2 = /href=\#>Вперед<\/a>/;

        function loader() {
            if (!tryToSearch) return false;
            var response = showtime.httpReq(BASE_URL + '/index.php?do=search&subaction=search&search_start=' + fromPage + '&story=' + query.replace(/\s/g, '\+'));
            var match = re.exec(response);
            while (match) {
                page.appendItem(PREFIX + ':index:' + escape(match[1]), 'video', {
                    title: new showtime.RichText(match[5] + ' ' + (match[4] == "quality_hd" ? colorStr("HD", blue) : colorStr("DVD", orange))),
                    icon: match[3],
                    rating: +(match[6]) / 2,
                    description: match[8] + '\n' + match[9].replace(/<span class="tvs_new">/, "").replace(/<\/span>/, "")
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