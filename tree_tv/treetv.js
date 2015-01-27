/**
 * Tree.tv plugin for Showtime
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
    var PREFIX = 'treetv';
    var BASE_URL = 'http://tree.tv';
    var logo = plugin.path + "logo.png";
    var logged = false, credentials;

    function setPageHeader(page, title) {
        page.loading = false;
        if (page.metadata) {
            page.metadata.title = showtime.entityDecode(title);
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
        if (!logged) login(page, false);
    }

    function login(page, showDialog) {
        var text = '';
        if (showDialog) {
           text = 'Введите email и пароль';
           logged = false;
        }

        if (!logged) {
            credentials = plugin.getAuthCredentials(plugin.getDescriptor().synopsis, text, showDialog);
            if (credentials && credentials.username && credentials.password) {
                var params = 'login=' + credentials.username + '&password=' + credentials.password + '&remember=1';
                page.loading = true;
                var resp = showtime.httpReq(BASE_URL+ '/users/index/auth', {
                    args: {
                        mail: credentials.username,
                        pass: credentials.password,
                        social: 0
                    }
                });
                page.loading = false;
                if (resp == '"ok"') logged = true;
            }
        }

        if (showDialog) {
           if (logged) showtime.message("Вход успешно произведен. Параметры входа сохранены.", true, false);
           else showtime.message("Не удалось войти. Проверьте email/пароль...", true, false);
        }
    }

    var service = plugin.createService("Tree.tv", PREFIX + ":start", "video", true, logo);
    var settings = plugin.createSettings(plugin.getDescriptor().id, logo, plugin.getDescriptor().synopsis);
    settings.createAction('treetv_login', 'Войти в tree.tv', function() {
        login(0, true);
    });

    function trim(s) {
        if (s) return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ").replace(/\t/g,'');
        return '';
    }

    var blue = '6699CC', orange = 'FFA500', red = 'EE0000', green = '008B45';

    function colorStr(str, color) {
        return '<font color="' + color + '"> (' + str + ')</font>';
    }

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    // Search IMDB ID by title
    function getIMDBid(title) {
        var resp = showtime.httpReq('http://www.imdb.com/find?ref_=nv_sr_fn&q=' + encodeURIComponent(showtime.entityDecode(unescape(title))).toString()).toString();
        var imdbid = resp.match(/<a href="\/title\/(tt\d+)\//);
        if (imdbid) return imdbid[1];
        return imdbid;
    };

    function videoparams(url, title, full_title) {
        var videoparams = {
            title: unescape(title),
            sources: [{
               url: url,
               mimetype: 'video/quicktime'
            }],
            imdbid: getIMDBid(full_title),
            canonicalUrl: PREFIX + ':' + unescape(title),
            no_fs_scan: true
        };
        return "videoparams:" + showtime.JSONEncode(videoparams);
    }

    var doc;

    plugin.addURI(PREFIX + ":listFolder:(.*):(.*):(.*)", function(page, id, quality, title) {
        setPageHeader(page, unescape(title));
        var first = 0, links, fileLink;
        // 1-film_id, 2-filename, 3-date, 4-flags, 5-link, 6-filesize
        var regex = 'class="accordion_content_item q' + quality + '"' +
            '[\\s\\S]*?data-folder="' + id + '"([\\s\\S]*?)' +
            'class="file_title watch_link">([\\s\\S]*?)</a>[\\s\\S]*?' +
            '<div class="date_file">([\\s\\S]*?)</div>[\\s\\S]*?' +
            'data-href="([\\s\\S]*?)href="([\\s\\S]*?)"[\\s\\S]*?'+
            '<span class="file_size">([\\s\\S]*?)</span>';
        var re = new RegExp(regex, "g");
        var match = re.exec(doc);
        while (match) {
           fileLink = match[5];
           //if (match[4].indexOf('Функция временно недоступна') != -1) {
           //    if (first == 0) {
           //        var film_id = match[1].match(/film_id=([\s\S]*?)&/)[1];
           //        page.loading = true;
           //        links = showtime.httpReq(BASE_URL + '/check/index/list?film=' + film_id + '&folder='+ id + '&q=' + quality).toString();
           //        page.loading = false;
           //        first++;
           //    }
           //    var regex = new RegExp(trim(match[2])+'[\\s\\S]*?class="downloads_link">([\\s\\S]*?)</a>');
           //    fileLink = links.match(regex)[1];
           //}
           page.appendItem(videoparams(fileLink, escape(trim(match[2])), title), 'video', {
               title: new showtime.RichText(trim(match[2]) + (trim(match[6]) ? colorStr(trim(match[6]), blue): '')),
               description: match[3]
           });
           match = re.exec(doc);
        }
    });

    plugin.addURI(PREFIX + ":showScreenshots:(.*):(.*)", function(page, screenshots, title) {
        setPageHeader(page, unescape(title));

        var trailer = doc.match(/<div class="buttons film">([\s\S]*?)class="trailer/);
        if (trailer) { // .replace(/\s/g,'%20')
            page.appendItem(escape(trailer[1].match(/rel="([\s\S]*?)"/)[1]).replace('%3A',':'), 'video', {
                title: 'Трейлер'
            });
        }

        var re = /href="([\s\S]*?)">/g;
        screenshots = unescape(screenshots);
        var match = re.exec(screenshots);
        var c = 1;
        while (match) {
            page.appendItem(BASE_URL + escape(match[1]), 'image', {
                title: 'Скриншот' + c,
                icon: BASE_URL + escape(match[1])
            });
            c++;
            match = re.exec(screenshots);
        }
    });

    function scrapeSmall(page, url, title, paginator) {
        setPageHeader(page, title);
        page.entries = 0;
        var fromPage = 1, tryToSearch = true;

        //1-info, 2-year, 3-genre, 4-link, 5-title, 6-icon, 7-added, 8-views,
        //9-rating, 10-quality
        var re = /<div class="item">([\s\S]*?)<div class="smoll_year">([\s\S]*?)<\/div>[\s\S]*?<div class="smoll_janr">([\s\S]*?)<\/div>[\s\S]*?<a href="([\s\S]*?)">[\s\S]*?<img alt="([\s\S]*?)" [\s\S]*?src="([\s\S]*?)"[\s\S]*?<span[\s\S]*?>([\s\S]*?)<\/span>[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<div class="rating([\s\S]*?)<\/div>[\s\S]*?<span class="quality[\s\S]*?">([\s\S]*?)<\/span>/g;
        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var doc;
            if (paginator == '1')
                doc = showtime.httpReq(unescape(url) + fromPage).toString();
            else
                doc = showtime.httpReq(unescape(url)).toString();
            page.loading = false;
            var match = re.exec(doc);
            while (match) {
              if (match[5] != '${name}') {
                var rating = match[9].match(/<span class="green">/g);
                var info = match[1].match(/<div class="item_name_text">([\s\S]*?)<\/div>/);
                page.appendItem(PREFIX + ":indexItem:" + match[4] + ":" + escape(match[5]), 'video', {
                    title: new showtime.RichText((match[10] ? coloredStr(match[10], blue) + ' ' : '') + trim(match[5])),
                    icon: BASE_URL + escape(match[6]),
                    rating:  rating ? rating.length * 10 : 0,
                    genre: trim(match[3]),
                    year: +trim(match[2]),
                    description: new showtime.RichText(coloredStr("Добавлен: ", orange) +
                        trim(match[7]) + coloredStr(" Просмотров: ", orange) + match[8] +
                        (info ? coloredStr("<br>Инфо: ", orange) + trim(info[1]) : ''))
                });
                page.entries++;
              }
              match = re.exec(doc);
            };
            if (!doc.match(/class="next"/)) return tryToSearch = false;
            fromPage++;
            return true;
        };
        loader();
        page.paginator = loader;
        if (page.entries == 0)
            page.error("По заданному запросу ничего не найдено");
    }

    plugin.addURI(PREFIX + ":scrapeSmall:(.*):(.*):(.*)", function(page, url, title, paginator) {
        scrapeSmall(page, url, unescape(title), paginator);
    });

    plugin.addURI(PREFIX + ":processJSON:(.*):(.*)", function(page, url, title) {
        setPageHeader(page, unescape(title));
        var json = showtime.JSONDecode(showtime.httpReq(unescape(url)).toString());
        for (var n in json) {
            page.appendItem(PREFIX + ":indexItem:/film?id=" + json[n].page_id +
                    "&nameforhref="+json[n].nameforhref +
                    "&name=" + json[n].name_for_url, 'video', {
                title: new showtime.RichText((json[n].quality ? coloredStr(json[n].quality, blue) + ' ' : '') + trim(unescape(json[n].name))),
                icon: BASE_URL + escape(json[n].src),
                rating:  json[n].rait * 10,
                genre: unescape(json[n].janr),
                year: +json[n].year,
                description: new showtime.RichText(coloredStr("Добавлен: ", orange) +
                    json[n].date_create + coloredStr(" Просмотров: ", orange) + json[n].count_prosmotr +
                    (json[n].inform ? coloredStr("<br>Инфо: ", orange) + trim(json[n].inform) : ''))
            });
        }
    });

    plugin.addURI(PREFIX + ":indexItem:(.*)", function(page, url) {
        page.loading = true;
        doc = showtime.httpReq(BASE_URL + url).toString();
        page.loading = false;
        var title = doc.match(/<title>([\s\S]*?)<\/title>/)[1];
        setPageHeader(page, title);

        // 1-title, 2-icon, 3-views, 4-comments, 5-screenshots, 6-quality,
        // 7-genre, 8-year, 9-country, 10-director, 11-soundtrack, 12-duration,
        // 13-actors, 14-description, 15-added by, 16-info, 17-rating
        var re = /<div class="content_open">[\s\S]*?<img alt="([\s\S]*?)" [\s\S]*?src="([\s\S]*?)"[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<div class="screens">([\s\S]*?)<div class="item_right">[\s\S]*?<div class="quality_film"([\s\S]*?)<\/div>[\s\S]*?<div class="section_item list_janr">([\s\S]*?)<\/div>[\s\S]*?href="#">([\s\S]*?)<\/a>[\s\S]*?<span class="item">([\s\S]*?)<\/span>[\s\S]*?<div class="span_content">([\s\S]*?)<\/div>[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<div class="ava_actors"([\s\S]*?)<div class="section_item">[\s\S]*?<div class="description">([\s\S]*?)<\/div>[\s\S]*?<span>([\s\S]*?)<\/span>([\s\S]*?)<div class="rait_other">[\s\S]*?<span class="green">([\s\S]*?)<\/span>/g;
        var match = re.exec(doc);
        while (match) {
            // scraping genres list
            var re2 = /href="#">([\s\S]*?)<\/a>/g;
            var genre = '', first = 0, genres = match[7], year = match[8];
            if (match[7]) {
                var match2 = re2.exec(match[7]);
                while (match2) {
                    if (!first) {
                        genre += trim(match2[1]);
                        first++;
                    } else
                        genre += ', ' + trim(match2[1]);
                    match2 = re2.exec(match[7]);
                }
            }
            // scraping directors
            var directorList;
            if (match[10]) {
                directorList = match[10];
                var directors = '', first = 0;
                re2 = /<span class="regiser_item">([\s\S]*?)<\/span>/g;
                match2 = re2.exec(match[10]);
                if (!match2) {
                    re2 = /<span title="" alt="" >([\s\S]*?)<\/span>/g;
                    match2 = re2.exec(match[10]);
                }
                while (match2) {
                    if (!first) {
                        directors += trim(match2[1]);
                        first++;
                    } else
                        directors += ', ' + trim(match2[1]);
                    match2 = re2.exec(match[10]);
                }
            }

            // scraping actors list
            var actorList;
            if (match[13]) {
                actorList = match[13];
                var actors = '', first = 0;
                re2 = /<div class="actors_content">([\s\S]*?)<\/div>/g;
                match2 = re2.exec(match[13]);
                while (match2) {
                    if (!first) {
                        actors += trim(match2[1]);
                        first++;
                    } else
                        actors += ', ' + trim(match2[1]);
                    match2 = re2.exec(match[13]);
                }
            }
            var info = match[16].match(/<div class="new_series">([\s\S]*?)<\/div>/);
            page.appendItem(PREFIX + ":showScreenshots:" + escape(match[5]) + ':' + escape(match[1]), 'video', {
                title: new showtime.RichText(trim(match[1])),
                icon: BASE_URL + escape(match[2]),
                genre: genre,
                year: +match[8],
                rating: match[17] * 10,
                duration: match[12],
                description: new showtime.RichText(coloredStr("Просмотров: ", orange) +
                    trim(match[3]) + coloredStr(" Комментариев: ", orange) + match[4] +
                    coloredStr(" Добавил: ", orange) + match[15] +
                    coloredStr("<br>Страна: ", orange) + match[9] +
                    coloredStr("<br>Режиссер: ", orange) + directors +
                    //coloredStr("<br>Актеры: ", orange) + actors +
                    coloredStr("<br>Перевод: ", orange) + match[11] +
                    (info ? coloredStr("<br>Инфо: ", orange) + trim(info[1]) : '') +
                    coloredStr("<br>Описание: ", orange) + trim(match[14]))
            });
            match = re.exec(doc);
        }

        // show schedule
        var grafik = doc.match(/<div class="accordion_content_item grafiks_content">([\s\S]*?)<\/div>/);
        if (grafik) {
            page.appendPassiveItem('video', '', {
                title: 'График выхода серий',
                description: new showtime.RichText(trim(grafik[1]).replace(/<br \/>/g, '<br>').replace(/<div>/g, '<br>').replace(/&nbsp;/g, ''))
            });
            page.appendItem("", "separator");
        }

        // 1-folder id, 2-title, 3-resolution's list
        re = /<div class="accordion_head folder_name" data-folder="([\s\S]*?)">[\s\S]*?title="([\s\S]*?)"([\s\S]*?)<\/select>/g;
        match = re.exec(doc);
        while (match) {
            re2 = /<option value=[\s\S]*?>([\s\S]*?)<\/option>/g;
            match2 = re2.exec(match[3]);
            while (match2) {
                page.appendItem(PREFIX + ":listFolder:" + match[1] + ':' + match2[1] + ':' + escape(match[2]), 'directory', {
                    title: '(' + match2[1] + ') ' + match[2]
                });
                match2 = re2.exec(match[3]);
            }
            match = re.exec(doc);
        }

        // show related & similar
        var filmTabs = doc.match(/<div class="film_tabs">([\s\S]*?)<\/div>/);
        if (filmTabs) {
            page.appendItem("", "separator");
            var another = filmTabs[1].match(/data-tabs="another" data-film_id="([\s\S]*?)"/);
            page.appendItem(PREFIX + ":scrapeSmall:" + escape(BASE_URL + '/film/index/another?id=' + another[1])+':'+escape('Другие части - '+title)+':0', 'directory', {
                title: 'Другие части'
            });

            var poxog = filmTabs[1].match(/data-tabs="poxog" data-film_id="([\s\S]*?)" data-janr_id="([\s\S]*?)" data-page_type="([\s\S]*?)" data-first_country_id="([\s\S]*?)">/);
            page.appendItem(PREFIX + ":scrapeSmall:" + escape(BASE_URL + '/film/index/poxog?id=' + poxog[1] + '&janr_id=' + escape(poxog[2]) + '&page_type=' + poxog[3] + '&first_country_id=' + poxog[4])+':'+escape('Похожие фильмы - ' + title)+':0', 'directory', {
                title: 'Похожие фильмы'
            });
        }

        if (year) {
            page.appendItem("", "separator", {
                title: 'Год'
            });
            page.appendItem(PREFIX + ":scrapeSmall:" + escape(BASE_URL + '/search/index/index/year1/'+year+'/year2/'+year+'/page/')+':'+escape('Отбор по году ' + year)+':1', 'directory', {
                title: year
            });
        }

        // show genres
        if (genres) {
            page.appendItem("", "separator", {
                title: 'Жанр'
            });
            //1-value, 2-param name, 3-razdel, 4-name
            re2 = /<a class="fast_search" rev="([\s\S]*?)" rel="([\s\S]*?)" data-module="([\s\S]*?)" href="#">([\s\S]*?)<\/a>/g;
            match = re2.exec(genres);
            while (match) {
                page.appendItem(PREFIX + ":scrapeSmall:" + escape(BASE_URL + '/search/index/index/janrs/'+match[1]+'/janr_first/'+match[1]+'/razdel/'+match[3]+'/page/')+':'+escape('Отбор по жанру '+trim(match[4]))+':1', 'directory', {
                    title: trim(match[4])
                });
                match = re2.exec(genres);
            }
        }

        // show directors
        if (directorList) {
            first = 0;
            re2 = /<span class="register_ava"[\s\S]*?data-reg-id="([\s\S]*?)"[\s\S]*?data-img="([\s\S]*?)">[\s\S]*?<span class="regiser_item">([\s\S]*?)<\/span>/g;
            match = re2.exec(directorList);
            while (match) {
                if (!first) {
                    page.appendItem("", "separator", {
                        title: 'Режиссеры'
                    });
                    first++;
                }
                page.appendItem(PREFIX + ":processJSON:" + escape(BASE_URL + '/film/index/find?reg_id='+match[1]+'&type=reg')+':'+escape('Фильмы с режиссером '+match[3]), 'video', {
                    title: trim(match[3]),
                    icon: BASE_URL + escape(match[2])
                });
                match = re2.exec(directorList);
            }
        }

        // show actors
        if (actorList) {
            page.appendItem("", "separator", {
                title: 'Актеры'
            });
            re2 = /<div class="actors_img">[\s\S]*?rel="([\s\S]*?)"><img alt="([\s\S]*?)" src="([\s\S]*?)"/g;
            match = re2.exec(actorList);
            while (match) {
                page.appendItem(PREFIX + ":processJSON:" + escape(BASE_URL + '/film/index/find?actor_id='+match[1])+':'+escape('Фильмы с '+match[2]), 'video', {
                    title: trim(match[2]),
                    icon: BASE_URL + escape(match[3])
                });
                match = re2.exec(actorList);
            }
        }

        // show comments
        var comments = doc.match(/<div class="comment big">([\s\S]*?)<script type="text/);
        if (comments) {
            page.appendItem("", "separator", {
                title: 'Комментарии'
            });
            // 1-icon, 2-nick, 3-date, 4-likes up, 5-likes down, 6-text, 7-time
            re2 = /<div class="left">[\s\S]*?src="([\s\S]*?)" alt="([\s\S]*?)"[\s\S]*?_date">([\s\S]*?)<[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<div class="right_text">([\s\S]*?)<\/div>[\s\S]*?<div class="answer">([\s\S]*?)<\/div>/g;
            match = re2.exec(comments[1]);
            while (match) {
                if (trim(match[3]))
                    var date = match[3]
                else
                    var date = match[7].match(/<span class="time">([\s\S]*?)<\/span>/)[1];
                page.appendPassiveItem('video', '', {
                    title: new showtime.RichText(trim(match[2]) + ' (' + coloredStr(match[4], green) + ' / ' + coloredStr(match[5], red) + ') ' + trim(date)),
                    icon: BASE_URL + escape(match[1]),
                    description: new showtime.RichText(match[6])
                });
                match = re2.exec(comments[1]);
            }
        }
    });

    function scrape(page, url, title) {
        setPageHeader(page, unescape(title));
        page.entries = 0;
        var fromPage = 1, tryToSearch = true;
        //1-link, 2-title, 3-icon, 4-added, 5-views, 6-rating, 7-quality, 8-genre,
        //9-year, 10-country, 11-director, 12-actors, 13-translation, 14-duration,
        //15-description, 16-info
        var re = /<div class="item open">[\s\S]*?<a href="([\s\S]*?)">[\s\S]*?<img alt="([\s\S]*?)" [\s\S]*?src="([\s\S]*?)"[\s\S]*?<span class="[\s\S]*?">([\s\S]*?)<\/span>[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<div class="rating">([\s\S]*?)<\/div>[\s\S]*?<span class="quality[\s\S]*?">([\s\S]*?)<\/span>[\s\S]*?Жанр<\/span>([\s\S]*?)<\/span>[\s\S]*?rel="year1" href="#">([\s\S]*?)<\/a>[\s\S]*?<span class="section_item_list">([\s\S]*?)<\/span>[\s\S]*?<span class="section_item_list">([\s\S]*?)<\/span>[\s\S]*?<span class="section_item_list">([\s\S]*?)<\/span>[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<div class="description">([\s\S]*?)<\/div>([\s\S]*?)<div class="add_to">/g;

        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var doc = showtime.httpReq(BASE_URL + '/default/index/list'+ url +'sortType=new&type=list&page='+fromPage).toString();
            page.loading = false;
            var htmlBlock  = doc.match(/<div class="main_content_open"([\s\S]*?)<div class="give_more"/)[1];

            var match = re.exec(htmlBlock);
            while (match) {
                var re2 = /href="#">([\s\S]*?)<\/a>/g;
                var genre = '';
                if (match[8]) {
                    var match2 = re2.exec(match[8]);
                    while (match2) {
                        genre += match2[1];
                        match2 = re2.exec(match[8]);
                    }
                }
                var rating = match[6].match(/<span class="green">/g);
                var info = match[16].match(/<div class="item_inform_text fl_left">([\s\S]*?)<\/div>/);
                page.appendItem(PREFIX + ":indexItem:" + match[1], 'video', {
                    title: new showtime.RichText((match[7] ? coloredStr(match[7], blue) + ' ' : '') + trim(match[2])),
                    icon: BASE_URL + escape(match[3]),
                    rating:  rating ? rating.length * 10 : 0,
                    genre: genre,
                    year: +match[9],
                    duration: match[14],
                    description: new showtime.RichText(coloredStr("Добавлен: ", orange) +
                        trim(match[4]) + coloredStr(" Просмотров: ", orange) + match[5] +
                        coloredStr("<br>Страна: ", orange) + match[10] +
                        coloredStr("<br>Режиссер: ", orange) + match[11] +
                        coloredStr("<br>Актеры: ", orange) + match[12] +
                        coloredStr("<br>Перевод: ", orange) + match[13] +
                        (info ? coloredStr("<br>Инфо: ", orange) + trim(info[1]) : '') +
                        coloredStr("<br>Описание: ", orange) + trim(match[15]))
                });
                page.entries++;
                match = re.exec(htmlBlock);
            }
            if (!doc.match(/<a href="#">Показать ещё<\/a>/)) return tryToSearch = false;
            fromPage++;
            return true;
        }
        loader();
        page.paginator = loader;
    }

    plugin.addURI(PREFIX + ":submenu:(.*):(.*)", function(page, url, title) {
        scrape(page, url + '&', title);
    });

    plugin.addURI(PREFIX + ":comments", function(page) {
        setPageHeader(page, 'Последние отзывы');

        var fromPage = 1, tryToSearch = true;
        //1-link, 2-title, 3-comment, 4-author
        var re = /class="right_comment_item_name">[\s\S]*?<a href="([\s\S]*?)">([\s\S]*?)<\/a>[\s\S]*?class="right_comment_item_text">([\s\S]*?)<\/p>[\s\S]*?<\/span>([\s\S]*?)<\/a>/g;

        function loader() {
            if (!tryToSearch) return false;
            var items = 0;
            page.loading = true;
            var doc = showtime.httpReq(BASE_URL+ '/default/index/getcomment?page='+fromPage).toString();
            page.loading = false;
            var match = re.exec(doc);
            while (match) {
                page.appendItem(PREFIX + ":indexItem:" + match[1], 'video', {
                    title: new showtime.RichText(trim(match[2])),
                    description: new showtime.RichText(coloredStr("Комментарий: ", orange) +
                        trim(match[3]) + coloredStr(" Автор: ", orange) + trim(match[4]))
                });
                items++;
                match = re.exec(doc);
            }
            if (!items) return tryToSearch = false;
            fromPage++;
            return true;
        }
        loader();
        page.paginator = loader;
    });

    plugin.addURI(PREFIX + ":trailers", function(page) {
        setPageHeader(page, 'Скоро в кино');
        var doc = showtime.httpReq(BASE_URL+ '/default/index/trailers', {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        }).toString();
        //1 - link, 2 - title, 3-icon
        var re = /<a href="([\s\S]*?)" title="([\s\S]*?)">[\s\S]*?src="([\s\S]*?)">/g;
        var match = re.exec(doc);
        while (match) {
            page.appendItem(PREFIX + ":indexItem:" + match[1], 'video', {
               title: trim(match[2]),
               icon: BASE_URL + escape(match[3])
            });
            match = re.exec(doc);
        }
    });

    plugin.addURI(PREFIX + ":start", function(page) {
        setPageHeader(page, plugin.getDescriptor().synopsis);

        if (logged) {
             page.appendPassiveItem('file', '', {
                 title: new showtime.RichText(coloredStr(credentials.username, orange)
             )});
        } else
             page.appendPassiveItem('file', '', {
                 title: new showtime.RichText(coloredStr('Авторизируйтесь в настройках', orange))
             });

        page.loading = true;
        var doc = showtime.httpReq(BASE_URL).toString();
        page.loading = false;

        // Building menu
        var htmlBlock = doc.match(/<div class="top_menu"([\s\S]*?)<\/div>/);
        if (htmlBlock) {
            // 1 - nameforhref, 2 - title
            var re = /<a href="([\s\S]*?)">([\s\S]*?)</g;
            var match = re.exec(htmlBlock[1]);
            while (match) {
                page.appendItem(PREFIX + ":submenu:" + match[1]+ ':' + escape(match[2]), 'directory', {
                   title: trim(match[2])
                });
                match = re.exec(htmlBlock[1]);
            }
        }

        // Coming soon
        page.appendItem(PREFIX + ':trailers', "directory", {
            title: 'Скоро в кино'
        });

        // Comments reader
        page.appendItem(PREFIX + ':comments', "directory", {
            title: 'Последние отзывы'
        });

        // Building top 20
        htmlBlock = doc.match(/<div class="popular_content">([\s\S]*?)<\/div>/);
        if (htmlBlock) {
            page.appendItem("", "separator", {
                title: 'Топ-20'
            });
            //1 - link, 2 - title, 3-icon
            re = /<a href="([\s\S]*?)" title="([\s\S]*?)">[\s\S]*?src="([\s\S]*?)">/g;
            match = re.exec(htmlBlock[1]);
            while (match) {
                page.appendItem(PREFIX + ":indexItem:" + match[1], 'video', {
                   title: trim(match[2]),
                   icon: BASE_URL + escape(match[3])
                });
                match = re.exec(htmlBlock[1]);
            }
        }

        // Building list
        page.appendItem("", "separator");
        scrape(page, '?', escape(plugin.getDescriptor().synopsis));
    });

    plugin.addSearcher("Tree.tv", logo, function(page, query) {
        login(page, false);
        scrapeSmall(page, escape(BASE_URL + '/search/index/index/usersearch/' + encodeURI(query) + '/page/'), plugin.getDescriptor().id, 1);
    });
})(this);