/**
 * megogo.net plugin for Showtime
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

    var PREFIX = 'megogo';
    var BASE_URL = 'http://megogo.net';
    var logo = plugin.path + "logo.png";
    var slogan = 'megogo.net - онлайн-кинотеатр с легальным контентом';
    var session, k1 = '_xbmc', k2 = 'acfed32a68da1d7c';
    var config, digest;

    function trim(s) {
        return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ").replace(/\t/, '');
    }

    function blueStr(str) {
        return '<font color="6699CC"> (' + str + ')</font>';
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
    }

    var service = plugin.createService("megogo.net", PREFIX + ":start", "video", true, logo);

    // Shows genres of the category
    plugin.addURI(PREFIX + ":genres:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, unescape(title));
        page.loading = true;
        var params = 'category=' + id;
        if (session) params = session + '&' + params;
        var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/p/genres?' + params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1));
        page.loading = false;
        for (var i in json.genre_list) {
            page.appendItem(PREFIX + ':videos:' + id + ':' + json.genre_list[i].id + ':' + escape(json.genre_list[i].title), 'directory', {
                title: new showtime.RichText(unescape(json.genre_list[i].title) + blueStr(json.genre_list[i].total_num)),
                icon: logo
            });
        };
    });

    // Shows videos of the genre
    plugin.addURI(PREFIX + ":videos:(.*):(.*):(.*)", function(page, category_id, genre_id, title) {
        var offset = 0;
        var counter = 0;
        setPageHeader(page, unescape(title));

        function loader() {
            var params = 'category=' + category_id + '&genre=' + genre_id + '&limit=20' + '&offset=' + offset;
            if (session) params += '&' + session;
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/p/videos?' + params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1));
            page.loading = false;
            for (var i in json.video_list) {
                var type = "video";
                if (json.video_list[i].isSeries) type = "directory";
                var title = showtime.entityDecode(unescape(json.video_list[i].title)) + (json.video_list[i].title_orig ? " | " + showtime.entityDecode(json.video_list[i].title_orig) : "");
                page.appendItem(PREFIX + ':' + type + ':' + json.video_list[i].id + ':' + escape(title), "video", {
                    title: title,
                    year: +parseInt(json.video_list[i].year),
                    genre: unescape(json.video_list[i].genre_list[0].title),
                    rating: json.video_list[i].rating_imdb * 10,
                    duration: +parseInt(json.video_list[i].duration),
                    description: new showtime.RichText(trim(unescape(json.video_list[i].description))),
                    icon: 'http://megogo.net' + unescape(json.video_list[i].image.small)
                });
                counter++;
            };
            offset += 20;
            if (json.total_num <= counter) return false;
            return true;
        };
        loader();
        page.paginator = loader;
    });

    // Shows seasons of the video
    plugin.addURI(PREFIX + ":directory:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, unescape(title));
        var params = 'video=' + id;
        if (session) params += '&' + session;
        var request = BASE_URL + '/p/video?' + params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1;
        page.loading = true;
        var json = showtime.JSONDecode(showtime.httpReq(request));
        page.loading = false;
        for (var i in json.video[0].season_list) {
            for (var j in json.video[0].season_list[i].episode_list) {
                page.appendItem(PREFIX + ':video:' + json.video[0].season_list[i].episode_list[j].id + ':' + json.video[0].season_list[i].episode_list[j].title, "video", {
                    title: showtime.entityDecode(unescape(json.video[0].season_list[i].title) + ' - ' + unescape(json.video[0].season_list[i].episode_list[j].title)),
                    duration: +parseInt(json.video[0].season_list[i].episode_list[j].duration),
                    icon: unescape(json.video[0].season_list[i].episode_list[j].poster)
                });
            }
        };
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

    // Play megogo links
    plugin.addURI(PREFIX + ":video:(.*):(.*)", function(page, id, title) {
        var params = 'video=' + id;
        if (session) params += '&' + session;
        page.loading = true;
        var json = showtime.httpReq(BASE_URL + '/p/info?' + params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1).toString();
        page.loading = false;
        if (json.match(/<forbidden>([\s\S]*?)<\/forbidden>/)) {
            showtime.message(json.match(/<forbidden>([\s\S]*?)<\/forbidden>/)[1], true, false);
            return;
        }
        json = showtime.JSONDecode(json);
        if (!json.src) {
            showtime.message("Error: This video is not available in your region :(", true, false);
            return;
        }
	var counter = 0;
	var s1 = json.src.match(/(.*)\/a\/0\//);
	var s2 = json.src.match(/\/a\/0\/(.*)/);
	var imdbid = 0;
        for (var i in json.audio_list) {
	    if (!counter) {
                setPageHeader(page, unescape(json.title));
                imdbid = getIMDBid(title);
            }
            var link = "videoparams:" + showtime.JSONEncode({
                title: unescape(json.title) + ' (' + showtime.entityDecode(unescape(json.audio_list[i].lang)) + (json.audio_list[i].lang_orig ? '/' + showtime.entityDecode(unescape(json.audio_list[i].lang_orig)) : '')+')',
                canonicalUrl: PREFIX + ":video:" + id + ":" + title,
                imdbid: imdbid,
                sources: [{
                   url: "hls:" + s1[1] +"/a/" + json.audio_list[i].index + "/" + s2[1]
                }]	    
            });
            page.appendItem(link, "video", {
                title: unescape(json.title) + ' (' + showtime.entityDecode(unescape(json.audio_list[i].lang)) + (json.audio_list[i].lang_orig ? '/' + showtime.entityDecode(unescape(json.audio_list[i].lang_orig)) : '')+')'
            });
	    counter++;
        };
	if (counter) return;
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(json.title),
            canonicalUrl: PREFIX + ":video:" + id + ":" + title,
            imdbid: getIMDBid(title),
            sources: [{
                url: "hls:" + json.src
            }]	    
        });
    });

    // Shows videos of the collection
    plugin.addURI(PREFIX + ":collection:(.*):(.*)", function(page, id, title) {
        var offset = 0;
        var counter = 0;
        setPageHeader(page, unescape(title));

        function loader() {
            var params = 'id=' + id + '&offset=' + offset + '&limit=20';
            if (session) params += '&' + session;
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/api/v3/videos/collection?' + params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1));
            page.loading = false;
            for (var i in json.video_list) {
                var type = "video";
                if (json.video_list[i].isSeries) type = "directory";
            var genres = '', first = true;
            for (var j in config.categories) { // traversing categories
                if (config.categories[j].id == json.video_list[i].category[0]) {
                    for (var k in json.video_list[i].genre_list) {
                        for (var l in config.categories[j].genres) { // traversing genres
                            if (json.video_list[i].genre_list[k] == config.categories[j].genres[l].id) {
                                if (first) {
                                    genres = unescape(config.categories[j].genres[l].title);
                                    first = false;
                                } else {
                                    genres += ', ' + unescape(config.categories[j].genres[l].title);
                                }
                            }
                        }
                    }
                    break;
                }
            }
                page.appendItem(PREFIX + ':' + type + ':' + json.video_list[i].id + ':' + escape(json.video_list[i].title), "video", {
                    title: json.video_list[i].title,
                    year: +parseInt(json.video_list[i].year),
                    genre: genres,
                    icon: unescape(json.video_list[i].image.small),
                    description: new showtime.RichText(' (' + coloredStr(json.video_list[i].like, green) + ' / ' + coloredStr(json.video_list[i].dislike, red) + ') ' +
                    coloredStr('Комментариев: ', orange) + unescape(json.video_list[i].comments_num) +
                    coloredStr('<br>Страна: ', orange) + unescape(json.video_list[i].country))
                });
                counter++;
            };
            offset += 20;
            if (json.total_num <= counter) return false;
            return true;
        };
        loader();
        page.paginator = loader;
    });

    plugin.addURI(PREFIX + ":collections", function(page) {
        setPageHeader(page, 'Подборки');
        var params = '';
        if (session) params = session;
        page.loading = true;
        var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/api/v3/collections?' + params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1));
        page.loading = false;
        for (var i in json.collections) {
            page.appendItem(PREFIX + ':collection:' + json.collections[i].id + ':' + escape(json.collections[i].title), "video", {
                title: json.collections[i].title,
                icon: json.collections[i].image.image_hp
            });
        };
    });

    plugin.addURI(PREFIX + ":start", function(page) {
        setPageHeader(page, slogan);
        page.loading = true;
        session = '';
        var credentials = plugin.getAuthCredentials(slogan, '', false);
        if (credentials && credentials.username && credentials.password) {
            var params = 'login=' + credentials.username + '&pwd=' + credentials.password;
            var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/p/login?'+ params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1));
            if (json && json.result == 'ok') {
                page.appendPassiveItem('file', '', {
                    title: new showtime.RichText(coloredStr(credentials.username, orange))
                });
                session = 'session=' + json.session;
            }
        }
        if (!credentials || !json || json.result != 'ok') {
            page.appendPassiveItem('file', '', {
                title: new showtime.RichText(coloredStr('Авторизация не проведена', orange))
            });
        }

        page.appendItem("", "separator", {
            title: 'Категории:'
        });
        page.loading = true;
        config = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/api/v3/configuration?' + session + '&sign=' + showtime.md5digest(session + k2) + k1));
        page.loading = false;
        //for (i in config.categories) {
        //    page.appendItem(PREFIX + ':genres:' + config.categories[i].id + ':' + escape(config.categories[i].title), 'directory', {
        //        title: new showtime.RichText(unescape(config.categories[i].title)),
        //        icon: logo
        //    });
        //};
        page.loading = true;
        json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/p/categories?' + session + '&sign=' + showtime.md5digest(session + k2) + k1));
        page.loading = false;
        for (i in json.category_list) {
            page.appendItem(PREFIX + ':genres:' + json.category_list[i].id + ':' + escape(json.category_list[i].title), 'directory', {
                title: new showtime.RichText(unescape(json.category_list[i].title) + blueStr(json.category_list[i].total_num)),
                icon: logo
            });
        };

        page.loading = true;
        var params = 'limit=10';
        digest = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/api/v3/digest?'+ params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1));
        page.loading = false;

        page.appendItem("", "separator", {
            title: 'Подборки:'
        });
        var bType = 'collections'
        for (var i in digest[bType]) {
            page.appendItem(PREFIX + ':collection:' + digest[bType][i].id + ':' + escape(digest[bType][i].title), "video", {
                title: new showtime.RichText(digest[bType][i].title),
                icon: unescape(digest[bType][i].image.image_hp)
            });
        };
        page.appendItem(PREFIX + ':collections', "directory", {
            title: 'Все ►'
        });

        page.appendItem("", "separator", {
            title: 'Рекомендуемое:'
        });
        page.loading = true;
        json = showtime.httpReq(BASE_URL + '/p/recommend?' + session + '&sign=' + showtime.md5digest(session + k2) + k1);
        showtime.trace("The length of the reply is: " + json.toString().length);
        while (json.toString().length < 100) {
            showtime.trace("Recommended list is empty. Getting again...");
            json = showtime.httpReq(BASE_URL + '/p/recommend?' + session + '&sign=' + showtime.md5digest(session + k2) + k1);
        }
        page.loading = false;
	json = showtime.JSONDecode(json);
        for (var i in json.video_list) {
            var type = "video";
            if (json.video_list[i].isSeries) type = "directory";
            var title = showtime.entityDecode(unescape(json.video_list[i].title)) + (json.video_list[i].title_orig ? " | " + showtime.entityDecode(json.video_list[i].title_orig) : "");
            var genres = '', first = true;
            for (var j in json.video_list[i].genre_list) {
                if (first) {
                     genres = unescape(json.video_list[i].genre_list[j].title);
                     first = false;
                } else {
                     genres += ', ' + unescape(json.video_list[i].genre_list[j].title);
                }
            }
            page.appendItem(PREFIX + ':' + type + ':' + json.video_list[i].id + ':' + escape(title), "video", {
                title: new showtime.RichText(json.video_list[i].isSeries ? title + colorStr('сериал', orange) : title),
                year: +parseInt(json.video_list[i].year),
                genre: (genres ? genres : ''),
                rating: json.video_list[i].rating_imdb * 10,
                duration: +parseInt(json.video_list[i].duration),
                description: new showtime.RichText(' (' + coloredStr(json.video_list[i].like, green) + ' / ' + coloredStr(json.video_list[i].dislike, red) + ') ' +
                coloredStr('Страна: ', orange) + unescape(json.video_list[i].country) +
                coloredStr(' Бюджет: ', orange) + unescape(json.video_list[i].budget) +
                coloredStr('<br>Слоган: ', orange) + unescape(json.video_list[i].slogan) +
                coloredStr('<br>Описание: ', orange) + trim(showtime.entityDecode(unescape(json.video_list[i].description.replace(/&#151;/g, '—'))))),
                icon: 'http://megogo.net' + unescape(json.video_list[i].image.small)
            });
        };

        page.appendItem("", "separator", {
            title: 'Выбор редакции:'
        });
        var bType = 'recommended'
        for (var i in digest[bType]) {
            if (!digest[bType][i].isAvailable) continue;
            var type = "video";
            if (digest[bType][i].isSeries) type = "directory";
            var title = showtime.entityDecode(unescape(digest[bType][i].title));
            var genres = '', first = true;
            for (var j in config.categories) { // traversing categories
                if (config.categories[j].id == digest[bType][i].category[0]) {
                    for (var k in digest[bType][i].genre_list) {
                        for (var l in config.categories[j].genres) { // traversing genres
                            if (digest[bType][i].genre_list[k] == config.categories[j].genres[l].id) {
                                if (first) {
                                    genres = unescape(config.categories[j].genres[l].title);
                                    first = false;
                                } else {
                                    genres += ', ' + unescape(config.categories[j].genres[l].title);
                                }
                            }
                        }
                    }
                    break;
                }
            }
            page.appendItem(PREFIX + ':' + type + ':' + digest[bType][i].id + ':' + escape(title), "video", {
                title: new showtime.RichText(digest[bType][i].isSeries ? title + colorStr('сериал', orange) : title),
                year: +parseInt(digest[bType][i].year),
                genre: genres,
                icon: digest[bType][i].image.small,
                description: new showtime.RichText(' (' + coloredStr(digest[bType][i].like, green) + ' / ' + coloredStr(digest[bType][i].dislike, red) + ') ' +
                coloredStr('Комментариев: ', orange) + unescape(digest[bType][i].comments_num) +
                coloredStr('<br>Страна: ', orange) + unescape(digest[bType][i].country))
            });
        };
        page.loading = false;
    });

    var settings = plugin.createSettings("megogo.net", logo, slogan);
    settings.createAction('megogo_login', 'Войти в megogo.net', function() {
        var credentials = plugin.getAuthCredentials(slogan, 'Введите email и пароль', true);
        if (credentials && credentials.username && credentials.password) {
            var params = 'login=' + credentials.username + '&pwd=' + credentials.password;
            var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/p/login?'+ params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1));
            if (json && json.result == 'ok') {
                showtime.message("Вход успешно произведен. Параметры входа сохранены.", true, false);
                return;
            }
        }
        showtime.message("Не удалось войти. Проверьте email/пароль...", true, false);
    });


    plugin.addSearcher("megogo.net", logo, function(page, query) {
        session = '';
        var credentials = plugin.getAuthCredentials(slogan, '', false);
        if (credentials && credentials.username && credentials.password) {
            var params = 'login=' + credentials.username + '&pwd=' + credentials.password;
            var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/p/login?'+ params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1));
            if (json && json.result == 'ok') {
                session = 'session=' + json.session;
            }
        }

        page.entries = 0;
        var offset = 0, counter = 0;
        function loader() {
            var params = 'text=' + query + '&limit=20' + '&offset=' + offset;
            if (session) params += '&' + session;
            var request = BASE_URL + '/p/search?' + params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1;
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq(request));
            page.loading = false;
            for (var i in json.video_list) {
                var type = "video";
                if (json.video_list[i].isSeries) type = "directory";
                var title = showtime.entityDecode(unescape(json.video_list[i].title)) + (json.video_list[i].title_orig ? " | " + showtime.entityDecode(json.video_list[i].title_orig) : "");
                page.appendItem(PREFIX + ':' + type + ':' + json.video_list[i].id + ':' + escape(title), "video", {
                    title: title,
                    year: +parseInt(json.video_list[i].year),
                    genre: (json.video_list[i].genre_list[0] ? unescape(json.video_list[i].genre_list[0].title) : ''),
                    rating: json.video_list[i].rating_imdb * 10,
                    duration: +parseInt(json.video_list[i].duration),
                    description: new showtime.RichText(trim(showtime.entityDecode(unescape(json.video_list[i].description)))),
                    icon: 'http://megogo.net' + unescape(json.video_list[i].image.small)
                });
                page.entries++;
                counter++;
            };
            offset += 20;
            if (json.total_num <= counter) return false;
            return true;
        };
        loader();
        page.loading = false;
        page.paginator = loader;
    });
})(this);