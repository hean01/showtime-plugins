/**
 * megogo.net plugin for Movian Media Center
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
    var logo = plugin.path + "logo.png";
    var PREFIX = 'megogo';
    var BASE_URL = 'http://megogo.net', API = '/api/v4';
    var logged = false, credentials, k1 = '_showtime', k2 = 'd661fc50be';
    var users, config = false, digest, showPaidContent;

    function trim(s) {
        return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ").replace(/\t/g, '');
    }

    var blue = '6699CC', orange = 'FFA500', red = 'EE0000', green = '008B45';

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
        page.loading = false;
        if (!config) loginAndGetConfig(page, false);
    }

    function getJSON(page, api, url, params) {
        page.loading = true;
        if (!params) params = '';
        var numOfTries = 0;
        while (numOfTries < 10) {
            //showtime.print(BASE_URL + api + url + params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1);
            var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + api + url + encodeURI(params) + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1));
            //showtime.print(showtime.JSONEncode(json));
            if (json.result == 'ok') break;
            numOfTries++;
        }
        page.loading = false;
        return json;
    }

    function loginAndGetConfig(page, showDialog) {
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
                var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/api/auth/login?', {
                    postdata: {
                        'login' : credentials.username,
                        'password': credentials.password,
                        'remember': 1,
                        'sign' : showtime.md5digest(params.replace(/\&/g, '') + k2) + k1
                    }
                }));
                page.loading = false;
                if (json && json.result == 'ok') logged = true;
            }
        }

        if (showDialog) {
           if (logged) showtime.message("Вход успешно произведен. Параметры входа сохранены.", true, false);
           else showtime.message("Не удалось войти. Проверьте email/пароль...", true, false);
        }

        if (logged && !users) users = getJSON(page, API, '/users?');
        if (!config) config = getJSON(page, API, '/configuration?');
    }

    function getVideosList(page, api, url, static_params, limit) {
        loginAndGetConfig(page, false);
        page.entries = 0;
        var offset = 0, counter = 0, tryToSearch = true;
        function loader() {
            if (!tryToSearch) return false;
            var json = getJSON(page, api, url, static_params + '&offset=' + offset + '&limit=' + limit);
            counter = appendVideosToPage(page, json.video_list, counter);
            offset += 20;
            if (counter == +json.total_found || offset > +json.total_found) return tryToSearch = false;
            if (counter == +json.total_num || offset > +json.total_num) return tryToSearch = false;
            return true;
        };
        loader();
        page.loading = false;
        page.paginator = loader;
    }

    function appendVideosToPage(page, json, counter, separator) {
        for (var i in json) {
            counter++;
            page.entries++;
            if (!json[i].isAvailable && !showPaidContent) continue;
            var genres = getGenre(json[i].category, json[i].genre_list);
            if (separator) {
                page.appendItem("", "separator", {
                    title: separator
                });
                separator = false;
            }
            appendItem(page, json[i], PREFIX + ':indexByID:' + json[i].id + ':' + escape(json[i].title),
                json[i].title + (json[i].isSeries ? colorStr('сериал', orange): '' ),
                genres
            );
        };
        return counter;
    };

    function getGenre(category, genre_list) {
        var genres = '';
        for (var i in config.categories) {
            if (config.categories[i].id == category[0]) {
               for (var j in genre_list) {
                   for (var k in config.categories[i].genres) {
                       if (genre_list[j] == config.categories[i].genres[k].id) {
                           if (!genres)
                               genres = unescape(config.categories[i].genres[k].title);
                           else
                               genres += ', ' + unescape(config.categories[i].genres[k].title);
                       }
                   }
               }
               break;
            }
        }
        return genres;
    }

    function getReason(json) {
        if (!json.isAvailable) {
            switch (json.availableReason) {
                case 'svod':
                    return coloredStr('+', orange);
                case 'tvod':
                    return coloredStr('$', orange);
                default:
                    return '';
            }
        }
        return '';
    }

    function appendItem(page, json, route, title, genres) {
        var item = page.appendItem(route, "video", {
            title: new showtime.RichText(getReason(json) + title),
            year: +parseInt(json.year),
            genre: genres,
            icon: json.image.small,
            rating: json.rating_imdb ? json.rating_imdb * 10 : null,
            duration: json.duration ? +parseInt(json.duration) : null,
            description: new showtime.RichText(
                (json.exclusive ? coloredStr('Эксклюзивно на megogo!', red)  + '<br>': '') +
                (json.availableReason == 'tvod' && json.purchase_info ? coloredStr('Стоимость фильма: ', orange) + json.purchase_info.tvod.subscriptions[0].tariffs[0].price + ' ' + json.purchase_info.tvod.subscriptions[0].currency + '<br>': '') +
                (json.vote != 0 ? coloredStr('Вы голосовали за этот фильм: ', orange) + (json.vote ? 'Нравится' : 'Не нравится') + '<br>': '') +
                (json.isFavorite ? coloredStr('Фильм находится в Избранном', orange)  + '<br>': '') +
                '(' + coloredStr(json.like, green) + ' / ' + coloredStr(json.dislike, red) + ') ' +
                coloredStr('Комментариев: ', orange) + unescape(json.comments_num) +
                (json.country ? coloredStr('<br>Страна: ', orange) + unescape(json.country) : '') +
                (json.description ? coloredStr('<br>Описание: ', orange) +
                    trim(showtime.entityDecode(unescape(json.description.replace(/&#151;/g, '—')))): ''))
        });
        item.id = json.id;
        item.vote = json.vote;
        item.isFavorite = json.isFavorite;

        // Voting
        item.onEvent('vote', function(item) {
            if (+this.vote < 1) {
                getJSON(page, API, '/videos/addvote?', 'video_id=' + this.id + '&like=1');
                //this.vote = 1;
                showtime.notify("Ваш голос (нравится) '" + title + "' добавлен.", 2);
            } else {
                getJSON(page, API, '/videos/addvote?', 'video_id=' + this.id + '&like=-1');
                //this.vote = -1;
                showtime.notify("Ваш голос (не нравится) '" + title + "' добавлен.", 2);
            }
	});
        if (+item.vote < 1) item.addOptAction("Голосовать (нравится) за '" + title.replace(/<[^>]*>/g, '') + "'", 'vote');
        if (+item.vote > -1) item.addOptAction("Голосовать (не нравится) за '" + title.replace(/<[^>]*>/g, '') + "'", 'vote');

        // Favorite
        item.onEvent('addFavorite', function(item) {
            if (this.isFavorite == false) {
                getJSON(page, API, '/favorites/add?', 'video_id=' + this.id);
                showtime.notify("'" + title.replace(/<[^>]*>/g, '') + "' добавлен в 'Избранное'", 2);
                //this.isFavorite = true;
            } else {
                getJSON(page, API, '/favorites/remove?', 'video_id=' + this.id);
                showtime.notify("'" + title.replace(/<[^>]*>/g, '') + "' удален из 'Избранное'", 2);
                //this.isFavorite = false;
            }
	});
	if (item.isFavorite == false) item.addOptAction("Добавить '" + title.replace(/<[^>]*>/g, '') + "' в 'Избранное'", 'addFavorite');
	else item.addOptAction("Удалить '" + title.replace(/<[^>]*>/g, '') + "' из 'Избранное'", 'addFavorite');

        // Comment
        item.onEvent('addComment', function(item) {
            var text = showtime.textDialog('Введите комментарий: ', true, true);
            if (!text.rejected && text.input) {
                page.loading = true;
                var params = 'video_id=' + this.id + 'text=' + text.input;
                var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/api/v4/comments/add?sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1, {
                    postdata: {
                        'video_id': this.id,
                        'text': text.input
                    }
                }));
                page.loading = false;
                showtime.notify("Комментарий добавлен.", 2);
            }
	});
	item.addOptAction("Добавить комментарий к '" + title.replace(/<[^>]*>/g, ''), 'addComment');
    }

    function processVideoItem(page, json, json2, genres) {
        if (json2) { // season
           for (var i in json2) {
               appendItem(page, json.video, PREFIX + ':season:' + json2[i].id + ':' +
                   escape(json.video.title + String.fromCharCode(8194) + '- ' + json2[i].title +
                   (json2[i].title_orig ? ' | ' + json2[i].title_orig : '')),
                   json2[i].title + (json2[i].title_orig ? ' | ' +
                   json2[i].title_orig : '') + ' (' + json2[i].total_num + ' серий)',
                   genres
               );
           }
        } else {
               appendItem(page, json.video, PREFIX + ':video:' + json.video.id + ':' +
                   escape(json.video.title + (json.video.title_orig ? ' | ' +
                   json.video.title_orig : '')),
                   json.video.title + (json.video.title_orig ? ' | ' +
                   json.video.title_orig : ''), genres
               );
        }
    }

    var service = plugin.createService(plugin.getDescriptor().id, PREFIX + ":start", "video", true, logo);

    var settings = plugin.createSettings(plugin.getDescriptor().id, logo, plugin.getDescriptor().synopsis);
    settings.createAction('megogo_login', 'Войти в megogo.net', function() {
        loginAndGetConfig(0, true);
    });
    settings.createBool('showPaidContent', 'Отображать платный контент', false, function(v) {
        showPaidContent = v;
    });

    // Shows genres of the category
    plugin.addURI(PREFIX + ":genres:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, unescape(title));
        for (var i in config.categories) {
            if (config.categories[i].id == id) {
                for (var j in config.categories[i].genres) {
                    page.appendItem(PREFIX + ':videos:' + id + ':' + config.categories[i].genres[j].id + ':' + escape(config.categories[i].genres[j].title), 'directory', {
                        title: config.categories[i].genres[j].title,
                        icon: logo
                    });
                }
                break;
            }
        }
        var offset = 0, limit = 20,counter = 0, tryToSearch = true;
        function loader() {
            if (!tryToSearch) return false;
            var json = getJSON(page, API, '/videos?', 'category_id=' + id + '&limit=' + limit + '&offset=' + offset);
            page.metadata.title = unescape(title + ' (' + json.total_num + ')');
            counter = appendVideosToPage(page, json.video_list, counter);
            offset += limit;
            if (counter == +json.total_num || offset > +json.total_num) return tryToSearch = false;
            return true;
        };
        loader();
        page.loading = false;
        page.paginator = loader;
    });

    // Shows videos of the genre
    plugin.addURI(PREFIX + ":videos:(.*):(.*):(.*)", function(page, category_id, genre_id, title) {
        setPageHeader(page, unescape(title));
        var offset = 0, limit = 20, counter = 0, tryToSearch = true;
        function loader() {
            if (!tryToSearch) return false;
            var json = getJSON(page, API, '/videos?', 'category_id=' + category_id + '&genre=' + genre_id + '&limit=' + limit + '&offset=' + offset);
            counter = appendVideosToPage(page, json.video_list, counter);
            offset += limit;
            page.metadata.title = unescape(title + ' (' + json.total_num + ')');
            if (counter == +json.total_num || offset > +json.total_num) return tryToSearch = false;
            return true;
        };
        loader();
        page.loading = false;
        page.paginator = loader;
    });

    // Shows screenshots
    plugin.addURI(PREFIX + ":screenshots:(.*):(.*)", function(page, title, screenshots) {
        setPageHeader(page, unescape(title));
        var json = showtime.JSONDecode(unescape(screenshots));
        var counter = 1;
        for (var i in json) {
            page.appendItem(unescape(json[i].big), "video", {
                title: 'Фото' + counter,
                icon: unescape(json[i].small)
            });
            counter++;
        }
    });

    // Shows people info
    plugin.addURI(PREFIX + ":people:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, unescape(title));
        var json = getJSON(page, API, '/peoples/info?', 'id=' + id);
        page.appendPassiveItem('video', '', {
            title: new showtime.RichText(json.member.name + (trim(json.member.name_orig) ? ' | ' + trim(json.member.name_orig) : '')),
            icon: json.member.avatar.image_360х360.replace(/13:/, ''),
            description: new showtime.RichText(trim(json.member.description))
        });
        appendVideosToPage(page, json.member.filmography, 0, 'Фильмография:');
    });

    // This route should be kept for legacy purposes
    plugin.addURI(PREFIX + ':directory:(.*):(.*)', function(page, id, title) {
        page.redirect(PREFIX + ':indexByID:' + id + ':' + title);
    });

    // Shows video page
    plugin.addURI(PREFIX + ':indexByID:(.*):(.*)', function(page, id, title) {
        setPageHeader(page, unescape(title));
        var json = getJSON(page, API, '/videos/info?', 'id=' + id);
        if (json.result == 'error') {
            page.error('Извините, видео не доступно / Sorry, video is not available :(');
            return;
        }
        var genres = getGenre(json.video.category, json.video.genre_list);
        if (json.video.season_list[0])
            processVideoItem(page, json, json.video.season_list, genres);
        else
            processVideoItem(page, json, 0, genres);

        // Screenshots
        if (json.video.screenshots[0]) {
            page.appendItem(PREFIX + ':screenshots:' + escape(json.video.title + (json.video.title_orig ? ' | ' + json.video.title_orig : '')) + ':' + escape(showtime.JSONEncode(json.video.screenshots)), 'directory', {
                title: 'Фото из фильма'
            });
        }

        // Show peoples
        var first = true;
        if (json.video.people) {
            var prevType = '';
            for (var i in json.video.people) {
                for (var j in config.membertypes) {
                    if (json.video.people[i].type == config.membertypes[j].type) {
                       if (prevType != json.video.people[i].type) {
                           //page.appendItem("", "separator", {
                           //    title: unescape(config.membertypes[j].title)
                           //});
                           prevType = config.membertypes[j].type;
                       }
                       break;
                    }
                }
                if (first) {
                    page.appendItem("", "separator", {
                        title: 'Над видео работали:'
                    });
                    first = false;
                }
                page.appendItem(PREFIX + ':people:' + json.video.people[i].id + ':' + escape(json.video.people[i].name + (trim(json.video.people[i].name_orig) ? ' | ' + trim(json.video.people[i].name_orig) : '')), 'video', {
                    title: new showtime.RichText(json.video.people[i].name + (trim(json.video.people[i].name_orig) ? ' | ' + trim(json.video.people[i].name_orig) : '') + ' ' + colorStr(config.membertypes[j].title, orange)),
                    icon: json.video.people[i].avatar.image_360x360.replace(/13:/, '')
                });
            }
        }

        // Related videos
        appendVideosToPage(page, json.video.recommended_videos, 0, 'Что еще посмотреть?');

        // Comments
        var counter = 0;
        for (var i in json.video.comments_list) {
            if (!counter) {
                page.appendItem("", "separator", {
                    title: 'Комментарии (' + json.video.comments_num + ')'
                });
            }
            page.appendPassiveItem('video', '', {
                title: new showtime.RichText(coloredStr(json.video.comments_list[i].user_name, orange) + ' (' + json.video.comments_list[i].date.replace(/T/, ' ').replace(/\+00:00/, '') + ')'),
                icon: unescape(json.video.comments_list[i].user_avatar),
                description: unescape(json.video.comments_list[i].text)
            });
            counter++;
        }

        if (counter < +json.video.comments_num) {
            var offset = counter, limit = 20, tryToSearch = true;
            function loader() {
                if (!tryToSearch) return false;
                var json = getJSON(page, API, '/comments?', 'video_id=' + id + '&offset=' + offset + '&limit=' + limit);
                for (var i in json.comments) {
                    page.appendPassiveItem('video', '', {
                        title: new showtime.RichText(coloredStr(json.comments[i].user_name, orange) + ' (' +
                           json.comments[i].date.replace(/T/, ' ').replace(/\+00:00/, '') + ')' +
                           (json.comments[i].sub_comments_count ? ' ' + coloredStr(' комментариев ' + json.comments[i].sub_comments_count, orange) : '')),
                        icon: unescape(json.comments[i].user_avatar),
                        description: unescape(json.comments[i].text)
                    });
                    for (var j in json.comments[i].sub_comments) {
                        page.appendPassiveItem('video', '', {
                            title: new showtime.RichText(coloredStr(json.comments[i].sub_comments[j].user_name, orange) + ' (' +
                               json.comments[i].sub_comments[j].date.replace(/T/, ' ').replace(/\+00:00/, '') + ')' +
                               (json.comments[i].sub_comments[j].sub_comments_count ? ' ' + coloredStr(json.comments[i].sub_comments[j].sub_comments_count + ' комментарий(ев)', orange) : '')),
                            icon: unescape(json.comments[i].sub_comments[j].user_avatar),
                            description: unescape(json.comments[i].sub_comments[j].text)
                        });
                    }
                    counter++;
                    if (counter == +json.total_num) break;
                };
                offset += limit;
                if (counter == +json.total_num || offset > +json.total_num) return tryToSearch = false;
                return true;
            }
            loader();
            page.loading = false;
            page.paginator = loader;
        }
        page.loading = false;
    });

    // Shows episodes of the season
    plugin.addURI(PREFIX + ":season:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, unescape(title));
        var json = getJSON(page, API, '/videos/season?', 'id=' + id);
        for (var i=0; i < json.season.total_num; i++) {
            page.appendItem(PREFIX + ':video:' + json.season.episode_list[i].id + ':' + escape(unescape(title) + ' - ' + json.season.episode_list[i].title), "video", {
                title: json.season.episode_list[i].title,
                icon: unescape(json.season.episode_list[i].image)
            });
        }
    });

    // Search IMDB ID by title
    function getIMDBid(title) {
        var resp = showtime.httpReq('http://www.imdb.com/find?ref_=nv_sr_fn&q=' + encodeURIComponent(showtime.entityDecode(unescape(title))).toString()).toString();
        var imdbid = resp.match(/<a href="\/title\/(tt\d+)\//);
        if (imdbid) return imdbid[1];
        return imdbid;
    };

    // Play megogo links
    plugin.addURI(PREFIX + ":video:(.*):(.*)", function(page, id, title) {
        var json = getJSON(page, API, '/stream?', 'video_id=' + id);
        if (!json.src) {
            showtime.message("Не удается проиграть видео. Возможно видео доступно только по подписке, платное или не доступно для Вашего региона.", true, false);
            return;
        }
        setPageHeader(page, unescape(json.title));
        page.loading = true;
	var s1 = json.src.match(/(.*)\/a\/0\//);
	var s2 = json.src.match(/\/a\/0\/(.*)/);
        var season = null, episode = null;
        var series = unescape(title).split(String.fromCharCode(8194));
        var imdbTitle = series[0];
        if (series[1]) {
            series = series[1].split('-');
            season = +series[1].match(/(\d+)/)[1];
            episode = +series[2].match(/(\d+)/)[1];
        }
	var imdbid = getIMDBid(imdbTitle);

        //showtime.print(showtime.JSONEncode(json));
        if (json.audio_tracks.length > 1) {
            for (var i in json.audio_tracks) {
                var link = "videoparams:" + showtime.JSONEncode({
                    title: unescape(json.title) + ' (' + showtime.entityDecode(unescape(json.audio_tracks[i].lang)) + (json.audio_tracks[i].lang_orig ? '/' + showtime.entityDecode(unescape(json.audio_tracks[i].lang_orig)) : '')+')',
                    canonicalUrl: PREFIX + ":video:" + id + ":" + title,
                    imdbid: imdbid,
                    season: season,
                    episode: episode,
                    sources: [{
                        url: "hls:" + (s1 ? s1[1] +"/a/" + json.audio_tracks[i].index + "/" + s2[1] : json.src)
                    }]
                });
                page.appendItem(link, "video", {
                    title: unescape(json.title) + ' (' + showtime.entityDecode(unescape(json.audio_tracks[i].lang)) + (json.audio_tracks[i].lang_orig ? '/' + showtime.entityDecode(unescape(json.audio_tracks[i].lang_orig)) : '')+')'
                });
            };
            page.loading = false;
            return;
        }
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(json.title),
            canonicalUrl: PREFIX + ":video:" + id + ":" + title,
            imdbid: getIMDBid(title),
            season: season,
            episode: episode,
            sources: [{
                url: "hls:" + json.src
            }]	    
        });
        page.loading = false;
    });

    // Shows videos of the collection
    plugin.addURI(PREFIX + ":collection:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, unescape(title));
        var offset = 0, limit = 20, counter = 0, tryToSearch = true;
        function loader() {
            if (!tryToSearch) return false;
            var json = getJSON(page, API, '/videos/collection?', 'id=' + id + '&offset=' + offset + '&limit=' + limit);
            counter = appendVideosToPage(page, json.video_list, counter);
            offset += limit;
            if (counter == +json.total_num || offset > +json.total_num) return tryToSearch = false;
            return true;
        };
        loader();
        page.loading = false;
        page.paginator = loader;
    });

    plugin.addURI(PREFIX + ":collections", function(page) {
        setPageHeader(page, 'Подборки');
        var json = getJSON(page, API, '/collections?', '');
        for (var i in json.collections) {
            page.appendItem(PREFIX + ':collection:' + json.collections[i].id + ':' + escape(json.collections[i].title), "video", {
                title: json.collections[i].title,
                icon: json.collections[i].image.image_hp
            });
        };
    });

    plugin.addURI(PREFIX + ":premieres", function(page, title) {
        setPageHeader(page, 'Премьеры');
        var offset = 0, limit = 20, counter = 0, tryToSearch = true;
        function loader() {
            if (!tryToSearch) return false;
            var json = getJSON(page, API, '/premieres?', '&offset=' + offset + '&limit=' + limit);
            counter = appendVideosToPage(page, json.video_list, counter);
            offset += limit;
            if (counter == +json.total_num || offset > +json.total_num) return tryToSearch = false;
            return true;
        };
        loader();
        page.loading = false;
        page.paginator = loader;
    });

    plugin.addURI(PREFIX + ":watchlater", function(page, title) {
        setPageHeader(page, 'Избранное');
        var offset = 0, limit = 20, counter = 0, tryToSearch = true;
        function loader() {
            if (!tryToSearch) return false;
            var json = getJSON(page, API, '/favorites?', '&offset=' + offset + '&limit=' + limit);
            counter = appendVideosToPage(page, json.video_list, counter);
            offset += limit;
            if (counter == +json.total_num || offset > +json.total_num) return tryToSearch = false;
            return true;
        };
        loader();
        page.loading = false;
        page.paginator = loader;
    });

    plugin.addURI(PREFIX + ":paid", function(page, title) {
        setPageHeader(page, 'Купленные фильмы');
        var offset = 0, limit = 20, counter = 0, tryToSearch = true;
        function loader() {
            if (!tryToSearch) return false;
            var json = getJSON(page, API, '/payments/full?', '&offset=' + offset + '&limit=' + limit);
            counter = appendVideosToPage(page, json.video_list, counter);
            offset += limit;
            if (counter == +json.total_num || offset > +json.total_num) return tryToSearch = false;
            return true;
        };
        loader();
        page.loading = false;
        page.paginator = loader;
    });

    plugin.addURI(PREFIX + ":start", function(page) {
        setPageHeader(page, plugin.getDescriptor().synopsis);
        if (logged) {
             page.appendPassiveItem('video', '', {
                 title: new showtime.RichText(coloredStr(users.nickname ? users.nickname : users.email, orange) + ' (' + config.geo + ')'),
                 icon: users.avatar,
                 description: new showtime.RichText(coloredStr('ID: ', orange) + users.user_id +
                     coloredStr('<br>Email: ', orange) + users.email +
                     coloredStr('<br>Псевдоним: ', orange) + users.nickname)
             });
             page.appendItem(PREFIX + ':watchlater', 'directory', {
                 title: 'Избранное',
                 icon: logo
             });
             page.appendItem(PREFIX + ':paid', 'directory', {
                 title: 'Купленные фильмы',
                 icon: logo
             });
        } else {
             page.appendPassiveItem('file', '', {
                 title: new showtime.RichText(coloredStr('Авторизация не проведена', orange) + ' (' + config.geo + ')')
             });
        }

        page.appendItem("", "separator", {
            title: 'Категории:'
        });
        for (i in config.categories) {
            page.appendItem(PREFIX + ':genres:' + config.categories[i].id + ':' + escape(config.categories[i].title), 'directory', {
                title: new showtime.RichText(unescape(config.categories[i].title)),
                icon: logo
            });
        };

        if (showPaidContent) {
            var json = getJSON(page, API, '/premieres?', '&limit=5');
            appendVideosToPage(page, json.video_list, 0, 'Премьеры:');
            page.appendItem(PREFIX + ':premieres', 'directory', {
                title: 'Все ►'
            });
        }

        digest = getJSON(page, API, '/digest?', 'limit=10');
        appendVideosToPage(page, digest.recommended, 0, 'Выбор редакции:');

        page.appendItem("", "separator", {
            title: 'Подборки:'
        });
        for (var i in digest.collections) {
            page.appendItem(PREFIX + ':collection:' + digest.collections[i].id + ':' + escape(digest.collections[i].title), "video", {
                title: new showtime.RichText(digest.collections[i].title),
                icon: unescape(digest.collections[i].image.image_hp)
            });
        };
        page.appendItem(PREFIX + ':collections', 'directory', {
            title: 'Все ►'
        });

        // Show lists
        for (var i in digest.videos) {
            for (var j in config.categories) { // traversing categories
                if (config.categories[j].id == digest.videos[i].category_id) {
                   page.appendItem("", "separator", {
                       title: config.categories[j].title
                   });
                   break;
                }

            }
            appendVideosToPage(page, digest.videos[i].video_list);
        };
        page.loading = false;
    });

    plugin.addSearcher(plugin.getDescriptor().id, logo, function(page, query) {
        getVideosList(page, API, '/search?', 'text=' + query, 20);
    });
})(this);