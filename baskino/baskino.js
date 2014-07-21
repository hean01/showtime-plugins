/**
 * Baskino.com plugin for Showtime
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
    var plugin_info = plugin.getDescriptor();
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
            page.metadata.title = showtime.entityDecode(unescape(title));
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
        page.entries = 0;
        var p = 1, tryToSearch = true;

        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            if (url.substr(0,4) == '&sto')
                var response = showtime.httpReq(BASE_URL+'/index.php?do=search&subaction=search&search_start=' + p + url).toString();
            else
                var response = showtime.httpReq((url.substr(0, 4) == 'http' ? '' : BASE_URL) + unescape(url) + "/page/" + p + "/").toString();
            page.loading = false;
            if (!titleIsSet) {
                setPageHeader(page, response.match(/<title>(.*?)<\/title>/)[1].replace(' - смотреть онлайн бесплатно в хорошем качестве', ''));
                titleIsSet = true;
            }
            // 1-link, 2-title, 3-icon, 4-quality, 5-full title,
            // 6-rating, 7-num of comments, 8-date added, 9-year
            var re = /<div class="postcover">[\S\s]*?<a href="([\S\s]*?)"[\S\s]*?<img title="([\S\s]*?)" src="([\S\s]*?)"[\S\s]*?class="quality_type ([\S\s]*?)">[\S\s]*?<div class="posttitle">[\S\s]*?>([\S\s]*?)<\/a>[\S\s]*?<li class="current-rating" style="[\S\s]*?">([\S\s]*?)<\/li>[\S\s]*?<!-- <div class="linline">([\S\s]*?)<\/div>[\S\s]*?<div class="linline">([\S\s]*?)<\/div>[\S\s]*?<div class="rinline">([\S\s]*?)<\/div>/g;
            var match = re.exec(response);
            while (match) {
                page.appendItem(PREFIX + ':index:' + escape(match[1]), 'video', {
                    title: new showtime.RichText(match[5] + ' ' + (match[4] == "quality_hd" ? colorStr("HD", blue) : colorStr("DVD", orange))),
                    rating: +(match[6]) / 2,
                    icon: match[3],
                    year: match[9].match(/(\d+)/) ? +match[9].match(/(\d+)/)[1] : '',
                    timestamp: getTimestamp(match[8]),
                    description: new showtime.RichText((match[7].match(/(\d+)/) ? coloredStr('Комментариев: ', orange) + match[7].match(/(\d+)/)[1] : '') +
                        coloredStr(' Добавлено: ', orange) + match[8] +
                        (match[9].match(/<span class="tvs_new">(.*)<\/span>/) ? '\n' + match[9].match(/<span class="tvs_new">(.*)<\/span>/)[1] : '') )
                });
                page.entries++;
                match = re.exec(response);
            };
            if (response.match(/<span>Вперед<\/span>/)) return tryToSearch = false;
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
                title: new showtime.RichText(match[2])
            });
            match = re.exec(response);
        };
    });

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
        var response = showtime.httpReq(unescape(url)).toString();
        var link = response.match(/url720=(.*?)&/);
        if (!link) link = response.match(/url480=(.*?)&/);
        if (!link) link = response.match(/url360=(.*?)&/);
        if (!link) link = response.match(/url240=(.*?)&/);
        page.loading = false;
        if (!link) {
            page.error('Видео не доступно. / This video is not available, sorry :(');
            return;
        }
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            imdbid: getIMDBid(title),
            sources: [{
                url: link[1]
            }]
        });
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
        var html = showtime.httpReq(unescape(url)).toString();
        var link = showtime.JSONDecode(showtime.httpReq('http://moonwalk.cc/sessions/create_session', {
            postdata: {
                'video_token': html.match(/video_token: '([\s\S]*?)'/)[1],
                'video_secret': html.match(/video_secret: '([\s\S]*?)'/)[1]
            }
        }));
        link = 'hls:' + link['manifest_m3u8']
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            imdbid: getIMDBid(title),
            sources: [{
                url: link
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

    // Play gidtv links
    plugin.addURI(PREFIX + ":gidtv:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var doc = showtime.httpReq(unescape(url).match(/src="(.*)"/)[1]).toString();
        page.loading = false;
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            imdbid: getIMDBid(title),
            canonicalUrl: PREFIX + ":gidtv:" + url+':'+title,
            sources: [{
                url: doc.match(/setFlash\('([\s\S]*?)\s/)[1].replace(/manifest.f4m/,'index.m3u8')
            }]
        });
        page.loading = false;
    });

    //Play Rutube links
    plugin.addURI(PREFIX + ":rutube:(.*):(.*)", function(page, url, title) {
        var html = showtime.httpReq(unescape(url)).toString();
        var link = html.match(/"m3u8": "([\s\S]*?)"\}/);
        if (!link) {
            page.error('Видео удалено Администрацией RuTube');
            return;
        }
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            imdbid: getIMDBid(title),
            sources: [{
                url: 'hls:' + link[1]
            }]
        });
        page.loading = false;
    });

    // Index page
    plugin.addURI(PREFIX + ":index:(.*)", function(page, url) {
        var response = showtime.httpReq(unescape(url)).toString(), re;
        setPageHeader(page, response.match(/<title>(.*?)<\/title>/)[1].replace(' - смотреть онлайн бесплатно в хорошем качестве', ''));
        var description = trim(response.match(/<div class="description"[\S\s]*?<div id="[\S\s]*?">([\S\s]*?)<br\s\/>/)[1]);
        var title = response.match(/<td itemprop="name">([\S\s]*?)<\/td>/)[1];
        var origTitle = response.match(/<td itemprop="alternativeHeadline">([\S\s]*?)<\/td>/);
        if (origTitle) title += " | " + origTitle[1];
        var icon = response.match(/<img itemprop="image"[\S\s]*?src="([\S\s]*?)"/)[1];
        var year = response.match(/>Год:<\/td>[\S\s]*?<a href="([\S\s]*?)">([\S\s]*?)<\/a>/);
        var country = response.match(/>Страна:<\/td>[\S\s]*?<td>([\S\s]*?)<\/td>/)[1];
        var slogan = response.match(/>Слоган:<\/td>[\S\s]*?<td>([\S\s]*?)<\/td>/)
        if (slogan) slogan = slogan[1];
        var duration = response.match(/<td itemprop="duration">([\S\s]*?)<\/td>/);
        if (duration) duration = duration[1];
        var rating = response.match(/<b itemprop="ratingValue">([\S\s]*?)<\/b>/)[1].replace(",", ".") * 10;
        var directors = response.match(/<a itemprop="director"([\S\s]*?)<\/td>/)[1];
        var timestamp = response.match(/<div class="last_episode">Последняя серия добавлена ([\S\s]*?)<\/div>/);
        if (timestamp) timestamp = getTimestamp(timestamp[1]);
        var genres = response.match(/<a itemprop="genre"([\S\s]*?)<\/td>/)[1];
        var re = /href="[\S\s]*?">([\S\s]*?)<\/a>/g;
        var genre = 0;
        var match = re.exec(genres);
        while (match) {
            if (!genre) genre = match[1];
            else genre += ", " + match[1];
            match = re.exec(genres);
        };

        if (timestamp) { // series
            var links = new Array();
            re = /"([0-9]+)":"([\S\s]*?)>"/g;
            match = re.exec(response);
            while (match) {
                // try vk.com links
                var lnk = match[2].match(/<iframe [\S\s]*?src=\\"http:\\\/\\\/vk([\S\s]*?)\\"/);
                if (lnk) {
                    lnk = PREFIX + ":vk:" + escape('http://vk'+lnk[1].replace(/\\/g, ''));
                }
                if (!lnk) { // try vk links
                    lnk = match[2].match(/<iframe [\S\s]*?src=\\"https:\\\/\\\/vk([\S\s]*?)\\"/);
                    if (lnk) lnk = PREFIX + ":vk:" + escape('https://vk'+lnk[1].replace(/\\/g, ''));
                }
                if (!lnk) { // try megogo links
                    lnk = match[2].match(/<iframe [\S\s]*?src=\\"http:\\\/\\\/megogo.net(.*?)\\"/);
                    if (lnk) lnk = PREFIX + ":megogo:" + escape('http://megogo.net'+lnk[1].replace(/\\/g, ''));
                }
                if (!lnk) { // try youtube links
                    lnk = match[2].match(/<iframe [\S\s]*?youtube(.*?)\\"/);
                    if (lnk) lnk = "youtube:video:" + escape(lnk[1].replace(/\\/g, '')+'"');
                }
                if (!lnk) { // try rutube links
                    lnk = match[2].match(/<iframe [\S\s]*?rutube(.*?)\\"/);
                    if (lnk) lnk = PREFIX + ":rutube:" + escape('https://rutube'+lnk[1].replace(/\\/g, ''));
                }
                if (!lnk) { // try baskino links
                    lnk = match[2].match(/file: \\"([\S\s]*?)\\"/);
                    if (lnk) lnk = PREFIX + ":bk:" + escape(lnk[1].replace(/\\/g, ''));
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
                var re2 = /<span onclick="showCode\(([0-9]+),this\);">([\S\s]*?)<\/span>/g;
                var match2 = re2.exec(match[2]);
                while (match2) {
                    page.appendItem(links[match2[1]] + ":" + escape(match2[2]), 'video', {
                        title: match2[2],
                        icon: icon,
                        year: +year[2],
                        genre: genre,
                        duration: duration,
                        rating: rating,
                        timestamp: timestamp,
                        description: new showtime.RichText(coloredStr("Страна: ", orange) +
                            country + coloredStr(" Слоган: ", orange) + slogan + "\n" + description)
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
                    link = response.match(/<iframe src="https:\/\/vk(.*?)"/g); // try to get vks link
                    if (link && link[num]) link = PREFIX + ":vk:" + escape(link[num]) + ":" + escape(title);
                    else link = 0;
                }
                if (!link) {
                    link = response.match(/<iframe src="http:\/\/moonwalk.cc\/video\/(.*?)\//g); // try to get hdserials link
                    if (link && link[num]) link = PREFIX + ":moonwalk:" + escape(link[num]) + ":" + escape(title);
                    else link = 0;
                }
                if (!link) {
                    link = response.match(/value="pl=c:(.*?)&amp;/g); //
                    if (link && link[num]) link = PREFIX + ":kinostok:" + escape(link[num]) + ":" + escape(title);
                    else link = 0;
                }
                if (!link) {
                    link = response.match(/src="http:\/\/megogo.net(.*?)"/g);
                    if (link && link[num]) link = PREFIX + ":megogo:" + escape(link[num]) + ":" + escape(title);
                    else link = 0;
                }
                if (!link) {
                    link = response.match(/;file=(.*?)&amp;/g);
                    if (link && link[num]) link = PREFIX + ":armtube:" + escape(link[num]) + ":" + escape(title);
                    else link = 0;
                }
                if (!link) {
                    link = response.match(/value="fileID=(.*?)&/g);
                    if (link && link[num]) link = PREFIX + ":metaua:" + escape(link[num]) + ":" + escape(title);
                    else link = 0;
                }
                if (!link) {
                    link = response.match(/src="http:\/\/gidtv.cc(.*?)"/g);
                    if (link && link[num]) link = PREFIX + ":gidtv:" + escape(link[num]) + ":" + escape(title);
                    else link = 0;
                }
                if (!link) {
                    link = response.match(/src="\/\/www.youtube.com\/embed\/(.*?)"/g);
                    if (link && link[num]) link = 'youtube:video:' + escape(link[num]);
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
                    year: +year[2],
                    genre: genre,
                    duration: duration,
                    rating: rating,
                    timestamp: timestamp,
                    description: new showtime.RichText(coloredStr("Страна: ", orange) +
                        country + coloredStr(" Слоган: ", orange) + slogan + "\n" +
                        description)
                });
                match = re.exec(player_tabs);
                num++;
            };

        };

        //trailer
        var html = response.match(/<span class="trailer_link">[\S\s]*?src="([\S\s]*?)"/);
        if (html)
            page.appendItem("youtube:video:" + escape(html[1].replace(/\\/g, '')+'"'), 'video', {
                title: 'Трейлер'
            });

        //year
        page.appendItem("", "separator", {
            title: 'Год:'
        });
        page.appendItem(PREFIX + ":indexURL:" + escape(year[1]), 'directory', {
            title: year[2]
        });

        //collections
        var first = true;
        var collections = response.match(/class="b-collection__cell">([\S\s]*?)<\/td>/);
        if (collections) {
            re = /<a href="([\S\s]*?)">([\S\s]*?)<\/a>/g;
            html = re.exec(collections[1]);
            while (html) {
                if (first) {
                    page.appendItem("", "separator", {
                        title: 'Цикл:'
                    });
                    first = false;
                }
                page.appendItem(PREFIX + ":indexURL:" + escape(html[1]), 'directory', {
                    title: html[2]
                });
                html = re.exec(collections[1]);
            };
        };

        // genres
        page.appendItem("", "separator", {
            title: 'Жанры:'
        });
        re = /href="([\S\s]*?)">([\S\s]*?)<\/a>/g;
        html = re.exec(genres);
        while (html) {
            page.appendItem(PREFIX + ":indexURL:" + escape(html[1]), 'directory', {
                title: html[2]
            });
            html = re.exec(genres);
        };

        //directors
        page.appendItem("", "separator", {
            title: 'Режиссеры:'
        });
        re = /href="([\S\s]*?)">([\S\s]*?)<\/a>/g;
        html = re.exec(directors);
        while (html) {
            page.appendItem(PREFIX + ":indexURL:" + escape(html[1]), 'directory', {
                title: html[2]
            });
            html = re.exec(directors);
        }

        //actors
        page.appendItem("", "separator", {
            title: 'В ролях:'
        });
        var actors = response.match(/"post-actors-list">([\S\s]*?)<\/td>/)[1];
        re = /data\-person="([\S\s]*?)" href="([\S\s]*?)"/g;
        html = re.exec(actors);
        while (html) {
            var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/engine/ajax/getActorData.php?name='+encodeURIComponent(html[1])));
            page.appendItem(PREFIX + ":indexURL:" + escape(html[2]), 'video', {
                title: html[1],
                icon: json.image
            });
            html = re.exec(actors);
        };

        //related
        html = response.match(/<div class="related_news">([\S\s]*?)<\/li><\/ul>/)[1];
        page.appendItem("", "separator", {
            title: html.match(/<div class="mbastitle">([\S\s]*?)<\/div>/)[1]
        });
        // 1 - link, 2 - icon, 3 - title, 4 - quality
        re = /<a href="([\S\s]*?)"><img src="([\S\s]*?)"[\S\s]*?\/><span>([\S\s]*?)<\/span>[\S\s]*?class="quality_type ([\S\s]*?)">/g;
        match = re.exec(html);
        while (match) {
            page.appendItem(PREFIX + ":index:" + escape(match[1]), 'video', {
                title: new showtime.RichText(match[3] + ' ' + (match[4] == "quality_hd" ? colorStr("HD", blue) : colorStr("DVD", orange))),
                icon: match[2]
            });

            match = re.exec(html);
        };

        //comments
        var tryToSearch = true, first = true;
        function loader() {
            if (!tryToSearch) return false;
            html = response.match(/<div class="listcomments">([\S\s]*?)<\/form>/)[1];
            // 1-user+added, 2-icon, 3-comment
            re = /<div class="linline author">([\S\s]*?)<div class="rinline acts">[\S\s]*?<img src="([\S\s]*?)"[\S\s]*?<div id='[\S\s]*?'>([\S\s]*?)<\/div>/g;
            match = re.exec(html);
            while (match) {
                if (first) {
                   page.appendItem("", "separator", {
                       title: html.match(/<div class="mbastitle">([\S\s]*?)<\/div>/)[1]
                   });
                   first = false;
                }
                var author = match[1].match(/href="[\S\s]*?">([\S\s]*?)<\/a>([\S\s]*?)<\/div>/);
                var added = '';
                if (author) {
                    added = author[2];
                    author = author[1];
                } else {
                    author = trim(match[1].match(/Добавил ([\S\s]*?)<\/div>/)[1]);
                }
                page.appendPassiveItem('video', '', {
                    title: new showtime.RichText(coloredStr(trim(author), orange) + added),
                    icon: match[2].substr(0, 4) == 'http' ? match[2] : BASE_URL + match[2],
                    description: new showtime.RichText(trim(match[3]))
                    });
                    match = re.exec(html);
            };
            var next = response.match(/<div class="dle-comments-navigation">[\S\s]*?<\/span> <a href="([\S\s]*?)">/);
            if (!next) return tryToSearch = false;
            response = showtime.httpReq(next[1]).toString();
            return true;
        };
        loader();
        page.loading = false;
        page.paginator = loader;
    });

    plugin.addURI(PREFIX + ":start", function(page) {
        var response = showtime.httpReq(BASE_URL).toString();
        setPageHeader(page, plugin_info.synopsis);

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
                description: new showtime.RichText(coloredStr('Режиссер: ', orange) + match[4])
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
    });

    plugin.addSearcher("baskino.com", logo, function(page, query) {
        scrapePageAtURL(page, '&story=' + query.replace(/\s/g, '\+'), false)
    });
})(this);