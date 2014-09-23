/**
 * oll.tv plugin for Showtime
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
    var PREFIX = 'oll_tv';
    var BASE_URL = 'http://oll.tv/smartAPI';
    var logo = plugin.path + "logo.png";
    var sn = 'serial_number=' + showtime.deviceId;
    var logged = false, credentials;

    function trim(s) {
        return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ").replace(/\t/, '');
    }

    function blueStr(str) {
        return '<font color="6699CC"> (' + str + ')</font>';
    }

    var blue = "6699CC", orange = "FFA500";

    function colorStr(str, color) {
        return '<font color="' + color + '"> (' + str + ')</font>';
    }

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
        if (!logged) login(page, false);
        page.loading = false;
    }

    var service = plugin.createService(getDescriptor().id, PREFIX + ":start", "video", true, logo);

    plugin.addURI(PREFIX + ":getItems:(.*):(.*):(.*):(.*)", function(page, block_id, cat_id, filters, title) {
        setPageHeader(page, unescape(title));

        var from = 0, tryToSearch = true;
        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/items?' + sn + '&block_id=' + block_id + '&cat_id=' + cat_id + '&start=' + from + '&filters=' + filters + '&orderBy=create-date&orderDirection=desc&limit=20'));
            page.loading = false;
            for (var j in json.items)
                appendItem(page, json.items[j], ':index:');

            if (!json.hasMore) return tryToSearch = false;
            from += 20;
            return true;
        };
        loader();
        page.loading = false;
        page.paginator = loader;
    });

    // Shows filters for category
    plugin.addURI(PREFIX + ":showFiltersForCategory:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, unescape(title));
        page.loading = true;
        var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/getFilters?' + sn + '&cat_id=' + id));
        page.loading = false;

        if (id == "27") { // TV channels
            var counter = 0;
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/category?' + sn + '&id=' + id + '&start=-1'));
            page.loading = false;
            for (i in json) {
               switch (json[i].block_type) {
                   case 'navigation':
                       break;
                   default:
                       page.appendItem("", "separator", {
                           title: unescape(json[i].block_title)
                       });
                       var from = 0;
                       for (var j in json[i].items) {
                           appendItem(page, json[i].items[j], ':index:');
                           counter++;
                           from++;
                       }

                       if (json[i].hasMore) {
                           while (1) {
                               page.loading = true;
                               var json2 = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/items?' + sn + '&block_id=' + json[i].block_id + '&start=' + from));
                               page.loading = false;
                               for (var k in json2.items) {
                                   appendItem(page, json2.items[k], ':index:');
                                   from++;
                                   counter++;
                               };
                               if (!json2.hasMore) break;
                           }
                       }
                       break;
               };
            };
            page.metadata.title += ' (' + counter + ')';
        } else {
        for (var i in json) {
            var currentGroupName = '';
            for (var j in json[i]) {
                if (currentGroupName != json[i][j].groupName) {
                    page.appendItem("", "separator", {
                        title: unescape(json[i][j].groupName)
                    });
                    currentGroupName = json[i][j].groupName;
                }
                page.appendItem(PREFIX + ':getItems:filters:' + id + ':' + json[i][j].filterId + ':' + escape(json[i][j].name), 'directory', {
                    title: new showtime.RichText(json[i][j].name)
                });
            };
        };
        }
    });

    // Search IMDB ID by title
    function getIMDBid(title) {
        var resp = showtime.httpReq('http://www.google.com/search?q=imdb+' + encodeURIComponent(showtime.entityDecode(unescape(title))).toString()).toString();
        var imdbid = resp.match(/http:\/\/www.imdb.com\/title\/(tt\d+).*?<\/a>/);
        if (imdbid) imdbid = imdbid[1];
        else {
            imdbid = resp.match(/http:\/\/<b>imdb<\/b>.com\/title\/(tt\d+).*?\//);
            if (imdbid) imdbid = imdbid[1];
        };
	if (!imdbid) { // Trying to get imdbid by original name
            var fTitle = unescape(title).split(" | ");
            if (fTitle[1]) {
                  resp = showtime.httpReq('http://www.google.com/search?q=imdb+' + encodeURIComponent(showtime.entityDecode(fTitle[1])).toString()).toString();
                  imdbid = resp.match(/http:\/\/www.imdb.com\/title\/(tt\d+).*?<\/a>/);
                  if (imdbid) imdbid = imdbid[1];
                  else {
                     imdbid = resp.match(/http:\/\/<b>imdb<\/b>.com\/title\/(tt\d+).*?\//);
                     if (imdbid) imdbid = imdbid[1];
                  };
            };
	}
        return imdbid;
    };

    // Play oll_tv links
    plugin.addURI(PREFIX + ":play:(.*):(.*)", function(page, id, title) {
        page.loading = true;
        var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/media?id=' + id + '&' +sn));
        page.loading = false;
        //showtime.print(showtime.JSONEncode(json));
        if (!json.media_url) {
            showtime.message("Не могу проиграть видео. Возможно трансляция еще не началась, Вы не вошли в учетную запись, либо закончилась подписка :(", true, false);
            return;
        }

        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(json.title),
            canonicalUrl: PREFIX + ":play:" + id + ":" + title,
            imdbid: getIMDBid(title),
            sources: [{
                url: "hls:" + unescape(json.media_url)
            }]	    
        });
    });

    // Index season by id
    plugin.addURI(PREFIX + ":indexSeason:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, unescape(title));
        page.loading = true;
        var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/info?' + sn + '&id=' + id));
        page.loading = false;
        for (var i in json.series)
            appendItem(page, json, ':play:', json.series[i].series_id, json.series[i].series_title);
    });

    // Index media by id
    plugin.addURI(PREFIX + ":index:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, unescape(title));
        page.loading = true;
        var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/info?' + sn + '&id=' + id + '&showfull=true'));
        page.loading = false;
        //showtime.print(showtime.JSONEncode(json));
        if (json.seasons) {
            for (var i in json.seasons)
                appendItem(page, json, ':indexSeason:', json.seasons[i].season_id, json.seasons[i].season_title);
        } else
            if (json.series) {
                for (var j in json.series)
                    appendItem(page, json, ':play:', json.series[j].series_id, json.series[j].series_title);
            } else
                appendItem(page, json, ':play:');

        if (json.actors) {
            page.appendItem("", "separator", {
                title: 'В ролях:'
            });
            var splitted = unescape(json.actors).split(',');
            for (i in splitted) {
                page.appendItem(PREFIX + ":search:" + escape(splitted[i]), 'directory', {
                    title: trim(splitted[i])
                });
            }
        }

        if (json.director) {
            page.appendItem("", "separator", {
                title: 'Режиссеры:'
            });
            var splitted = unescape(json.director).split(',');
            for (i in splitted) {
                page.appendItem(PREFIX + ":search:" + escape(splitted[i]), 'directory', {
                    title: trim(splitted[i])
                });
            }
        }
        //if (json.authors) showtime.print(json.authors);

        var first = true;
        for (var i in json.similar) {
            if (first) {
                page.appendItem("", "separator", {
                    title: 'Похожие:'
                });
                first = false;
            }
            appendItem(page, json.similar[i], ':index:');
        }

        if (json.category_id == "27") {
            var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/GetTVChannel?item_id='+json.id+'&onlyNextThree=1&' + sn));
            var first = true;
            for (var i in json.nextThree) {
                if (first) {
                    page.appendItem("", "separator", {
                        title: 'ТВ программа'
                    });
                }
                page.appendPassiveItem("file", '', {
                    title: new showtime.RichText(json.nextThree[i].start.substr(11, 5) + ' - ' + json.nextThree[i].stop.substr(11, 5) + '  ' + (first ? coloredStr(json.nextThree[i].name, orange) : json.nextThree[i].name))
                });
                first = false;
            }
            var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/GetTVChannel?item_id='+id+'&' + sn));
            for (var i in json.program) {
                if (first) {
                    page.appendItem("", "separator", {
                        title: 'ТВ программа'
                    });
                }
                page.appendPassiveItem("file", '', {
                    title: new showtime.RichText(json.program[i].start.substr(11, 5) + ' - ' + json.program[i].stop.substr(11, 5) + '  ' + (first ? coloredStr(json.program[i].name, orange) : json.program[i].name))
                });
                first = false;
            }
        }
    });

    function getReason(json) {
            switch (json) {
                case 'svod':
                    return coloredStr('+', orange);
                case 'tvod':
                    return coloredStr('$', orange);
                default:
                    return '';
            }
        return '';
    }

    plugin.addURI(PREFIX + ":start", function(page) {
        setPageHeader(page, getDescriptor().synopsis);
        if (logged) {
             page.loading = true;
             var user = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/account/info?'+sn));
             //var devices = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/account/devices?'+sn));
             page.loading = false;
             page.appendPassiveItem('video', '', {
                 title: new showtime.RichText(coloredStr(user.fullname ? user.fullname : user.email, orange)),
                 description: new showtime.RichText(coloredStr('Лицевой счет: ', orange) + user.account +
                     coloredStr('\nПол: ', orange) + user.gender +
                     coloredStr('\nДень рождения: ', orange) + user.birth_day +
                     (user.region ? coloredStr('\nГород: ', orange) + user.region : '') +
                     coloredStr('\nEmail: ', orange) + user.email +
                     (user.phone ? coloredStr('\nТелефон: ', orange) + user.phone : '') +
                     (+user.receive_news ? coloredStr('\nПолучение рассылок по email: ', orange) + ' Да' : '') +
                     (+user.FK_sms_news_status != 60 ? coloredStr('\nПолучение рассылок по SMS: ', orange) + ' Да' : '') +
                     coloredStr('\nКоличество подключенных устройств: ', orange) + user.devices

             )});
        } else
             page.appendPassiveItem('file', '', {
                 title: new showtime.RichText(coloredStr('Авторизация не проведена', orange))
             });

        page.loading = true;
        var tries = 0;
        while (tries < 3) {
            var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/home?' + sn));
            if (!json.error) break;
            if (json.error) {
                var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/auth', {
                    args:{
                        serial_number: showtime.deviceId,
                        device_model: 'showtime_' + showtime.currentVersionString,
                        device_type: 'android'
                    }
                }));
            } else break;
            tries++;
        }

        for (i in json) {
           switch (json[i].block_type) {
               case 'navigation':
                   for (var j in json[i].items) {
                       page.appendItem(PREFIX + ':showFiltersForCategory:' + json[i].items[j].id + ':' + escape(json[i].items[j].title), 'directory', {
                           title: new showtime.RichText(unescape(json[i].items[j].title))
                       });
                   };
                   break;
               default:
                   page.appendItem("", "separator", {
                       title: unescape(json[i].block_title)
                   });
                   for (var j in json[i].items)
                       appendItem(page, json[i].items[j], ':index:');

                   break;
           };
        };
        page.loading = false;
    });

    function login(page, showDialog) {
        var text = '';
        if (showDialog) {
           text = 'Введите email и пароль';
           logged = false;
        }

        if (!logged) {
            credentials = plugin.getAuthCredentials(getDescriptor().synopsis, text, showDialog);
            if (credentials && credentials.username && credentials.password) {
                page.loading = true;
                var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/login', {
                    args: {
                        'email' : credentials.username,
                        'password': credentials.password,
                        'serial_number': showtime.deviceId
                    }
                }));
                page.loading = false;
                if (json && json.status == 'ok') logged = true;
            }
        }

        if (showDialog) {
           if (logged) showtime.message("Вход успешно произведен. Параметры входа сохранены.", true, false);
           else showtime.message("Не удалось войти. Проверьте email/пароль...", true, false);
        }
    }

    var settings = plugin.createSettings(getDescriptor().id, logo, getDescriptor().synopsis);
    settings.createAction(getDescriptor().id + '_login', 'Войти в ' + getDescriptor().id, function() {
        login(0, true);
    });

    plugin.addURI(PREFIX + ":search:(.*)", function(page, query) {
        setPageHeader(page, unescape(query));
        search(page, unescape(query));
    });

    function getAudioLanguages(json) {
        var s = '', first = true;
        for (var i in json) {
            if (first) {
                s += json[i].title
                first = false
            } else
                s += ', ' + json[i].title
        }
        return s;
    }

    function getAgeLimits(id, json, name) {
        var s = name;
        for (var i in json) {
            if (json[i].id == id)
                s = json[i].descr
        }
        return s;
    }

    function appendItem(page, json, route, id, title) {
        page.appendItem(PREFIX + route + (id ? id : json.id) + ':' + escape(title ? title : json.title), 'video', {
            title: new showtime.RichText(getReason(json.subs_type) +
                (json.hd_quality == 1 ? coloredStr('HD ', blue) : '') + unescape((title ? title : json.title))),
            description: new showtime.RichText((!json.is_free && +json.cost ? coloredStr('Стоимость: ', orange) + json.cost + ' ' + json.cost_currency + ' ' : '') +
                coloredStr('Страна: ', orange) + unescape(json.country) +
                (getAudioLanguages(json.audio_language) ? coloredStr('\nАудиодорожка: ', orange) + getAudioLanguages(json.audio_language) : '') +
                coloredStr('\nРодительский контроль: ', orange) + getAgeLimits(json.age_limit, json.age_limits, json.age_limit_name) +
                coloredStr('\nОписание: ', orange) + unescape(json.descr)),
            year: +unescape(json.release_date),
            duration: json.duration != null ? showtime.durationToString(json.duration * 60) : '',
            icon: unescape(json.src),
            genre: unescape(json.genre),
            rating: unescape(json.rating)*20
        });
        page.entries++;
        for (var i in json.trailers) {
            page.appendItem(PREFIX + ':play:' + json.trailers[i].id + ':' + escape(json.trailers[i].title), 'video', {
                title: 'Трейлер'
            });
        }
    }

    function search(page, query) {
        page.entries = 0;
        var fromPage = 1, tryToSearch = true;

        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            if (fromPage == 1)
                var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/search?' + sn + '&q=' + query.replace(/\s/g, '+')));
            else
                var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/search?' + sn + '&q=' + query.replace(/\s/g, '+') + '&page=' + fromPage));
            page.loading = false;

            for (var j = 0; j < json.items_number; j++)
                appendItem(page, json.items[j], ':index:');

            if (json.hasMore == 0) return tryToSearch = false;
            fromPage++;
            return true;
        };
        loader();
        page.loading = false;
        page.paginator = loader;
    }

    plugin.addSearcher(getDescriptor().id, logo, function(page, query) {
        login(page, false);
        search(page, query);
    });
})(this);