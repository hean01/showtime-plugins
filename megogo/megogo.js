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
    var config, digest, showPaidContent;

    function checkConfig(page) {
        if (!session) {
            session = '';
            var credentials = plugin.getAuthCredentials(slogan, '', false);
            if (credentials && credentials.username && credentials.password) {
                var params = 'login=' + credentials.username + '&pwd=' + credentials.password;
                var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/p/login?'+ params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1));
                if (json && json.result == 'ok') session = 'session=' + json.session;
            }
        }
        if (!config) {
            page.loading = true;
            config = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/api/v3/configuration?' + session + '&sign=' + showtime.md5digest(session + k2) + k1));
            page.loading = false;
        }
    }

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
        setPageHeader(page, unescape(title));
        var offset = 0, counter = 0, tryToSearch = true;
        function loader() {
            if (!tryToSearch) return false;
            var params = 'category=' + category_id + '&genre=' + genre_id + '&limit=20' + '&offset=' + offset;
            if (session) params += '&' + session;
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/p/videos?' + params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1));
            page.loading = false;
            for (var i in json.video_list) {
                var genre = '', first = true;
                for (var j in json.video_list[i].genre_list) {
                    if (first) {
                        genre = json.video_list[i].genre_list[j].title;
                        first = false
                    } else
                        genre += ', ' + json.video_list[i].genre_list[j].title
                }
                var title = showtime.entityDecode(unescape(json.video_list[i].title)) + (json.video_list[i].title_orig ? " | " + showtime.entityDecode(json.video_list[i].title_orig) : "");
                page.appendItem(PREFIX + (json.video_list[i].type == 5 ? ':video:' : ':indexByID:') + json.video_list[i].id + ':' + escape(title), "video", {
                    title: new showtime.RichText(title + (json.video_list[i].isSeries ? colorStr('сериал', orange) : '')),
                    year: +parseInt(json.video_list[i].year),
                    genre: genre,
                    rating: json.video_list[i].rating_imdb * 10,
                    duration: +parseInt(json.video_list[i].duration),
                    description: new showtime.RichText('(' + coloredStr(json.video_list[i].like, green) + ' / ' + coloredStr(json.video_list[i].dislike, red) + ') ' +
                        (json.video_list[i].country ? coloredStr('Страна: ', orange) + unescape(json.video_list[i].country) : '') +
                        (json.video_list[i].budget ? coloredStr(' Бюджет: ', orange) + unescape(json.video_list[i].budget) : '') +
                        (json.video_list[i].slogan ? coloredStr('<br>Слоган: ', orange) + unescape(json.video_list[i].slogan) : '') +
                        coloredStr('<br>Описание: ', orange) + trim(showtime.entityDecode(unescape(json.video_list[i].description.replace(/&#151;/g, '—'))))),
                    icon: 'http://megogo.net' + unescape(json.video_list[i].image.small)
                });
                counter++;
            };
            offset += 20;
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
                title: 'Кадр' + counter,
                icon: unescape(json[i].small)
            });
            counter++;
        }
    });

    // Shows people info
    plugin.addURI(PREFIX + ":people:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, unescape(title));
        var params = 'id=' + id;
        if (session) params += '&' + session;
        page.loading = true;
        while (1) {
            var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/api/v3/peoples/info?' + params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1));
            if (json.result == 'ok') break;
        }
        page.loading = false;
        page.appendPassiveItem('video', '', {
            title: new showtime.RichText(json.member.name + (json.member.name_orig ? ' | ' + json.member.name_orig : '')),
            icon: json.member.avatar.image_360х360.replace(/13:/, ''),
            description: new showtime.RichText(trim(json.member.description))
        });

        var first = true;
        for (var i in json.member.filmography) {
            if (!json.member.filmography[i].isAvailable && !showPaidContent) continue;
            var aType = '';
            if (!json.member.filmography[i].isAvailable) {
                switch (json.member.filmography[i].availableReason) {
                    case 'svod':
                        aType = coloredStr('+', orange);
                        break;
                    case 'tvod':
                        aType = coloredStr('$', orange);
                        break;
                    default:
                        break;
                }
            }
            checkConfig(page);
            var genres = '', first = true;
            for (var j in config.categories) { // traversing categories
                if (config.categories[j].id == json.member.filmography[i].category[0]) {
                   for (var k in json.member.filmography[i].genre_list) {
                       for (var l in config.categories[j].genres) { // traversing genres
                           if (json.member.filmography[i].genre_list[k] == config.categories[j].genres[l].id) {
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
            if (first) {
                page.appendItem("", "separator", {
                    title: 'Фильмография:'
                });
                first = false;
            }
            page.appendItem(PREFIX + ':indexByID:' + json.member.filmography[i].id + ':' + escape(json.member.filmography[i].title), "video", {
                title: new showtime.RichText(aType + json.member.filmography[i].title + (json.member.filmography[i].isSeries ? colorStr('сериал', orange) : '')),
                year: +parseInt(json.member.filmography[i].year),
                genre: genres,
                icon: unescape(json.member.filmography[i].image.small),
                description: new showtime.RichText('(' + coloredStr(json.member.filmography[i].like, green) + ' / ' + coloredStr(json.member.filmography[i].dislike, red) + ') ' +
                    coloredStr('Комментариев: ', orange) + unescape(json.member.filmography[i].comments_num) +
                    coloredStr('<br>Страна: ', orange) + unescape(json.member.filmography[i].country))
            });
        }
    });

    // Shows video page
    plugin.addURI(PREFIX + ":indexByID:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, unescape(title));
        var params = 'id=' + id;
        if (session) params += '&' + session;
        page.loading = true;
        while (1) {
            var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/api/v3/videos/info?' + params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1));
            if (json.result == 'ok') break;
            if (json.error == "Can't find requested object") {
                page.error(json.error);
                return;
            }
        }
        page.loading = false;
        var genres = '', first = true;
        checkConfig(page);
        for (var j in config.categories) { // traversing categories
            if (config.categories[j].id == json.video.category[0]) {
               for (var k in json.video.genre_list) {
                   for (var l in config.categories[j].genres) { // traversing genres
                       if (json.video.genre_list[k] == config.categories[j].genres[l].id) {
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

        if (json.video.season_list[0]) {
            for (var i in json.video.season_list) {
                page.appendItem(PREFIX + ':season:' + json.video.season_list[i].id + ':' + escape(json.video.title + ' - ' + json.video.season_list[i].title + (json.video.season_list[i].title_orig ? ' | ' + json.video.season_list[i].title_orig : '')), "video", {
                    title: json.video.season_list[i].title + (json.video.season_list[i].title_orig ? ' | ' + json.video.season_list[i].title_orig : '') + ' (' + json.video.season_list[i].total_num + ' серий)',
                    year: +parseInt(json.video.year),
                    genre: genres,
                    icon: unescape(json.video.image.small),
                    rating: json.video.rating_imdb * 10,
                    duration: +parseInt(json.video.duration),
                    description: new showtime.RichText('(' + coloredStr(json.video.like, green) + ' / ' + coloredStr(json.video.dislike, red) + ') ' +
                    coloredStr('Комментариев: ', orange) + unescape(json.video.comments_num) +
                    (json.video.country ? coloredStr('<br>Страна: ', orange) + unescape(json.video.country) : '') +
                    coloredStr('<br>Описание: ', orange) + trim(showtime.entityDecode(unescape(json.video.description.replace(/&#151;/g, '—')))))
                });
            };
        } else {
            page.appendItem(PREFIX + ':video:' + json.video.id + ':' + escape(json.video.title + (json.video.title_orig ? ' | ' + json.video.title_orig : '')), "video", {
                title: json.video.title + (json.video.title_orig ? ' | ' + json.video.title_orig : ''),
                year: +parseInt(json.video.year),
                genre: genres,
                icon: unescape(json.video.image.small),
                rating: json.video.rating_imdb * 10,
                duration: +parseInt(json.video.duration),
                description: new showtime.RichText('(' + coloredStr(json.video.like, green) + ' / ' + coloredStr(json.video.dislike, red) + ') ' +
                    coloredStr('Комментариев: ', orange) + unescape(json.video.comments_num) +
                    (json.video.country ? coloredStr('<br>Страна: ', orange) + unescape(json.video.country) : '') +
                    coloredStr('<br>Описание: ', orange) + trim(showtime.entityDecode(unescape(json.video.description.replace(/&#151;/g, '—')))))
            });
        }

        // Screenshots
        if (json.video.screenshots[0]) {
            page.appendItem(PREFIX + ':screenshots:' + escape(json.video.title + (json.video.title_orig ? ' | ' + json.video.title_orig : '')) + ':' + escape(showtime.JSONEncode(json.video.screenshots)), 'directory', {
                title: 'Кадры из фильма'
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
                page.appendItem(PREFIX + ':people:' + json.video.people[i].id + ':' + escape(json.video.people[i].name + (json.video.people[i].name_orig ? ' | ' + json.video.people[i].name_orig : '')), 'video', {
                    title: new showtime.RichText(json.video.people[i].name + (json.video.people[i].name_orig ? ' | ' + json.video.people[i].name_orig : '') + ' ' + colorStr(config.membertypes[j].title, orange)),
                    icon: json.video.people[i].avatar.image_360х360.replace(/13:/, '')
                });
            }
        }

        // Related videos
        var first = true;
        for (var i in json.video.recommended_videos) {
            if (first) {
                page.appendItem("", "separator", {
                    title: 'Что еще посмотреть?'
                });
                first = false;
            }

            var genres = '', frst = true;
            for (var j in config.categories) { // traversing categories
                if (config.categories[j].id == json.video.category[0]) {
                   for (var k in json.video.recommended_videos[i].genre_list) {
                       for (var l in config.categories[j].genres) { // traversing genres
                           if (json.video.recommended_videos[i].genre_list[k] == config.categories[j].genres[l].id) {
                               if (frst) {
                                   genres = unescape(config.categories[j].genres[l].title);
                                   frst = false;
                               } else {
                                   genres += ', ' + unescape(config.categories[j].genres[l].title);
                               }
                           }
                       }
                   }
                   break;
                }
            }
            page.appendItem(PREFIX + ':indexByID:' + escape(json.video.recommended_videos[i].id) + ':' + escape(json.video.recommended_videos[i].title), "video", {
                title: new showtime.RichText(json.video.recommended_videos[i].title + (json.video.recommended_videos[i].isSeries ? colorStr('сериал', orange) : '')),
                icon: unescape(json.video.recommended_videos[i].image.small),
                year: +parseInt(json.video.recommended_videos[i].year),
                genre: genres,
                description: new showtime.RichText('(' + coloredStr(json.video.recommended_videos[i].like, green) + ' / ' + coloredStr(json.video.recommended_videos[i].dislike, red) + ') ' +
                    coloredStr('Комментариев: ', orange) + unescape(json.video.recommended_videos[i].comments_num) +
                    coloredStr('<br>Страна: ', orange) + unescape(json.video.recommended_videos[i].country))
            });
        }

        // Comments
        var counter = 0;
        first = true;
        for (var i in json.video.comments_list) {
            if (first) {
                page.appendItem("", "separator", {
                    title: 'Комментарии (' + json.video.comments_num + ')'
                });
                first = false;
            }
            page.appendPassiveItem('video', '', {
                title: json.video.comments_list[i].user_name + ' (' + json.video.comments_list[i].date.replace(/T/, ' ').replace(/\+00:00/, '') + ')',
                icon: unescape(json.video.comments_list[i].user_avatar),
                description: unescape(json.video.comments_list[i].text)
            });
            counter++;
        }

        if (counter < +json.video.comments_num) {
            var offset = counter, tryToSearch = true;
            function loader() {
                if (!tryToSearch) return false;
                var params = 'video_id=' + id + '&offset=' + offset + '&limit=20';
                if (session) params += '&' + session;
                page.loading = true;
                var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/api/v3/comments?' + params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1));
                page.loading = false;
                for (var i in json.comments) {
                    page.appendPassiveItem('video', '', {
                        title: new showtime.RichText(json.comments[i].user_name + ' (' +
                           json.comments[i].date.replace(/T/, ' ').replace(/\+00:00/, '') + ')' +
                           (json.comments[i].sub_comments_count ? ' ' + coloredStr(' комментариев ' + json.comments[i].sub_comments_count, orange) : '')),
                        icon: unescape(json.comments[i].user_avatar),
                        description: unescape(json.comments[i].text)
                    });
                    for (var j in json.comments[i].sub_comments) {
                        page.appendPassiveItem('video', '', {
                            title: new showtime.RichText(json.comments[i].sub_comments[j].user_name + ' (' +
                               json.comments[i].sub_comments[j].date.replace(/T/, ' ').replace(/\+00:00/, '') + ')' +
                               (json.comments[i].sub_comments[j].sub_comments_count ? ' ' + coloredStr(json.comments[i].sub_comments[j].sub_comments_count + ' комментарий(ев)', orange) : '')),
                            icon: unescape(json.comments[i].sub_comments[j].user_avatar),
                            description: unescape(json.comments[i].sub_comments[j].text)
                        });
                    }
                    counter++;
                    if (counter == +json.total_num) break;
                };
                offset += 20;
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
        var params = 'id=' + id;
        if (session) params += '&' + session;
        page.loading = true;
        while (1) {
            var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/api/v3/videos/season?' + params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1));
            if (json.result == 'ok') break;
        }

        page.loading = false;
        for (var i=0; i < json.season.total_num; i++) {
            page.appendItem(PREFIX + ':video:' + json.season.episode_list[i].id + ':' + json.season.episode_list[i].title, "video", {
                title:  json.season.episode_list[i].title,
                icon: unescape(json.season.episode_list[i].image)
            });
        }
    });

    // Shows seasons of the video (for legacy purposes)
    plugin.addURI(PREFIX + ":directory:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, unescape(title));
        checkConfig(page);
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
        checkConfig(page);
        var params = 'video=' + id;
        if (session) params += '&' + session;
        page.loading = true;
        var json = showtime.httpReq(BASE_URL + '/p/info?' + params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1).toString();
        page.loading = false;
        if (json.match(/<forbidden>/)) {
            showtime.message('Не удается получить линк. Возможно видео платное или не доступно для Вашего региона.', true, false);
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
        setPageHeader(page, unescape(title));
        var offset = 0, counter = 0, tryToSearch = true;
        function loader() {
            if (!tryToSearch) return false;
            var params = 'id=' + id + '&offset=' + offset + '&limit=20';
            if (session) params += '&' + session;
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/api/v3/videos/collection?' + params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1));
            page.loading = false;
            for (var i in json.video_list) {
                counter++;
                if (!json.video_list[i].isAvailable && !showPaidContent) continue;
                var aType = '';
                if (!json.video_list[i].isAvailable) {
                    switch (json.video_list[i].availableReason) {
                        case 'svod':
                            aType = coloredStr('+', orange);
                            break;
                        case 'tvod':
                            aType = coloredStr('$', orange);
                            break;
                        default:
                            break;
                    }
                }
                var genres = '', first = true;
                checkConfig(page);
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
                page.appendItem(PREFIX + ':indexByID:' + json.video_list[i].id + ':' + escape(json.video_list[i].title), "video", {
                    title: new showtime.RichText(aType + json.video_list[i].title + (json.video_list[i].isSeries ? colorStr('сериал', orange): '' )),
                    year: +parseInt(json.video_list[i].year),
                    genre: genres,
                    icon: unescape(json.video_list[i].image.small),
                    description: new showtime.RichText('(' + coloredStr(json.video_list[i].like, green) + ' / ' + coloredStr(json.video_list[i].dislike, red) + ') ' +
                        coloredStr('Комментариев: ', orange) + unescape(json.video_list[i].comments_num) +
                        coloredStr('<br>Страна: ', orange) + unescape(json.video_list[i].country))
                });
            };
            offset += 20;
            if (counter == +json.total_num || offset > +json.total_num) return tryToSearch = false;
            return true;
        };
        loader();
        page.loading = false;
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
        //checkConfig(page)
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
        for (var i in digest.collections) {
            page.appendItem(PREFIX + ':collection:' + digest.collections[i].id + ':' + escape(digest.collections[i].title), "video", {
                title: new showtime.RichText(digest.collections[i].title),
                icon: unescape(digest.collections[i].image.image_hp)
            });
        };
        page.appendItem(PREFIX + ':collections', 'directory', {
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
            if (json.video_list[i].isSeries) type = 'directory';
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
            page.appendItem(PREFIX + ':indexByID:' + json.video_list[i].id + ':' + escape(title), "video", {
                title: new showtime.RichText(json.video_list[i].isSeries ? title + colorStr('сериал', orange) : title),
                year: +parseInt(json.video_list[i].year),
                genre: (genres ? genres : ''),
                rating: json.video_list[i].rating_imdb * 10,
                duration: +parseInt(json.video_list[i].duration),
                description: new showtime.RichText('(' + coloredStr(json.video_list[i].like, green) + ' / ' + coloredStr(json.video_list[i].dislike, red) + ') ' +
                    coloredStr('Страна: ', orange) + unescape(json.video_list[i].country) +
                    (json.video_list[i].budget ? coloredStr(' Бюджет: ', orange) + unescape(json.video_list[i].budget) : '')+
                    (json.video_list[i].slogan ? coloredStr('<br>Слоган: ', orange) + unescape(json.video_list[i].slogan) : '') +
                    coloredStr('<br>Описание: ', orange) + trim(showtime.entityDecode(unescape(json.video_list[i].description.replace(/&#151;/g, '—'))))),
                icon: 'http://megogo.net' + unescape(json.video_list[i].image.small)
            });
        };

        page.appendItem("", "separator", {
            title: 'Выбор редакции:'
        });
        for (var i in digest.recommended) {
            if (!digest.recommended[i].isAvailable && !showPaidContent) continue;
            var aType = '';
            if (!digest.recommended[i].isAvailable) {
                switch (digest.recommended[i].availableReason) {
                    case 'svod':
                        aType = coloredStr('+', orange);
                        break;
                    case 'tvod':
                        aType = coloredStr('$', orange);
                        break;
                    default:
                        break;
                }
            }
            var genres = '', first = true;
            checkConfig(page);
            for (var j in config.categories) { // traversing categories
                if (config.categories[j].id == digest.recommended[i].category[0]) {
                    for (var k in digest.recommended[i].genre_list) {
                        for (var l in config.categories[j].genres) { // traversing genres
                            if (digest.recommended[i].genre_list[k] == config.categories[j].genres[l].id) {
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
            var title = showtime.entityDecode(unescape(digest.recommended[i].title));
            page.appendItem(PREFIX + ':indexByID:' + digest.recommended[i].id + ':' + escape(title), "video", {
                title: new showtime.RichText(aType + (digest.recommended[i].isSeries ? title + colorStr('сериал', orange) : title)),
                year: +parseInt(digest.recommended[i].year),
                genre: genres,
                icon: digest.recommended[i].image.small,
                description: new showtime.RichText('(' + coloredStr(digest.recommended[i].like, green) + ' / ' + coloredStr(digest.recommended[i].dislike, red) + ') ' +
                    coloredStr('Комментариев: ', orange) + unescape(digest.recommended[i].comments_num) +
                    coloredStr('<br>Страна: ', orange) + unescape(digest.recommended[i].country))
            });
        };

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
            for (var m in digest.videos[i].video_list) {
                 if (!digest.videos[i].video_list[m].isAvailable && !showPaidContent) continue;
                 var aType = '';
                 if (!digest.videos[i].video_list[m].isAvailable) {
                     switch (digest.videos[i].video_list[m].availableReason) {
                         case 'svod':
                             aType = coloredStr('+', orange);
                             break;
                         case 'tvod':
                             aType = coloredStr('$', orange);
                             break;
                         default:
                             break;
                     }
                 }
                 var genres = '', first = true;
                 for (var j in config.categories) { // traversing categories
                     if (config.categories[j].id == digest.videos[i].video_list[m].category[0]) {
                          for (var k in digest.videos[i].video_list[m].genre_list) {
                              for (var l in config.categories[j].genres) { // traversing genres
                                   if (digest.videos[i].video_list[m].genre_list[k] == config.categories[j].genres[l].id) {
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
                 var title = showtime.entityDecode(unescape(digest.videos[i].video_list[m].title));
                 page.appendItem(PREFIX + ':indexByID:' + digest.videos[i].video_list[m].id + ':' + escape(title), "video", {
                     title: new showtime.RichText(aType + (digest.videos[i].video_list[m].isSeries ? title + colorStr('сериал', orange) : title)),
                     year: +parseInt(digest.videos[i].video_list[m].year),
                     genre: genres,
                     icon: digest.videos[i].video_list[m].image.small,
                     description: new showtime.RichText('(' + coloredStr(digest.videos[i].video_list[m].like, green) + ' / ' + coloredStr(digest.videos[i].video_list[m].dislike, red) + ') ' +
                        coloredStr('Комментариев: ', orange) + unescape(digest.videos[i].video_list[m].comments_num) +
                        coloredStr('<br>Страна: ', orange) + unescape(digest.videos[i].video_list[m].country))
                 });
            };
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
    settings.createBool('showPaidContent', 'Отображать платный контент', false, function(v) {
        showPaidContent = v;
    });

    plugin.addSearcher("megogo.net", logo, function(page, query) {
        checkConfig(page);
        page.entries = 0;
        var offset = 0, counter = 0, tryToSearch = true;
        function loader() {
            if (!tryToSearch) return false;
            var params = 'text=' + query + '&limit=20' + '&offset=' + offset;
            if (session) params += '&' + session;
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/p/search?' + params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + k2) + k1));
            page.loading = false;
            for (var i in json.video_list) {
                var title = showtime.entityDecode(unescape(json.video_list[i].title)) + (json.video_list[i].title_orig ? " | " + showtime.entityDecode(json.video_list[i].title_orig) : "");
                page.appendItem(PREFIX + (json.video_list[i].type == 5 ? ':video:' : ':indexByID:') + json.video_list[i].id + ':' + escape(title), "video", {
                    title: new showtime.RichText(title + (json.video_list[i].isSeries ? colorStr('сериал', orange) : '')),
                    year: +parseInt(json.video_list[i].year),
                    genre: (json.video_list[i].genre_list[0] ? unescape(json.video_list[i].genre_list[0].title) : ''),
                    rating: json.video_list[i].rating_imdb * 10,
                    duration: +parseInt(json.video_list[i].duration),
                    description: new showtime.RichText('(' + coloredStr(json.video_list[i].like, green) + ' / ' + coloredStr(json.video_list[i].dislike, red) + ') ' +
                        coloredStr('Страна: ', orange) + unescape(json.video_list[i].country) +
                        (json.video_list[i].budget ? coloredStr(' Бюджет: ', orange) + unescape(json.video_list[i].budget) : '')+
                        (json.video_list[i].slogan ? coloredStr('<br>Слоган: ', orange) + unescape(json.video_list[i].slogan) : '') +
                        coloredStr('<br>Описание: ', orange) + trim(showtime.entityDecode(unescape(json.video_list[i].description.replace(/&#151;/g, '—'))))),
                    icon: 'http://megogo.net' + unescape(json.video_list[i].image.small)
                });
                page.entries++;
                counter++;
            };
            offset += 20;
            if (counter == +json.total_num || offset > +json.total_num) return tryToSearch = false;
            return true;
        };
        loader();
        page.loading = false;
        page.paginator = loader;
    });
})(this);