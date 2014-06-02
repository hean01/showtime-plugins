/**
 * kordonivkakino.net plugin for Showtime
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
    var PREFIX = 'kordonivkakino';
    var BASE_URL = 'http://kordonivkakino.net';
    var logo = plugin.path + "logo.png";

    function setPageHeader(page, title) {
        page.loading = false;
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
    }

    var service = plugin.createService("kordonivkakino", PREFIX + ":start", "video", true, logo);

    function trim(s) {
        return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ");
    }

    const blue = "6699CC", orange = "FFA500";

    function colorStr(str, color) {
        return '<font color="' + color + '"> (' + str + ')</font>';
    }

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    var dBlock;

    function getAndClean(what) {
        var re = new RegExp(what+'([\\s\\S]*?)\\|\\|\\|', 'g');
        var s = re.exec(dBlock);
        if (s) {
            dBlock = dBlock.replace(s[0], '');
            s = trim(s[1].replace('/ Length: ', ''));
            s = s.replace(' / Genre: ', '');
            s = s.replace('/ Genre: ', '');
            s = s.replace('/ Language', '');
            if (what == 'Год') {
                s = s.replace(' выхода / Year: ', '');
                s = s.replace('выпуска:', '');
                s = s.replace('выхода', '');
            }
            s = s.replace(' студия ', '');
            s = s.replace(':', '');
            dBlock = dBlock.replace('Director/', '');
            dBlock = dBlock.replace('Starring/', '');
            dBlock = dBlock.replace('Story/', '');
            dBlock = dBlock.replace('Category/', '');
            dBlock = dBlock.replace('Runtime/', '');
            dBlock = dBlock.replace('Original Title/', '');
            dBlock = dBlock.replace('Street Date/', '');
            dBlock = dBlock.replace('Company/', '');
            dBlock = dBlock.replace('/ Cast', '');
            dBlock = dBlock.replace('/ Name', '');
            dBlock = dBlock.replace('/ Director', '');
            dBlock = dBlock.replace('/ Genre', '');
            dBlock = dBlock.replace('/ Studio', '');
            dBlock = dBlock.replace('выхода / Year', '');
            //showtime.print(showtime.entityDecode(s));
        } else s = '';
       return trim(showtime.entityDecode(s));
    }

    function videoparams(url, title, n) {
        var videoparams = {
            title: unescape(title),
            sources: [{
               url: url,
               mimetype: 'video/quicktime'
            }],
            canonicalUrl: PREFIX + ':' + unescape(title) + ':'+n,
            no_fs_scan: true
        };
        return "videoparams:" + showtime.JSONEncode(videoparams);
    }

    plugin.addURI(PREFIX + ":vk:(.*):(.*):(.*)", function(page, url, title, n) {
        page.loading = true;
        var response = showtime.httpReq(unescape(url));
        page.loading = false;
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
                sources: [{
                    url: link[1],
                    mimetype: 'video/quicktime'
                }],
                canonicalUrl: PREFIX + ':' + title + ':' + n,
                no_fs_scan: true
            });
        } else page.error('Видео не доступно. / This video is not available, sorry :(');
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":indexItem:(.*):(.*)", function(page, url, title) {
        setPageHeader(page, unescape(title));
        page.loading = true;
        var doc = showtime.httpReq(url).toString().replace(/\n/g, '|||').replace(/<br \/>/g, '|||');
        page.loading = false;

        //1-icon, 2-description
        var htmlBlock = doc.match(/dle_image_begin:([\s\S]*?)\|-->([\s\S]*?)<div style="clear/);
        //showtime.print(htmlBlock[2]);
        dBlock = htmlBlock[2].replace(/<[^>]*>/g, '');

        var language = getAndClean('Язык');
        var duration = getAndClean('Продолжительность').replace(/\s/g,'');
        if (!duration) duration = getAndClean('Длительность').replace(/\s/g,'');
        var genre = getAndClean('Жанр');
        var year = getAndClean('Год');
        var name = getAndClean('Название');
        var orig_name = getAndClean('Оригинальное название');
        var director = getAndClean('Режиссер');
        var actors = getAndClean('В ролях');
        if (!actors) actors = getAndClean('Актёры');
        var maker = getAndClean('Cтудия');
        if (!maker) maker = getAndClean('Студия');
        if (!maker) maker = getAndClean('Выпущено');
        var description = getAndClean('Описание');
        if (!description) description = getAndClean('О фильме');
        var country = getAndClean('Страна');
        var translation = getAndClean('Перевод');
        description = showtime.entityDecode(trim(description + ' ' + trim(dBlock.replace(/\|\|\|/g, ''))));
        //showtime.print(dBlock);

        var n = 1, type = 1;
        var re = /dle_video_begin:([\s\S]*?)-->/g;
        var link = re.exec(doc);
        if (!link) {
           re = /video_load\('([\s\S]*?)'/g;
           link = re.exec(doc);
           type = 2;
        }
        if (!link) {
            var re = /<iframe src="([\S\s]*?)"/g;
            link = re.exec(doc);
            type = 3;
        }
        var params;
        while (link) {
            switch (type) {
                case 1: // k
                    params = videoparams(link[1], title, n)
                break
                case 2: // filmodom.net
                    params = PREFIX + ':fd:' + link[1] + ':' + title + ':' + n
                break
                case 3: // vk.com
                    params = PREFIX + ':vk:' + link[1] + ':' + title + ':' + n
                break
                default:
            }
            page.appendItem(params, 'video', {
                title: unescape(title),
                icon: htmlBlock[1],
                duration: duration,
                genre: genre,
                year: +year,
                description: description
            });
            n++;
            link = re.exec(doc);
        }
    });

    var doc;

    function scraper(page, url) {
        var p = 2;

        function loader() {
            //1-link, 2-title, 3-icon, 4-views, 5-rating
            var re = /<div class="main-news">[\s\S]*?<a href="([\s\S]*?)">([\s\S]*?)<\/a>[\s\S]*?<img src="([\s\S]*?)"[\s\S]*?<div class="main-news-views">([\s\S]*?)<\/div>[\s\S]*?<li class="current-rating"[\s\S]*?">([\s\S]*?)<\/li>/g;
            var match = re.exec(doc);
            while (match) {
                page.appendItem(PREFIX + ":indexItem:" + match[1] + ":" + escape(match[2]), 'video', {
                    title: match[2],
                    description: new showtime.RichText(coloredStr('Название: ', orange) + match[2] +
                    coloredStr('<br>Просмотров: ', orange) + match[4]),
                    rating: +match[5],
                    icon: match[3].indexOf('http') ? BASE_URL + match[3] : match[3]
                });
                match = re.exec(doc);
            }
            match = doc.match(/<span>следующая&gt;<\/span>/);
            if (!match) {
               page.loading = true;
               doc = showtime.httpReq(url + 'page/' + p).toString();
               page.loading =  false;
               p++;
               return true;
            };
            return false;
        }
        loader();
        page.paginator = loader;
    }

    plugin.addURI(PREFIX + ":indexFolder:(.*):(.*)", function(page, url, title) {
        setPageHeader(page, unescape(title));
        page.loading = true;
        doc = showtime.httpReq(url).toString();
        page.loading = false;
        scraper(page, url);
    });

    function startPage(page) {
        page.loading = true;
        doc = showtime.httpReq(BASE_URL).toString();
        page.loading = false;
        setPageHeader(page, doc.match(/<title>([\s\S]*?)<\/title>/)[1]);

        var htmlBlock = doc.match(/<div class="menu">([\s\S]*?)<noindex>/);
        // 1-link, 2-title
        var re = /<a href="([\s\S]*?)" class="menu-link">([\s\S]*?)<\/a>/g;
        var match = re.exec(htmlBlock[1]);
        while (match) {
            page.appendItem(PREFIX + ":indexFolder:" + match[1] + ":" + escape(trim(match[2])), 'directory', {
                title: trim(match[2])
            });
            match = re.exec(htmlBlock[1]);
        }
        scraper(page, BASE_URL + '/upload/');
    };

    plugin.addURI(PREFIX + ":start", startPage);
})(this);