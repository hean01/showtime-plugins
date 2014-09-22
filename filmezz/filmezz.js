/**
 * filmezz.eu plugin for Showtime
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
    var BASE_URL = 'http://filmezz.eu/';
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

    var service = plugin.createService("filmezz.eu", getDescriptor().id + ":start", "video", true, logo);

    // Top-250
    plugin.addURI(getDescriptor().id + ":top", function(page) {
        var response = showtime.httpReq(BASE_URL + '/top/').toString();
        setPageHeader(page, response.match(/<title>([\S\s]*?)<\/title>/)[1]);
        page.loading = false;
        response = response.match(/<ul class="content_list_top"[\S\s]*?<\/ul>/);
        // 1-link, 2-number, 3-title, 4-year, 5-rating
        var re = /<a href="([\S\s]*?)">[\S\s]*?<b>([\S\s]*?)<\/b>[\S\s]*?<s>([\S\s]*?)<\/s>[\S\s]*?<em>([\S\s]*?)<\/em>[\S\s]*?<u>([\S\s]*?)<\/u>/g;
        var match = re.exec(response);
        while (match) {
            page.appendItem(getDescriptor().id + ':index:' + escape(match[1]), 'video', {
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
                page.appendItem(getDescriptor().id + ':index:' + escape(match[1]), 'video', {
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
            if (!response.match(/<div class="navigation">/)) return tryToSearch = false;
            if (response.match(/<span>Вперед<\/span>/)) return tryToSearch = false;
            p++;
            return true;
        };
        loader();
        page.paginator = loader;
    };

    plugin.addURI(getDescriptor().id + ":indexURL:(.*)", function(page, url) {
        scrapePageAtURL(page, url, false);
    });

    plugin.addURI(getDescriptor().id + ":movies", function(page) {
        var response = showtime.httpReq(BASE_URL).toString();
        setPageHeader(page, response.match(/<title>([\S\s]*?)<\/title>/)[1]);
        response = response.match(/<ul class="sf-menu">([\s\S]*?)<\/ul>/)[1];
        var re = /<li><a href="([\s\S]*?)">([\s\S]*?)<\/a><\/li>/g;
        var match = re.exec(response);
        while (match) {
            page.appendItem(getDescriptor().id + ":indexURL:" + match[1], 'directory', {
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
    plugin.addURI(getDescriptor().id + ":novideo", function(page) {
        page.error('Это видео изъято из публичного доступа. / This video is not available, sorry :(');
        page.loading = false;
    });

    //Play vk* links
    plugin.addURI(getDescriptor().id + ":vk:(.*):(.*)", function(page, url, title) {
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
    plugin.addURI(getDescriptor().id + ":bk:(.*):(.*)", function(page, url, title) {
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
    plugin.addURI(getDescriptor().id + ":kinostok:(.*):(.*)", function(page, url, title) {
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
    plugin.addURI(getDescriptor().id + ":metaua:(.*):(.*)", function(page, url, title) {
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
    plugin.addURI(getDescriptor().id + ":armtube:(.*):(.*)", function(page, url, title) {
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
    plugin.addURI(getDescriptor().id + ":moonwalk:(.*):(.*)", function(page, url, title) {
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
    plugin.addURI(getDescriptor().id + ":megogo:(.*)", function(page, url) {
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
            canonicalUrl: getDescriptor().id + ":megogo:" + url,
            sources: [{
                url: sign.src
            }]
        });
        page.loading = false;
    });

    // Play gidtv links
    plugin.addURI(getDescriptor().id + ":gidtv:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var doc = showtime.httpReq(unescape(url).match(/src="(.*)"/)[1]).toString();
        page.loading = false;
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            imdbid: getIMDBid(title),
            canonicalUrl: getDescriptor().id + ":gidtv:" + url+':'+title,
            sources: [{
                url: doc.match(/setFlash\('([\s\S]*?)\s/)[1].replace(/manifest.f4m/,'index.m3u8')
            }]
        });
        page.loading = false;
    });

    //Play Rutube links
    plugin.addURI(getDescriptor().id + ":rutube:(.*):(.*)", function(page, url, title) {
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

    function getQuality(qual) {
        var quality = '';
        switch (qual) {
            case 1:
                quality = 'CAM';
                break;
            case 2:
                quality = 'TV';
                break;
            case 3:
                quality = 'DVD';
                break;
            case 4:
                quality = 'BD';
                break;
            default:
                quality = '';
                break;
        }
        return quality;
    }

    function getLang(lng) {
        var lang = '';
        switch (lng) {
            case 1:
                lang = 'EN';
                break;
            case 2:
                lang = 'EN/HU';
                break;
            case 3:
                lang = 'HU';
                break;
            default:
                lang = '';
                break;
        }
        return lang;
    }

    function pause(n){
        var today = new Date();
        var today2 = today;
        while (today2 - today <= n)
            today2 = new Date()
    }



    // Index page
    plugin.addURI(getDescriptor().id + ":play:(.*)", function(page, url) {
        var doc = showtime.httpReq(checkLink(unescape(url)), {
            noFollow: true
        });
        doc = showtime.httpReq(checkLink(doc.headers.Location), {
            noFollow: true
        });

        var param = showtime.httpReq(doc.headers.Location).toString().match(/name="op" value="([\S\s]*?)"[\S\s]*?name="id" value="([\S\s]*?)"[\S\s]*?name="fname" value="([\S\s]*?)"[\S\s]*?name="hash" value="([\S\s]*?)"/);
        pause(6000);
        url = showtime.httpReq(doc.headers.Location, {
            postdata: {
               op:param[1],
               usr_login:'',
               id:param[2],
               fname:param[3],
               referer:doc.headers.Location,
               hash:param[4]
            }
        }).toString();
        showtime.print(url);
        url = url.match(/id="lnk_download" href="([\S\s]*?)">/)[1];
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
//            title: unescape(sign.title),
//            imdbid: getIMDBid(sign.title),
//            canonicalUrl: getDescriptor().id + ":play:" + url,
            sources: [{
                url: url
            }]
        });
        page.loading = false;
    });

    function checkLink(link) {
        return link.substr(0, 4) == 'http' ? link : BASE_URL + link;
    }

    // Index page
    plugin.addURI(getDescriptor().id + ":index:(.*)", function(page, url) {
        var doc = showtime.httpReq(checkLink(unescape(url))).toString();
        var info = doc.match(/<img id="kep" alt="([\S\s]*?)" src="([\S\s]*?)"/);
        setPageHeader(page, info[1]);

        var blob = doc.match(/id=forrlistfej([\S\s]*?)<\/table>/);

	// 1-quality, 2-language, 3-hoster, 4-link
        var re = /<img src="img\/lang\/([\S\s]*?)\.gif[\S\s]*?<img src="img\/qual\/([\S\s]*?)\.gif"[\S\s]*?">([\S\s]*?)<\/td>[\S\s]*?href=http[\S\s]*?(http[\S\s]*?)>/g;
        var match = re.exec(doc);
        while (match) {
            page.appendItem(getDescriptor().id + ':play:' + escape(match[4]), 'video', {
                title: new showtime.RichText(coloredStr(getQuality(+match[1]), orange) + ' ' + trim(match[3]) + coloredStr(' (' + getLang(+match[2]) + ')', orange)),
                icon: checkLink(info[2])
//                description: new showtime.RichText(coloredStr('Rendező: ', orange) + match[7])
            });
            match = re.exec(doc);
        }
    });

    plugin.addURI(getDescriptor().id + ":start", function(page) {
        setPageHeader(page, getDescriptor().synopsis);
        var doc = showtime.httpReq(BASE_URL).toString();

        page.appendItem("", "separator", {
            title: 'Ízelítő a filmekből'
        });

        // 1-icon, 2-link, 3-quality, 4-lang, 5-rating, 6-year, 7-director, 8-duration, 9-title
        var re = /image:url\('([\S\s]*?)'\)[\S\s]*?<a href="([\S\s]*?)">[\S\s]*?<img src="http:\/\/filmezz\.eu\/img\/qual\/([\S\s]*?)\.gif"[\S\s]*?<img src="http:\/\/filmezz\.eu\/img\/lang\/([\S\s]*?)\.gif"[\S\s]*?<div[\S\s]*?>([\S\s]*?)\/[\S\s]*?<\/u>([\S\s]*?)<br>[\S\s]*?<\/u>([\S\s]*?)<br>[\S\s]*?<\/u>([\S\s]*?)<br>[\S\s]*?<b>([\S\s]*?)<\/b>/g;
        var match = re.exec(doc);
        while (match) {
            page.appendItem(getDescriptor().id + ':index:' + escape(match[2]), 'video', {
                title: new showtime.RichText(coloredStr(getQuality(+match[3]), orange) + ' ' + match[9] + coloredStr(' (' + getLang(+match[4]) + ')', orange)),
                icon: match[1],
                year: +match[6],
                duration: match[8],
                rating: match[5] * 10,
                description: new showtime.RichText(coloredStr('Rendező: ', orange) + match[7])
            });
            match = re.exec(doc);
        };
    });

    plugin.addSearcher("filmezz.eu", logo, function(page, query) {
        scrapePageAtURL(page, '&story=' + query.replace(/\s/g, '\+'), false)
    });
})(this);