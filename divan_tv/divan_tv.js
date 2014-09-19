/**
 * divan.tv plugin for Showtime
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
    var BASE_URL = 'http://p.divan.tv/jsonrpc';
    var logo = plugin.path + "logo.png";
    var baseClientKey = '6838b9dca903f24bbe1edc1e12dd795b';
    var logged = false, credentials, countryCode = 'UA';
    var login = null, userKey = null, user = null;

    function trim(s) {
        return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ").replace(/\t/, '');
    }

    var blue = '6699CC', orange = 'FFA500', red = 'EE0000', green = '008B45';

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    function setPageHeader(page, title) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
        if (!logged) loginAndGetConfig(page, false);
        page.loading = false;
    }

    function loginAndGetConfig(page, showDialog) {
        var text = '';
        if (showDialog) {
           text = 'Введите логин и пароль';
           logged = false;
        }

        if (!logged) {
            credentials = plugin.getAuthCredentials(getDescriptor().synopsis, text, showDialog);
            if (credentials && credentials.username && credentials.password) {
                page.loading = true;
                var reply = showtime.httpReq(BASE_URL, {
                    postdata: showtime.JSONEncode({
                        method: "loginUser",
                        Params: {
                            login:credentials.username,
                            password:credentials.password,
                            platform:'showtime',
                            baseClientKey:baseClientKey
                        }
                    })
                }).toString().replace(/\"/g, '');
                page.loading = false;
                if (reply) {
                    user = request(page, showtime.JSONEncode({
                        method: "getBaseUserData",
                        Params: {
                            login:credentials.username,
                            mobile:true,
                            userKey:reply
                        }
                    }));
                    //showtime.print(showtime.JSONEncode(user));
                    if (user.login) {
                        logged = true;
                        login = user.login;
                        userKey = reply;
                    }
                }
            }
        }
        if (showDialog) {
           if (logged) showtime.message("Вход успешно произведен. Параметры входа сохранены.", true, false);
           else showtime.message("Не удалось войти. Проверьте email/пароль...", true, false);
        }
    }

    var service = plugin.createService(getDescriptor().id, getDescriptor().id + ":start", "video", true, logo);

    var settings = plugin.createSettings(getDescriptor().id, logo, getDescriptor().synopsis);
    settings.createAction(getDescriptor().id+'_login', 'Войти в ' + getDescriptor().id, function() {
        loginAndGetConfig(0, true);
    });

    function getTime(tStamp) {
        var a = new Date(tStamp*1000);
        return (a.getHours() < 10 ? a.getHours() + '0' : a.getHours()) + ':' +
            (a.getMinutes() < 10 ? a.getMinutes() + '0' : a.getMinutes());
    }

    plugin.addURI(getDescriptor().id + ":getChannelInfoById:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, unescape(title));
        var json = request(page, showtime.JSONEncode({
                        method: "getChannelInfoById",
                        Params: {
                            baseClientKey:baseClientKey,
                            id: +id,
                            login: login,
                            userKey: userKey,
                            ip:null,
                            mobile:true,
                            international:false
                        }
        }));
        var lnk = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            sources: [{
                url: "hls:" + (json.stream ? json.stream : json.preview_stream)
            }]
        });

        var tariffs = '';
            if (!+json.free)
                for (j in json.tariffs)
                    if (tariffs)
                        tariffs += ', ' + json.tariffs[j];
                    else
                        tariffs += json.tariffs[j];

        page.appendItem(lnk, 'video', {
              title: new showtime.RichText((+json.hd ? coloredStr('HD ', blue) : '') + json.name),
              description: new showtime.RichText((tariffs ? coloredStr('Доступно в пакетах: ', orange) + tariffs + '\n' : '') +
                    (json.description ? coloredStr('Описание: ', orange) + json.description : '')),
              icon: json.image,
              rating: json.rating*10
        });

        if (json.programs.current_program) {
            var first = true;
            for (i in json.programs.current_week)
                for (j in json.programs.current_week[i]) {
                    if (json.programs.current_program.day == json.programs.current_week[i][j].day &&
                        +json.programs.current_program.start == +json.programs.current_week[i][j].start) {
                        if (first)
                            page.appendItem("", "separator", {
                                title: 'Программа передач'
                            });
                        page.appendPassiveItem('file', '', {
                            title: new showtime.RichText(getTime(json.programs.current_week[i][j].start) + ' - ' +
                                getTime(json.programs.current_week[i][j].stop) + '  ' +
                                (first ? coloredStr(json.programs.current_week[i][j].title, orange) :
                                    json.programs.current_week[i][j].title))
                        });
                        first = false;
                    }
                }
        }
    });

    plugin.addURI(getDescriptor().id + ":getMovieInfoById:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, unescape(title));
        var json = request(page, showtime.JSONEncode({
                        method: "getMovieInfoById",
                        Params: {
                            baseClientKey:baseClientKey,
                            id: +id,
                            login: login,
                            userKey: userKey,
                            ip:null,
                            international:false,
                            mobile:true,
                            countryCode: countryCode
                        }
        }));

        for (var i in json.named_streams) {
            var lnk = "videoparams:" + showtime.JSONEncode({
                title: json.title_ru + (json.title_orig ? ' | ' + json.title_orig : '') + (json.named_streams[i].name && json.named_streams[i].name != json.title_ru ? ' - ' + json.named_streams[i].name : ''),
                canonicalUrl: getDescriptor().id + ':getMovieInfoById:' + i + ":" + title,
                sources: [{
                    url: json.named_streams[i].url
                }]
            });
            var genre = '';
            for (j in json.categories)
                if (genre)
                    genre += ', ' + json.categories[j];
                else
                    genre += json.categories[j];

            var tariffs = '';
            if (!+json.free)
                for (j in json.tariffs)
                    if (tariffs)
                        tariffs += ', ' + json.tariffs[j];
                    else
                        tariffs += json.tariffs[j];

            page.appendItem(lnk, 'video', {
                title: new showtime.RichText((+json.hd ? coloredStr('HD ', blue) : '') + json.title_ru + (json.title_orig ? ' | ' + json.title_orig : '') + (json.named_streams[i].name && json.named_streams[i].name != json.title_ru ? ' - ' + json.named_streams[i].name : '') + coloredStr(' (' + json.language + ')', orange)),
                icon: json.image,
                rating: json.rating*10,
                genre: genre,
                description: new showtime.RichText((+json.limited_sale ? coloredStr('Ограниченная распродажа\n', orange) : '') +
                    (tariffs ? coloredStr('Доступно в пакетах: ', orange) + tariffs + '\n' : '') +
                    (json.countries[0] ? coloredStr('Страна: ', orange) + json.countries[0] : '') +
                    (json.director ? coloredStr(' Режиссер: ', orange) + json.director : '') +
                    (json.actor ? coloredStr('\nВ ролях: ', orange) + json.actor : '') +
                    (json.descr ? coloredStr('\nОписание: ', orange) + json.descr : '')),
                year: +json.year
            });
        }
    });

    plugin.addURI(getDescriptor().id + ":getRadioInfoById:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, unescape(title));
        var json = request(page, showtime.JSONEncode({
                        method: "getRadioInfoById",
                        Params: {
                            id: +id,
                            baseClientKey:baseClientKey
                        }
        }));
        for (var i in json.streams) {
            page.appendItem('icecast:'+json.streams[i].stream, 'video', {
                title: new showtime.RichText(json.name + coloredStr(' (' + json.streams[i].name + ')', orange)),
                icon: json.image,
                rating: json.rating*10,
                genre: json.category_name,
                description: new showtime.RichText(coloredStr('Страна: ', orange) + json.country_name +
                    coloredStr('\nОписание: ', orange) + json.description.replace(/<br>/g, ''))
            });
        }
    });

    plugin.addURI(getDescriptor().id + ":paginator:(.*):(.*):(.*):(.*)", function(page, request, scroller, parser, title) {
        setPageHeader(page, unescape(title));
        var json, jsonPointer, totalItems, counter = 0, offset = 0, tryToSearch = true;
        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            if (!counter) {
                json = showtime.JSONDecode(showtime.httpReq(BASE_URL, {
                    postdata: showtime.JSONEncode({
                        method: request,
                        Params: {
                            isFree:null,
                            categoryIDs:null,
                            count:50,
                            needProgram:false,
                            mobile:true,
                            international:false,
                            baseClientKey:baseClientKey
                        }
                    })
                }));
                totalItems = json.count;
                page.metadata.title += ' (' + totalItems + ')';
                if (parser == 'getMovieInfoById')
                    jsonPointer = json.movies;
                else if (parser == 'getRadioInfoById')
                    jsonPointer = json.entries;
                else
                    jsonPointer = json.channels;
            } else {
                json = showtime.JSONDecode(showtime.httpReq(BASE_URL, {
                    postdata: showtime.JSONEncode({
                        method: scroller,
                        Params: {
                            isFree:null,
                            categoryIDs:null,
                            count:50,
                            offset:offset,
                            needProgram:false,
                            mobile:true,
                            international:false,
                            baseClientKey:baseClientKey
                        }
                    })
                }));
                jsonPointer = json;
            }
            page.loading = false;
            for (i in jsonPointer) {
                page.appendItem(getDescriptor().id + ':' + parser + ':' + jsonPointer[i].id + ':' + escape(jsonPointer[i].title_ru ? jsonPointer[i].title_ru : jsonPointer[i].name), 'video', {
                    title: (jsonPointer[i].title_ru ? jsonPointer[i].title_ru : jsonPointer[i].name),
                    icon: jsonPointer[i].image,
                    genre: jsonPointer[i].category_names,
                    year: (jsonPointer[i].year ? +jsonPointer[i].year : null),
                    rating: jsonPointer[i].rating * 10,
                    description: new showtime.RichText((jsonPointer[i].country ? coloredStr('Страна: ', orange) + jsonPointer[i].country : '') +
                        (jsonPointer[i].country_name ? coloredStr('Страна: ', orange) + jsonPointer[i].country_name : '') +
                        (jsonPointer[i].director ? coloredStr(' Режиссер: ', orange) + jsonPointer[i].director : '') +
                        (jsonPointer[i].actor ? coloredStr('\nВ ролях: ', orange) + jsonPointer[i].actor : ''))
                    });
                    counter++;
                }
            if (counter >= totalItems) return tryToSearch = false;
            offset += 50;
            return true;
        }
        loader();
        page.loading = false;
        page.paginator = loader;
    });

    function request(page, json) {
        page.loading = true;
        var result = showtime.JSONDecode(showtime.httpReq(BASE_URL, { postdata: json }));
        page.loading = false;
        return result;
    }

    plugin.addURI(getDescriptor().id + ":epg", function(page) {
        setPageHeader(page, 'ТВ программа');
        page.loading = true;
        // As we don't have reliable timestamp locally, let's get it from google.com
        var date = showtime.httpReq("http://google.com", {
            method: 'HEAD'
        }).headers.Date; // Sat, 20 Sep 2014 19:14:29 GMT
        // Getting the beginning of the day
        var day = "" + new Date(date.split(" ")[3], new Date(Date.parse(date)).getMonth(), date.split(" ")[1]) / 1000;
        // We get GMT and convert it to UTC
        var now = new Date(Date.UTC(date.split(" ")[3], new Date(Date.parse(date)).getMonth(), date.split(" ")[1],
            date.split(" ")[4].split(":")[0], date.split(" ")[4].split(":")[1], date.split(" ")[4].split(":")[2])).getTime()/1000.0;

        var json = request(page, showtime.JSONEncode({
            method: 'getFilteredChannelsAndNewFilters',
            Params: {
                isFree:null,
                categoryIDs:null,
                count:9999,
                needProgram:false,
                mobile:true,
                international:false,
                baseClientKey:baseClientKey
            }
        }));

        var channelIds = [];
        for (var i in json.channels)
            channelIds.push(json.channels[i].id);

        var epg = request(page, showtime.JSONEncode({
            method: 'getEpgByChannelIdsAndDay',
            Params: {
                channelIds:channelIds,
                day:day,
                baseClientKey:baseClientKey
            }
        }));

        for (var i in json.channels) {
            for (var j in epg) {
                for (var k in epg[j].morning) {
                    if (+epg[j].morning[k].start <= +now && +epg[j].morning[k].stop >= +now)
                        showtime.print(json.channels[i].name + ' ' + getTime(epg[j].morning[k].start) + ' - ' + getTime(epg[j].morning[k].stop) + '  ' + epg[j].morning[k].title_ru);
                }
                for (var k in epg[j].evening) {
                    if (+epg[j].evening[k].start <= +now && +epg[j].evening[k].stop >= +now)
                        showtime.print(json.channels[i].name + ' ' + getTime(epg[j].evening[k].start) + ' - ' + getTime(epg[j].evening[k].stop) + '  ' + epg[j].evening[k].title_ru);
                }
            }
        }
        page.loading = false;
    });

    plugin.addURI(getDescriptor().id + ":categories", function(page) {
        setPageHeader(page, getDescriptor().synopsis);

        page.appendItem("", "separator", {
            title: 'ТВ'
        });
        page.appendItem(getDescriptor().id + ':paginator:getFilteredChannelsAndNewFilters:getFilteredChannels:getChannelInfoById:'+escape('ТВ каналы'), 'directory', {
            title: 'ТВ каналы'
        });
        //page.appendItem(getDescriptor().id + ':epg', 'directory', {
        //    title: 'ТВ программа'
        //});

        page.appendItem("", "separator", {
            title: 'Видео'
        });
        page.appendItem(getDescriptor().id + ':paginator:getFilteredFilmsAndNewFilters:getFilteredFilms:getMovieInfoById:'+escape('Фильмы'), 'directory', {
            title: 'Фильмы'
        });
        page.appendItem(getDescriptor().id + ':paginator:getFilteredCartoonsAndNewFilters:getFilteredCartoons:getMovieInfoById:'+escape('Мультфильмы'), 'directory', {
            title: 'Мультфильмы'
        });
        page.appendItem(getDescriptor().id + ':paginator:getFilteredVideosAndNewFilters:getFilteredVideos:getMovieInfoById:'+escape('Передачи'), 'directory', {
            title: 'Передачи'
        });
        page.appendItem(getDescriptor().id + ':paginator:getFilteredFestivalFilmsAndNewFilters:getFilteredFestivalFilms:getMovieInfoById:'+escape('Короткометражки'), 'directory', {
            title: 'Короткометражки'
        });
        page.appendItem(getDescriptor().id + ':paginator:getFilteredSportAndNewFilters:getFilteredSport:getMovieInfoById:'+escape('Спорт'), 'directory', {
            title: 'Спорт'
        });
        page.appendItem(getDescriptor().id + ':paginator:getFilteredEducationVideoAndNewFilters:getFilteredEducationVideo:getMovieInfoById:'+escape('Обучающее видео'), 'directory', {
            title: 'Обучающее видео'
        });

        page.appendItem("", "separator", {
            title: 'Музыка'
        });
        page.appendItem(getDescriptor().id + ':paginator:getFilteredRadioAndNewFilters:getFilteredRadio:getRadioInfoById:'+escape('Радио'), 'directory', {
            title: 'Радио'
        });
        page.appendItem(getDescriptor().id + ':paginator:getFilteredMusicAlbumsAndNewFilters:getFilteredMusicAlbums:getMovieInfoById:'+escape('Альбомы'), 'directory', {
            title: 'Альбомы'
        });
        page.appendItem(getDescriptor().id + ':paginator:getFilteredMusicVideosAndNewFilters:getFilteredMusicVideos:getMovieInfoById:'+escape('Клипы'), 'directory', {
            title: 'Клипы'
        });


    });

    plugin.addURI(getDescriptor().id + ":start", function(page) {
        setPageHeader(page, getDescriptor().synopsis);
        if (logged) {
             page.appendPassiveItem('video', '', {
                 title: new showtime.RichText(coloredStr(user.email ? user.email : user.login, orange) + ' (' + countryCode.replace(/\"/g, '') + ')'),
                 description: new showtime.RichText(coloredStr('ID: ', orange) + user.user_id +
                     coloredStr('\nЛогин: ', orange) + user.login +
                     coloredStr('\nEmail: ', orange) + user.email +
                     coloredStr('\nИмя: ', orange) + user.first_name +
                     coloredStr('\nФамилия: ', orange) + user.last_name +
                     coloredStr('\nБаланс: ', orange) + user.balance +
                     coloredStr('\nТестовый период: ', orange) + (user.test_period ? 'Да' : 'Нет'))
             });
        } else {
             page.appendPassiveItem('file', '', {
                 title: new showtime.RichText(coloredStr('Авторизация не проведена', orange))
             });
        }

        page.loading = true;
        countryCode = showtime.httpReq(BASE_URL, {
            postdata: showtime.JSONEncode({
                method: "getCountryCodeByIp",
                Params: {
                    baseClientKey:baseClientKey
                }
            })
        }).toString();

        if (countryCode.match(/error/)) {
            page.error("Sorry, can't run plugin on this device :(");
            return;
        }

        page.appendItem(getDescriptor().id + ':categories', 'directory', {
            title: 'Категории'
        });

        // channels
        var json = request(page, showtime.JSONEncode({
                        method: "getInterestingChannels",
                        Params: {
                            count: 5,
                            offset: 0,
                            mobile:true,
                            countryCode: countryCode,
                            international:false,
                            baseClientKey:baseClientKey
                        }
        }));
        page.appendItem("", "separator", {
            title: 'Популярные каналы'
        });
        for (var i in json) {
            page.appendItem(getDescriptor().id + ':getChannelInfoById:' + json[i].id + ':' + escape(json[i].name), 'video', {
                title: json[i].name,
                icon: json[i].image
            });
        }
        page.appendItem(getDescriptor().id + ':paginator:getFilteredChannelsAndNewFilters:getFilteredChannels:getChannelInfoById:'+escape('ТВ каналы'), 'directory', {
            title: 'Все ►'
        });

        // movies
        var json = request(page, showtime.JSONEncode({
                        method: "getNewFilms",
                        Params: {
                            count: 5,
                            mobile:true,
                            countryCode: countryCode,
                            international:false,
                            baseClientKey:baseClientKey
                        }
        }));
        page.appendItem("", "separator", {
            title: 'Новые фильмы'
        });
        for (var i in json) {
            page.appendItem(getDescriptor().id + ':getMovieInfoById:' + json[i].id + ':' + escape(json[i].title_ru), 'video', {
                title: json[i].title_ru,
                year: +json[i].year,
                genre: json[i].category_name,
                rating: json[i].rating * 10,
                icon: json[i].image,
                description: new showtime.RichText(coloredStr('Страна: ', orange) + json[i].country)
            });
        }
        page.appendItem(getDescriptor().id + ':paginator:getFilteredFilmsAndNewFilters:getFilteredFilms:getMovieInfoById:'+escape('Фильмы'), 'directory', {
            title: 'Все ►'
        });

        // cartoons
        var json = request(page, showtime.JSONEncode({
                        method: "getRandomCartoons",
                        Params: {
                            count: 5,
                            countryCode: countryCode,
                            international:false,
                            baseClientKey:baseClientKey
                        }
        }));
        page.appendItem("", "separator", {
            title: 'Популярные мультфильмы'
        });
        for (var i in json) {
            page.appendItem(getDescriptor().id + ':getMovieInfoById:' + json[i].id + ':' + escape(json[i].title_ru), 'video', {
                title: json[i].title_ru,
                year: +json[i].year,
                genre: json[i].category_name,
                rating: json[i].rating * 10,
                icon: json[i].image,
                description: new showtime.RichText(coloredStr('Страна: ', orange) + json[i].country)
            });
        }
        page.appendItem(getDescriptor().id + ':paginator:getFilteredCartoonsAndNewFilters:getFilteredCartoons:getMovieInfoById:'+escape('Мультфильмы'), 'directory', {
            title: 'Все ►'
        });

        // Radios
        var json = request(page, showtime.JSONEncode({
                        method: "getPopularRadio",
                        Params: {
                            count: 5,
                            mobile:true,
                            baseClientKey:baseClientKey
                        }
        }));
        page.appendItem("", "separator", {
            title: 'Популярные радиостанции'
        });
        for (var i in json) {
            page.appendItem(getDescriptor().id + ':getRadioInfoById:' + json[i].id + ':' + escape(json[i].name), 'video', {
                title: json[i].name,
                genre: json[i].category_name,
                rating: json[i].rating * 10,
                icon: json[i].image
            });
        }
        page.appendItem(getDescriptor().id + ':paginator:getFilteredRadioAndNewFilters:getFilteredRadio:getRadioInfoById:'+escape('Радио'), 'directory', {
            title: 'Все ►'
        });
    });
    plugin.addSearcher(getDescriptor().id, logo, function(page, query) {
        if (!logged) loginAndGetConfig(page, false);
        var totalItems, offset = 0, tryToSearch = true;
        page.entries = 0;
        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var json = request(page, showtime.JSONEncode({
                method: "complexSearch",
                Params: {
                    phrase:query,
                    count:30,
                    offset:offset,
                    mobile:true,
                    countryCode:countryCode,
                    baseClientKey:baseClientKey
                }
            }));
            page.loading = false;
            for (var i in json.items) {
                var parser = json.items[i].type;
                if (parser == 'video')
                    parser = 'getMovieInfoById';
                else if (parser == 'radio')
                    parser = 'getRadioInfoById';
                else if (parser == 'channel')
                    parser = 'getChannelInfoById';
                else showtime.print(showtime.JSONEncode(json.items[i]));

                page.appendItem(getDescriptor().id + ':' + parser + ':' + json.items[i].id + ':' + (json.items[i].title_ru ? escape(json.items[i].title_ru) : escape(json.items[i].name)), 'video', {
                    title: (json.items[i].title_ru ? json.items[i].title_ru : json.items[i].name),
                    icon: json.items[i].image,
                    genre: json.items[i].category_name + (json.items[i].module_name ? ', ' + json.items[i].module_name : ''),
                    year: (json.items[i].year ? +json.items[i].year : null),
                    rating: json.items[i].rating * 10,
                    description: new showtime.RichText((json.items[i].country ? coloredStr('Страна: ', orange) + json.items[i].country : '') +
                        (json.items[i].director ? coloredStr(' Режиссер: ', orange) + json.items[i].director : '') +
                        (json.items[i].actor ? coloredStr('\nВ ролях: ', orange) + json.items[i].actor : ''))
                });
                page.entries++;
            }

            if (page.entries >= json.count) return tryToSearch = false;
            offset += 30;
            return true;
        }
        loader();
        page.loading = false;
        page.paginator = loader;
    });
})(this);