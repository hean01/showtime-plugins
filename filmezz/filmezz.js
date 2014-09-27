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

    const blue = "6699CC", orange = "FFA500";

    function colorStr(str, color) {
        return '<font color="' + color + '">(' + str + ')</font>';
    }

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
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
        var re = /[\0-\x1F\x7F-\x9F\xAD\u0378\u0379\u037F-\u0383\u038B\u038D\u03A2\u0528-\u0530\u0557\u0558\u0560\u0588\u058B-\u058E\u0590\u05C8-\u05CF\u05EB-\u05EF\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB-\u07FF\u082E\u082F\u083F\u085C\u085D\u085F-\u089F\u08A1\u08AD-\u08E3\u08FF\u0978\u0980\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FC-\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0C00\u0C04\u0C0D\u0C11\u0C29\u0C34\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5A-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C80\u0C81\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0D01\u0D04\u0D0D\u0D11\u0D3B\u0D3C\u0D45\u0D49\u0D4F-\u0D56\u0D58-\u0D5F\u0D64\u0D65\u0D76-\u0D78\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F5-\u13FF\u169D-\u169F\u16F1-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1878-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191D-\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C80-\u1CBF\u1CC8-\u1CCF\u1CF7-\u1CFF\u1DE7-\u1DFB\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20BB-\u20CF\u20F1-\u20FF\u218A-\u218F\u23F4-\u23FF\u2427-\u243F\u244B-\u245F\u2700\u2B4D-\u2B4F\u2B5A-\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E3C-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u312E-\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FCD-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA698-\uA69E\uA6F8-\uA6FF\uA78F\uA794-\uA79F\uA7AB-\uA7F7\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C5-\uA8CD\uA8DA-\uA8DF\uA8FC-\uA8FF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9E0-\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAA7C-\uAA7F\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F-\uABBF\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE27-\uFE2F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF]/g;
        return s.replace(re, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/(\r\n|\n|\r)/gm, "").replace(/[ ]{2,}/gi, " ").replace(/\t/g, ' ');
    }

    var service = plugin.createService("filmezz.eu", getDescriptor().id + ":start", "video", true, logo);

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

    function getQuality(qual) {
        var quality = '';
        switch (qual) {
            case 1:
                quality = 'CAM ';
                break;
            case 2:
                quality = 'TV ';
                break;
            case 3:
                quality = 'DVD ';
                break;
            case 4:
                quality = 'BD ';
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

    function sleep(milliseconds) {
        var start = new Date().getTime();
        while (1)
            if (new Date().getTime() - start > milliseconds)
                break;
    }

    // Index page
    plugin.addURI(getDescriptor().id + ":play:(.*):(.*):(.*)", function(page, hoster, url, title) {
        var canonicalUrl = getDescriptor().id + ":play:" + hoster + ':' + url + ':' + title;
        var doc = showtime.httpReq(checkLink(unescape(url)), {
            noFollow: true
        });

        doc = showtime.httpReq(checkLink(doc.headers.Location), {
            noFollow: true
        });

        switch (unescape(hoster)) {
            case 'VidToMe':
                var param = showtime.httpReq(checkLink(doc.headers.Location)).toString().match(/name="op" value="([\S\s]*?)"[\S\s]*?name="id" value="([\S\s]*?)"[\S\s]*?name="fname" value="([\S\s]*?)"[\S\s]*?name="hash" value="([\S\s]*?)"/);
                sleep(6000);
                url = showtime.httpReq(checkLink(doc.headers.Location), {
                     postdata: {
                         op:param[1],
                         usr_login:'',
                         id:param[2],
                         fname:param[3],
                         referer:checkLink(doc.headers.Location),
                         hash:param[4]
                     }
                }).toString();
                url = url.match(/id="lnk_download" href="([\S\s]*?)">/)[1];
                break;
            case 'Exashare':
                url = showtime.httpReq(doc.toString().match(/<p><a href="([\S\s]*?)">/)[1]).toString();
                url = url.match(/file: "([\S\s]*?)"/)[1];
                break;
            case 'Youwatch':
                url = doc.toString().match(/<p><a href="([\S\s]*?)">/)[1];
                var param = showtime.httpReq(url).toString().match(/<Form method="POST" action=''>[\S\s]*?name="op" value="([\S\s]*?)"[\S\s]*?name="id" value="([\S\s]*?)"[\S\s]*?name="fname" value="([\S\s]*?)"[\S\s]*?name="hash" value="([\S\s]*?)"/);
                sleep(10000);
                url = showtime.httpReq(url, {
                     postdata: {
                         op:param[1],
                         usr_login:'',
                         id:param[2],
                         fname:param[3],
                         referer:url,
                         hash:param[4]
                     }
                }).toString();
                url = url.match(/<span id='flvplayer'>[\S\s]*?eval\(function([\S\s]*?)\}\(([\S\s]*?)<\/script>/);
                var decryptedUrl;
                eval('try { function decryptParams' + url[1] +
                    '}; decryptedUrl = (decryptParams(' + url[2] + '} catch (err) {}');
                url = decryptedUrl.match(/file:"([\S\s]*?)"/)[1];
                break;
            case 'CloudZilla':
                url = showtime.httpReq(checkLink(doc.headers.Location)).toString().match(/<div id="player_container">[\S\s]*?src="([\S\s]*?)"/)[1];
                url = showtime.httpReq(url).toString().match(/vurl = "([\S\s]*?)"/)[1];
                break;
            case 'PutLocker (Firedrive)':
            case 'PutLocker':
                var path = doc.toString().match(/<p><a href="([\S\s]*?)">/)[1];
                var tries = 0;
                while (tries < 10) {
                    url = showtime.httpReq(path).toString();
                    url = url.match(/name="confirm" value="([\S\s]*?)"/)[1];
                    url = showtime.httpReq(path, {
                        postdata: {
                            confirm:url
                        }
                    }).toString();
                    tries++;
                    if (url) break;
                    showtime.print(tries);
                }
                url = url.match(/file: '([\S\s]*?)'/)[1];
                break;
            case 'Played.To':
                var path = doc.toString().match(/<p><a href="([\S\s]*?)">/)[1];
                var param = showtime.httpReq(path).toString().match(/<Form method="POST" action=''>[\S\s]*?name="op" value="([\S\s]*?)"[\S\s]*?name="id" value="([\S\s]*?)"[\S\s]*?name="fname" value="([\S\s]*?)"[\S\s]*?name="hash" value="([\S\s]*?)"/);
                if (param) {
                    url = showtime.httpReq(path, {
                        postdata: {
                            op:param[1],
                            usr_login:'',
                            id:param[2],
                            fname:param[3],
                            referer:url,
                            hash:param[4]
                        }
                    }).toString();
                    url = url.match(/file: "([\S\s]*?)"/)[1];
                    break;
                }
                page.error("Video was deleted. Sorry :(");
                return;
            case 'Indavideo':
                url = showtime.httpReq(checkLink(doc.headers.Location)).toString().match(/hash = "([\S\s]*?)"/);
                if (url) {
                    url = showtime.httpReq('http://amfphp.indavideo.hu/SYm0json.php/player.playerHandler.getVideoData/' + url[1]);
                    url = showtime.JSONDecode(url).data.video_file;
                    break;
                }
                page.error("Video was deleted. Sorry :(");
                return;
            case '1fichier (Letöltés)':
                url = showtime.httpReq(checkLink(doc.headers.Location)).toString();
                if (url.match(/red">([\S\s]*?)<\/div>/)) {
                    page.error(url.match(/red">([\S\s]*?)<\/div>/)[1].replace(/<br\/>/g, '. '));
                    return;
                }
                url = showtime.httpReq(url.match(/method="post" action="([\S\s]*?)"/)[1], {
                     postdata: {
                         o:1
                     },
                     noFollow: true
                });
                url = url.headers.Location;
                break;
            case 'Videoget (Divx+Letöltés)':
                url = showtime.httpReq(checkLink(doc.headers.Location)).toString().match(/class='btn btn-free' href='([\S\s]*?)'/);
                url = showtime.httpReq(checkLink(url[1])).toString().match(/name="src" value="([\S\s]*?)"/)[1];
                break;
            default:
                page.error("Can't get the link. Sorry :(");
                return;
                break;
        }

        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
          title: unescape(unescape(title)),
          imdbid: getIMDBid(unescape(title)),
            canonicalUrl: canonicalUrl,
            sources: [{
                url: url
            }]
        });
        page.loading = false;
    });

    function checkLink(link) {
        return link.substr(0, 4) == 'http' ? showtime.entityDecode(link).replace(/\"/g, '') : BASE_URL + showtime.entityDecode(link).replace(/\"/g, '');
    }

    // Index page
    plugin.addURI(getDescriptor().id + ":index:(.*)", function(page, url) {
        var doc = showtime.httpReq(checkLink(unescape(url))).toString();
        var info = doc.match(/<img id="kep" alt="([\S\s]*?)" src="([\S\s]*?)"/);
        setPageHeader(page, trim(doc.match(/<div class="boxup">([\S\s]*?)<\/div>/)[1]));
        var genres = doc.match(/<b>Kategóriák:<\/b>([\S\s]*?)<\/span>/)[1];
        var genre = '';
        var re = /<a href='[\S\s]*?'>([\S\s]*?)<\/a>/g;
        var match = re.exec(genres);
        while (match) {
            if (!genre)
                genre += match[1];
            else
                genre += ', ' + match[1];
            match = re.exec(genres);
        };
        var orig_name = doc.match(/<b>Eredeti cím:<\/b>([\S\s]*?)<br>/) ? doc.match(/<b>Eredeti cím:<\/b>([\S\s]*?)<br>/) : '';
        var desc = doc.match(/<div id="desc"><br><b>Leírás:<\/b>([\S\s]*?)<\/div>/)[1];
        var director = doc.match(/<b>Rendező:<\/b>([\S\s]*?)<br>/);
        var actors = doc.match(/<b>Szereplők:<\/b>([\S\s]*?)<\/div>/);
        function appendItem(route, title) {
            page.appendItem(route, 'video', {
                title: new showtime.RichText(title),
                icon: checkLink(info[2]),
                genre: genre,
                description: new showtime.RichText((orig_name ? coloredStr('Eredeti cím: ', orange) + trim(orig_name[1]) + '\n' : '') +
                    (director ? coloredStr('Rendező: ', orange) + trim(director[1]) + '\n' : '') +
                    (actors ? coloredStr('Szereplők: ', orange) + trim(actors[1]).replace(/^<br>/, '').replace(/<br>/g, ', ') + '\n' : '') +
                    coloredStr('Leírás: ', orange) + trim(desc).replace(/<br><br>/, ''))
            });
        }

        var trailer = doc.match(/<div id="filmicond"[\S\s]*?<a href="([\S\s]*?)"/);
        if (trailer)
            appendItem('youtube:video:' + escape(trailer[1]), 'Trailer');

        var blob = doc.match(/id=forrlistfej([\S\s]*?)<\/table>/)[1];
	// 1-language, 2-quality, 3-hoster, 4-info, 5-link
        re = /<img src="img\/lang\/([\S\s]*?)\.gif[\S\s]*?<img src="img\/qual\/([\S\s]*?)\.gif"[\S\s]*?">([\S\s]*?)<\/td>[\S\s]*?<td>([\S\s]*?)<\/td>[\S\s]*?href=http[\S\s]*?(http[\S\s]*?)>/g;
        match = re.exec(blob);
        while (match) {
            appendItem(getDescriptor().id + ':play:' + escape(trim(match[3])) + ':' + escape(match[5]) + ':' + escape(page.metadata.title),
                coloredStr(getQuality(+match[2]), orange) + ' ' + trim(match[3] + (match[4] ? ' - ' + trim(match[4]): '')) + coloredStr(' (' + getLang(+match[1]) + ')', orange)),
            match = re.exec(blob);
        }

        // Hozzászólások
        // 1-nick, 2-date/time, 3-icon, 4-text
        re = /<div class="forumkat"[\S\s]*?<a href="[\S\s]*?">([\S\s]*?)<\/a><\/div><div style[\S\s]*?<div style[\S\s]*?">([\S\s]*?)<\/div>[\S\s]*?<img src="([\S\s]*?)">[\S\s]*?id="[\S\s]*?">([\S\s]*?)<\/div>/g;
        match = re.exec(doc);
        var first = true;
        while (match) {
            if (first) {
                page.appendItem("", "separator", {
                    title: 'Hozzászólások'
                });
                first = false;
            }
            page.appendPassiveItem('video', '', {
                title: new showtime.RichText(coloredStr(match[1], orange) + ' ' + match[2]),
                icon: checkLink(match[3]),
                description: new showtime.RichText(trim(match[4]))
            });
            match = re.exec(doc);
        }

    });


    plugin.addURI(getDescriptor().id + ":category:(.*):(.*)", function(page, url, title) {
        setPageHeader(page, unescape(title));
        scraper(page, checkLink(unescape(url)));
    });

    var cats;

    plugin.addURI(getDescriptor().id + ":categories", function(page) {
        setPageHeader(page, 'Kategóriák');
        // 1-link, 2-title
        var re = /<a class=szines href="([\S\s]*?)">([\S\s]*?)<\/a>/g;
        var match = re.exec(cats);
        while (match) {
            page.appendItem(getDescriptor().id + ':category:' + escape(match[1]) + ':' + escape(match[2]), 'directory', {
                title: match[2]
            });
            match = re.exec(cats);
        };
    });

    function scraper(page, url) {
        page.entries = 0;
        var first = true, tryToSearch = true;

        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var doc = showtime.httpReq(checkLink(url)).toString();
            page.loading = false;
            if (first) {
                cats = doc.match(/<span class=szines>([\S\s]*?)<\/div><\/div>/)[1];
                var title = doc.match(/<div class="boxup">([\S\s]*?)<\/div>/);
                if (page.metadata) page.metadata.title += ' - ' + title[1];
                first = false;
            }

            // 1-icon, 2-link, 3-quality, 4-lang, 5-rating, 6-year, 7-director, 8-duration, 9-title
            var re = /image:url\('([\S\s]*?)'\)[\S\s]*?<a href="([\S\s]*?)">[\S\s]*?<img src="http:\/\/filmezz\.eu\/img\/qual\/([\S\s]*?)\.gif"[\S\s]*?<img src="http:\/\/filmezz\.eu\/img\/lang\/([\S\s]*?)\.gif"[\S\s]*?<div[\S\s]*?>([\S\s]*?)\/[\S\s]*?<\/u>([\S\s]*?)<br>[\S\s]*?<\/u>([\S\s]*?)<br>[\S\s]*?<\/u>([\S\s]*?)<br>[\S\s]*?<b>([\S\s]*?)<\/b>/g;
            var match = re.exec(doc);
            while (match) {
                page.appendItem(getDescriptor().id + ':index:' + escape(match[2]), 'video', {
                    title: new showtime.RichText(coloredStr(getQuality(+match[3]), orange) + trim(match[9]) + coloredStr(' (' + getLang(+match[4]) + ')', orange)),
                    icon: match[1],
                    year: +match[6],
                    duration: match[8],
                    rating: match[5] * 10,
                    description: new showtime.RichText(coloredStr('Rendező: ', orange) + match[7])
                });
                page.entries++;
                match = re.exec(doc);
            }
            var next = doc.match(/class=lapozoelem2>[\S\s]*?class=lapozoelem[\S\s]*?<a href="([\S\s]*?)">/);
            if (!next) return tryToSearch = false;
            url = next[1];
            return true;
        }
        loader();
        page.paginator = loader;
    }

    plugin.addURI(getDescriptor().id + ":mostviewed", function(page) {
        setPageHeader(page, 'Legnézettebb filmek');
        scraper(page, 'kereses.php?o=nezettseg');
    });

    plugin.addURI(getDescriptor().id + ":mostnew", function(page) {
        setPageHeader(page, 'Legfrissebb feltöltések');
        scraper(page, 'kereses.php?o=feltoltve');
    });

    plugin.addURI(getDescriptor().id + ":start", function(page) {
        setPageHeader(page, getDescriptor().synopsis);

        page.appendItem(getDescriptor().id + ':mostviewed', 'directory', {
            title: 'Legnézettebb filmek'
        });

        page.appendItem(getDescriptor().id + ':mostnew', 'directory', {
            title: 'Legfrissebb feltöltések'
        });

        page.appendItem(getDescriptor().id + ':categories', 'directory', {
            title: 'Kategóriák'
        });

        page.appendItem("", "separator", {
            title: 'Ízelítő a filmekből'
        });
        scraper(page, url);
    });

    plugin.addSearcher(getDescriptor().id, logo, function(page, query) {
        scraper(page, BASE_URL + '/kereses.php?s=' + query.replace(/\s/g, '\+') + '&w=0&o=abc&q=0&l=0&e=0&c=&t=0&h=0');
    });
})(this);