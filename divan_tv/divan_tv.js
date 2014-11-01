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
            credentials = plugin.getAuthCredentials(plugin.getDescriptor().synopsis, text, showDialog);
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

    var service = plugin.createService(plugin.getDescriptor().id, plugin.getDescriptor().id + ":start", "video", true, logo);

    var settings = plugin.createSettings(plugin.getDescriptor().id, logo, plugin.getDescriptor().synopsis);
    settings.createAction(plugin.getDescriptor().id+'_login', 'Войти в ' + plugin.getDescriptor().id, function() {
        loginAndGetConfig(0, true);
    });


    function getTimePeriod(timestamp) {
        var a = new Date((+timestamp + 10800 + new Date().getTimezoneOffset() * 60) * 1000);
        return ((a.getHours() < 10 ? '0' + a.getHours() : a.getHours()) + ':' +
            (a.getMinutes() < 10 ? '0' + a.getMinutes() : a.getMinutes()));
    }

    function showEpg(page, json, day, start) {
            var first = true;
            for (i in json)
                for (j in json[i]) {
                    if (day == json[i][j].day &&
                        start <= json[i][j].start) {
                        if (first)
                            page.appendItem("", "separator", {
                                title: 'Программа передач'
                            });
                            page.appendPassiveItem('file', '', {
                                title: new showtime.RichText(getTimePeriod(json[i][j].start) + ' - ' +
                                    getTimePeriod(json[i][j].stop) + '  ' +
                                    (first ? coloredStr(json[i][j].title, orange) :
                                        json[i][j].title))
                            });
                            first = false;
                        }
                    }
    }

    plugin.addURI(plugin.getDescriptor().id + ":getChannelInfoById:(.*):(.*)", function(page, id, title) {
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
        //showtime.print(showtime.JSONEncode(json));
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
        //showtime.print(showtime.JSONEncode(json));
        page.appendItem(lnk, 'video', {
              title: new showtime.RichText((json.stream ? '' : coloredStr('$', orange)) + (+json.hd ? coloredStr('HD ', blue) : '') + json.name),
              description: new showtime.RichText((tariffs ? coloredStr('Доступно в пакетах: ', orange) + tariffs + '\n' : '') +
                    (json.description ? coloredStr('Описание: ', orange) + json.description : '')),
              icon: json.image,
              rating: json.rating*10
        });

        if (json.programs.current_program) {
            showEpg(page, json.programs.current_week, json.programs.current_program.day, json.programs.current_program.start);
            showEpg(page, json.programs.previous_week, json.programs.current_program.day, json.programs.current_program.start);
            showEpg(page, json.programs.next_week, json.programs.current_program.day, json.programs.current_program.start);
        }
    });

    // Search IMDB ID by title
    function getIMDBid(title) {
        var resp = showtime.httpReq('http://www.imdb.com/find?ref_=nv_sr_fn&q=' + encodeURIComponent(showtime.entityDecode(unescape(title)))+'')+'';
        var imdbid = resp.match(/<a href="\/title\/(tt\d+)\//);
        if (imdbid) return imdbid[1];
        return imdbid;
    };

    plugin.addURI(plugin.getDescriptor().id + ":getMovieInfoById:(.*):(.*)", function(page, id, title) {
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
        //showtime.print(showtime.JSONEncode(json));
        for (var i in json.named_streams) {
            var lnk = "videoparams:" + showtime.JSONEncode({
                title: json.title_ru + (json.title_orig ? ' | ' + json.title_orig : '') + (json.named_streams[i].name && json.named_streams[i].name != json.title_ru ? ' - ' + json.named_streams[i].name : ''),
                canonicalUrl: plugin.getDescriptor().id + ':getMovieInfoById:' + i + ":" + title,
                imdbid: getIMDBid(title),
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
                title: new showtime.RichText((json.preview ? coloredStr('$', orange) : '') + (+json.hd ? coloredStr('HD ', blue) : '') + json.title_ru + (json.title_orig ? ' | ' + json.title_orig : '') + (json.named_streams[i].name && json.named_streams[i].name != json.title_ru ? ' - ' + json.named_streams[i].name : '') + coloredStr(' (' + json.language + ')', orange)),
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

    plugin.addURI(plugin.getDescriptor().id + ":getRadioInfoById:(.*):(.*)", function(page, id, title) {
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

    plugin.addURI(plugin.getDescriptor().id + ":paginator:(.*):(.*):(.*):(.*)", function(page, request, scroller, parser, title) {
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
                page.appendItem(plugin.getDescriptor().id + ':' + parser + ':' + jsonPointer[i].id + ':' + escape(jsonPointer[i].title_ru ? jsonPointer[i].title_ru : jsonPointer[i].name), 'video', {
                    title: new showtime.RichText((jsonPointer[i].free ? coloredStr('►', green) : '') + (jsonPointer[i].title_ru ? jsonPointer[i].title_ru : jsonPointer[i].name)),
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

    plugin.addURI(plugin.getDescriptor().id + ":epg", function(page) {
        setPageHeader(page, 'ТВ гид');
        page.loading = true;

        // As we don't have reliable timestamp locally, let's get it from google.com
        var now = showtime.httpReq("http://google.com", {
            method: 'HEAD'
        }).headers.Date;
        showtime.trace('Google time: ' + now + ', Local time: ' + new Date(now) + ', Offset: ' + now.getTimezoneOffset());
        now = new Date(now);

        // Getting the beginning of the day. Server has GMT-3 time difference let's correct that
        var day = "" + (new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).getTime() / 1000 + now.getTimezoneOffset() * 60);
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

        function getChNameByID(id) {
            var name = '';
            for (var i in json.channels)
                if (json.channels[i].id == id) {
                    name = json.channels[i].name
                    break;
                }
            return name;
        }

        for (var i in epg)
            if (epg[i].current_program) {
                var chName = getChNameByID(i);
                page.appendItem(plugin.getDescriptor().id + ":getChannelInfoById:" + i + ':' + escape(chName), 'file', {
                    title: new showtime.RichText(chName + ' ' + getTimePeriod(epg[i].current_program.start) + ' - ' +
                        getTimePeriod(epg[i].current_program.stop) + '  ' +
                        coloredStr(epg[i].current_program.title_ru, orange))
                });
            }

        page.loading = false;
    });

    plugin.addURI(plugin.getDescriptor().id + ":categories", function(page) {
        setPageHeader(page, plugin.getDescriptor().synopsis);

        page.appendItem("", "separator", {
            title: 'ТВ'
        });
        page.appendItem(plugin.getDescriptor().id + ':paginator:getFilteredChannelsAndNewFilters:getFilteredChannels:getChannelInfoById:'+escape('ТВ каналы'), 'directory', {
            title: 'ТВ каналы'
        });

        page.appendItem("", "separator", {
            title: 'Видео'
        });
        page.appendItem(plugin.getDescriptor().id + ':paginator:getFilteredFilmsAndNewFilters:getFilteredFilms:getMovieInfoById:'+escape('Фильмы'), 'directory', {
            title: 'Фильмы'
        });
        page.appendItem(plugin.getDescriptor().id + ':paginator:getFilteredCartoonsAndNewFilters:getFilteredCartoons:getMovieInfoById:'+escape('Мультфильмы'), 'directory', {
            title: 'Мультфильмы'
        });
        page.appendItem(plugin.getDescriptor().id + ':paginator:getFilteredVideosAndNewFilters:getFilteredVideos:getMovieInfoById:'+escape('Передачи'), 'directory', {
            title: 'Передачи'
        });
        page.appendItem(plugin.getDescriptor().id + ':paginator:getFilteredFestivalFilmsAndNewFilters:getFilteredFestivalFilms:getMovieInfoById:'+escape('Короткометражки'), 'directory', {
            title: 'Короткометражки'
        });
        page.appendItem(plugin.getDescriptor().id + ':paginator:getFilteredSportAndNewFilters:getFilteredSport:getMovieInfoById:'+escape('Спорт'), 'directory', {
            title: 'Спорт'
        });
        page.appendItem(plugin.getDescriptor().id + ':paginator:getFilteredEducationVideoAndNewFilters:getFilteredEducationVideo:getMovieInfoById:'+escape('Обучающее видео'), 'directory', {
            title: 'Обучающее видео'
        });

        page.appendItem("", "separator", {
            title: 'Музыка'
        });
        page.appendItem(plugin.getDescriptor().id + ':paginator:getFilteredRadioAndNewFilters:getFilteredRadio:getRadioInfoById:'+escape('Радио'), 'directory', {
            title: 'Радио'
        });
        page.appendItem(plugin.getDescriptor().id + ':paginator:getFilteredMusicAlbumsAndNewFilters:getFilteredMusicAlbums:getMovieInfoById:'+escape('Альбомы'), 'directory', {
            title: 'Альбомы'
        });
        page.appendItem(plugin.getDescriptor().id + ':paginator:getFilteredMusicVideosAndNewFilters:getFilteredMusicVideos:getMovieInfoById:'+escape('Клипы'), 'directory', {
            title: 'Клипы'
        });


    });

    plugin.addURI(plugin.getDescriptor().id + ":start", function(page) {
        setPageHeader(page, plugin.getDescriptor().synopsis);
        if (logged) {
             page.appendPassiveItem('video', '', {
                 title: new showtime.RichText(coloredStr(user.email ? user.email : user.login, orange) + ' (' + countryCode.replace(/\"/g, '') + ')'),
                 description: new showtime.RichText(coloredStr('ID: ', orange) + user.user_id +
                     coloredStr('\nЛогин: ', orange) + user.login +
                     coloredStr('\nEmail: ', orange) + user.email +
                     coloredStr('\nИмя: ', orange) + user.first_name +
                     coloredStr('\nФамилия: ', orange) + user.last_name +
                     coloredStr('\nБаланс: ', orange) + user.balance +
                     coloredStr('\nОсталось дней тестового периода: ', orange) + (user.test_period))
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
        }) + '';

        if (countryCode.match(/error/)) {
            page.error("Sorry, can't run plugin on this device :(");
            return;
        }

        page.appendItem(plugin.getDescriptor().id + ':epg', 'directory', {
            title: 'ТВ гид'
        });
        page.appendItem(plugin.getDescriptor().id + ':categories', 'directory', {
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
            title: 'Популярные ТВ каналы'
        });
        for (var i in json) {
            page.appendItem(plugin.getDescriptor().id + ':getChannelInfoById:' + json[i].id + ':' + escape(json[i].name), 'video', {
                title: json[i].name,
                icon: json[i].image
            });
        }
        page.appendItem(plugin.getDescriptor().id + ':paginator:getFilteredChannelsAndNewFilters:getFilteredChannels:getChannelInfoById:'+escape('ТВ каналы'), 'directory', {
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
            page.appendItem(plugin.getDescriptor().id + ':getMovieInfoById:' + json[i].id + ':' + escape(json[i].title_ru), 'video', {
                title: json[i].title_ru,
                year: +json[i].year,
                genre: json[i].category_name,
                rating: json[i].rating * 10,
                icon: json[i].image,
                description: new showtime.RichText(coloredStr('Страна: ', orange) + json[i].country)
            });
        }
        page.appendItem(plugin.getDescriptor().id + ':paginator:getFilteredFilmsAndNewFilters:getFilteredFilms:getMovieInfoById:'+escape('Фильмы'), 'directory', {
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
            page.appendItem(plugin.getDescriptor().id + ':getMovieInfoById:' + json[i].id + ':' + escape(json[i].title_ru), 'video', {
                title: json[i].title_ru,
                year: +json[i].year,
                genre: json[i].category_name,
                rating: json[i].rating * 10,
                icon: json[i].image,
                description: new showtime.RichText(coloredStr('Страна: ', orange) + json[i].country)
            });
        }
        page.appendItem(plugin.getDescriptor().id + ':paginator:getFilteredCartoonsAndNewFilters:getFilteredCartoons:getMovieInfoById:'+escape('Мультфильмы'), 'directory', {
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
            page.appendItem(plugin.getDescriptor().id + ':getRadioInfoById:' + json[i].id + ':' + escape(json[i].name), 'video', {
                title: json[i].name,
                genre: json[i].category_name,
                rating: json[i].rating * 10,
                icon: json[i].image
            });
        }
        page.appendItem(plugin.getDescriptor().id + ':paginator:getFilteredRadioAndNewFilters:getFilteredRadio:getRadioInfoById:'+escape('Радио'), 'directory', {
            title: 'Все ►'
        });
    });
    plugin.addSearcher(plugin.getDescriptor().id, logo, function(page, query) {
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

                page.appendItem(plugin.getDescriptor().id + ':' + parser + ':' + json.items[i].id + ':' + (json.items[i].title_ru ? escape(json.items[i].title_ru) : escape(json.items[i].name)), 'video', {
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