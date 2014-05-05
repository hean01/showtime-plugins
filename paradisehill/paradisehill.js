/**
 * paradisehill.tv plugin for Showtime
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
    var PREFIX = 'paradisehil';
    var BASE_URL = 'http://paradisehill.tv/';
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

    var service = plugin.createService("paradisehill.tv", PREFIX + ":start", "video", true, logo);

    var settings = plugin.createSettings("paradisehill.tv", plugin.path + "logo.png", "PORNO FILMS ONLINE | You can watch video completely free of charge");
    settings.createDivider('Settings');
    settings.createMultiOpt("lang", "Language", [
        ['en', 'english', true],
        ['ru', 'русский']
    ], function(l) {
        service.lang = l;
    });


    const blue = "6699CC", orange = "FFA500";

    function colorStr(str, color) {
        return '<font color="' + color + '"> (' + str + ')</font>';
    }

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    plugin.addURI(PREFIX + ":indexItem:(.*):(.*)", function(page, url, title) {
        setPageHeader(page, unescape(title));
        page.loading = true;
        var response = showtime.httpReq(BASE_URL + url).toString();
        page.loading = false;

        // 1-title, 2-front image, 3-back image, 4-nick, 5-date added, 6-views
        var match = response.match(/<div class="filmp">[\s\S]*?<h1>([\s\S]*?)<\/h1>[\s\S]*?<img src="([\s\S]*?)"[\s\S]*?<img src="([\s\S]*?)"[\s\S]*?<div class="nick"><span><\/span><a>([\s\S]*?)<\/a><\/div>[\s\S]*?<div class="date"><span><\/span>([\s\S]*?)<\/div>[\s\S]*?<div class="views"><span><\/span>([\s\S]*?)<\/div>/);
        if (match) {
           page.appendItem(match[2], 'image', {
               title: service.lang == "en" ? 'Poster' : 'Обложка',
               icon: match[2]
           });

           page.appendItem(match[3], 'image', {
               title: service.lang == "en" ? 'Thumbnails' : 'Миниатюры изображения',
               icon: match[3]
           });

           var description = response.match(/<div class="cont">([\s\S]*?)<\/div>/);
           var links = response.match(/var films= "([\s\S]*?)"/);
           if (links) {
               page.appendItem("", "separator", {
                  title: service.lang == "en" ? 'Video' : 'Видео'
               });

               var films = links[1].split("|||");
               for (n in films) {
                  page.appendItem("videoparams:" + showtime.JSONEncode({
                        sources: [{
                            url: films[n],
                            mimetype: "video/x-msvideo"
                        }],
                        title: match[1] + " (" + (service.lang == "en" ? 'part' : 'часть') + (+n+1) + ")"
                    }), 'video', {
                    title: new showtime.RichText(match[1] + colorStr((service.lang == "en" ? 'part' : 'часть') + (+n+1), blue)),
                    icon: match[2],
                    description: description ? new showtime.RichText(match[1] + "<br>" + description[1]) : ''
                  });
               }
           }
        }
    });

    function scrapeThePage(page, url, response) {
        var p, re;
        if (response) {
           p = 2;
           // 1-link, 2-icon, 3-title, 4-genre
           re = /<div class="item_zag">[\s\S]*?<a href="([\s\S]*?)"[\s\S]*?<img src="([\s\S]*?)" alt="([\s\S]*?)">[\s\S]*?<a href="[\s\S]*?">([\s\S]*?)<\/a>/g;
        } else {
           p = 1;
           // 1-link, 2-icon, 3-title
           re = /<div class="item_zag">[\s\S]*?<a href="([\s\S]*?)"[\s\S]*?<img src="([\s\S]*?)" alt="([\s\S]*?)">/g;
           page.loading = true;
           response = showtime.httpReq(url).toString();
           page.loading = false;
        }
        function loader() {
            var match = re.exec(response);
            while (match) {
                if (match[4]) {
                   var genre = match[4];
                   var title = new showtime.RichText(match[3] + colorStr(match[4], blue))
                } else {
                   var genre = 0;
                   var title = new showtime.RichText(match[3]);
                }
                page.appendItem(PREFIX + ":indexItem:" + match[1] + ":" + escape(match[3]), 'video', {
                    title: title,
                    genre: genre,
                    description: match[3],
                    icon: match[2]
                });
                match = re.exec(response);
            }
            match = response.match(/<span>([\S\s]*?)<\/span><\/li><\/ul>/);
            if (!match) {
               page.loading = true;
               response = showtime.httpReq(url + "?page=" + p).toString();
               page.loading =  false;
               p++;
               return true;
            };
            return false;
        }
        loader();
        page.paginator = loader;
    }

    plugin.addURI(PREFIX + ":indexCategory:(.*):(.*)", function(page, url, title) {
        setPageHeader(page, title);
        scrapeThePage(page, BASE_URL + url, 0);
    });

    function startPage(page) {
        setPageHeader(page, 'paradisehill.tv');

        page.appendItem("", "separator", {
            title: service.lang == "en" ? 'Categories' : 'Категории'
        });

        //1-link, 2-title, 3-icon, 4-counter
	var re = /<div class="item_zag clz">[\s\S]*?<a href="([\s\S]*?)" title="([\s\S]*?)"[\s\S]*?<img src="([\s\S]*?)"[\s\S]*?<div class="item_cat clc"><span><\/span>([\s\S]*?)<\/div>/g;
        page.loading = true;
        var lang = '';
        if (service.lang == "en") lang = 'en';
        var response = showtime.httpReq(BASE_URL + lang).toString();
        page.loading = false;

        var match = re.exec(response);
        while (match) {
             page.appendItem(PREFIX + ":indexCategory:" + match[1] + ":" + match[2], 'video', {
                 title: new showtime.RichText(match[2] + colorStr(match[4], blue)),
                 icon: match[3]
             });
             match = re.exec(response);
        }

        page.appendItem("", "separator", {
            title: service.lang == "en" ? 'New' : 'Новинки'
        });

        scrapeThePage(page, BASE_URL + lang, response);
    };

    plugin.addURI(PREFIX + ":start", startPage);
})(this);