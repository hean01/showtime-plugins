/**
 * ingfilm.ru plugin for Movian Media Center
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
    var BASE_URL = 'http://ingfilm.ru';
    var logo = plugin.path + "logo.png";

    function trim(s) {
        return showtime.entityDecode(s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " "));
    }

    function orangeStr(str) {
        return '<font color="FFA500">' + str + '</font>';
    }
    function blueStr(str) {
        return '<font color="6699CC">' + str + '</font>';
    }

    function checkLink(url) {
        return url.substr(0, 4) == 'http' ? url : BASE_URL + (url[1] == '/' ? url : '/' + url);
    }

    function unicode2win1251(str) {
        if (str == 0) return 0;
        var result = "";
        var uniCode = 0;
        var winCode = 0;
        for (var i = 0; i < str.length; i++) {
            uniCode = str.charCodeAt(i);
            if (uniCode == 1105) {
                winCode = 184;
            } else if (uniCode == 1025) {
                winCode = 168;
            } else if (uniCode > 1039 && uniCode < 1104) {
                winCode = uniCode - 848;
            } else {
                winCode = uniCode;
            }
            result += String.fromCharCode(winCode);
        }
        var encoded = "";
        for (var i = 0; i < result.length; ++i) {
            var code = Number(result.charCodeAt(i));
            encoded += "%" + code.toString(16).toUpperCase();
        }
        return encoded;
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

    var service = plugin.createService(plugin.getDescriptor().id, plugin.getDescriptor().id + ":start", "video", true, logo);

    // Search IMDB ID by title
    function getIMDBid(title) {
        var resp = showtime.httpReq('http://www.imdb.com/find?ref_=nv_sr_fn&q=' + encodeURIComponent(showtime.entityDecode(unescape(title))).toString()).toString();
        var imdbid = resp.match(/<a href="\/title\/(tt\d+)\//);
        if (imdbid) return imdbid[1];
        return imdbid;
    };

    // Play links
    plugin.addURI(plugin.getDescriptor().id + ":play:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        switch (unescape(url).substr(0, 9)) {
            case 'http://bd':
            case 'http://se':
            case 'http://mo':
                var html = showtime.httpReq(unescape(url)).toString();
                var link = showtime.JSONDecode(showtime.httpReq('http://moonwalk.cc/sessions/create_session', {
                    postdata: {
                        'video_token': html.match(/video_token: '([\s\S]*?)'/)[1],
                        'access_key': html.match(/access_key: '([\s\S]*?)'/)[1]
                    }
                }));
                link = 'hls:' + link['manifest_m3u8']
                break;
            case 'http://vk':
            case 'https://v':
                var html = showtime.httpReq(unescape(url)).toString();
                var link = html.match(/url720=(.*?)&/);
                if (!link)
                    link = link = html.match(/url480=(.*?)&/);
                if (!link)
                    link = link = html.match(/url360=(.*?)&/);
                if (!link)
                    link = link = html.match(/url240=(.*?)&/);
                if (!link) {
                    page.error('Видео не доступно. / This video is not available, sorry :(');
                    return;
                }
                link = link[1]
                break;
            default:
                break;
        }
        page.loading = false;
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            canonicalUrl: plugin.getDescriptor().id + ':play:' + url + ':' + title,
            imdbid: getIMDBid(title),
            sources: [{
                url: link
            }]
        });
    });

    function getGenres(blob) {
        // Let's get the genres
        var genre = '', first = true;
        var re = /<a href="([\s\S]*?)">([\s\S]*?)<\/a>/g;
        var gMatch = re.exec(blob);
        while (gMatch) {
            if (first) {
                genre += gMatch[2];
                    first = false;
            } else
                genre += ', ' + gMatch[2]
                gMatch = re.exec(blob)
        }
        return genre;
    }

    plugin.addURI(plugin.getDescriptor().id + ":listSeason:(.*):(.*):(.*)", function(page, link, series, title) {
        setPageHeader(page, unescape(title));
        page.loading = true;
        var video = showtime.httpReq(unescape(link) + '?season=' + series + '&episode=1').toString();
        var videos = video.match(/<select id="episode"([\s\S]*?)<\/select>/);
        //1-value, 2-title
        var re = /value="([\s\S]*?)">([\s\S]*?)<\/option>/g;
        video = re.exec(videos[1])
        while (video) {
            page.appendItem(plugin.getDescriptor().id + ':play:' + link + escape('?season=' + series + '&episode=' + video[1]) + ':' + escape(unescape(title) + ' - ' + video[2]), 'video', {
                title: unescape(title) + ' - ' + video[2]
            });
            video = re.exec(videos[1])
        }
        page.loading = false;
    });

    plugin.addURI(plugin.getDescriptor().id + ":indexItem:(.*):(.*)", function(page, url, title) {
        setPageHeader(page, unescape(title));
        page.loading = true;
        var htmlBlock = showtime.httpReq(unescape(url)).toString();
        var genres = '', actors = '';

        // 1-icon, 2-title, 3-views, 4-genre, 5-rating, 6-year, 7-quality, 8-soundtrack,
        // 9-country, 10-director, 11-budget, 12-out(worldwide), 13-out(russia),
        // 14-duration, 15-rating kinopoisk, 16-rating imdb, 17-actors
        // 18-url, 19-description
        var match = htmlBlock.match(/<div class="full-news-image"><img src="([\s\S]*?)" alt="([\s\S]*?)"[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<div class="main-news-janr">Жанр: ([\s\S]*?)<\/div>[\s\S]*?<li class="current-rating" style="[\s\S]*?">([\s\S]*?)<\/li>[\s\S]*?<span class="year">([\s\S]*?)<\/span>[\s\S]*?<font color="quality">([\s\S]*?)<\/font>[\s\S]*?<font color="[\s\S]*?">([\s\S]*?)<\/font>[\s\S]*?<\/b>([\s\S]*?)<br>[\s\S]*?<\/b>([\s\S]*?)<br>[\s\S]*?<\/b>([\s\S]*?)<br>[\s\S]*?<\/b>([\s\S]*?)<br>[\s\S]*?<\/b>([\s\S]*?)<br>[\s\S]*?<\/b>([\s\S]*?)<br>[\s\S]*?<\/b>([\s\S]*?)<br>[\s\S]*?<\/b>([\s\S]*?)<br>[\s\S]*?<\/b>([\s\S]*?)<br>[\s\S]*?<iframe id="div_video" src="([\s\S]*?)"[\s\S]*?<br \/>([\s\S]*?)<\/div>/);
        if (match) {
            function addItem(link, title, simpleTitle) {
                genres = match[4];
                actors = match[17];
                page.appendItem(link + ":" + escape(simpleTitle), 'video', {
                    title: new showtime.RichText(title),
                    icon: checkLink(match[1]),
                    genre: getGenres(genres),
                    duration: match[14],
                    year: +match[6],
                    rating: +match[5],
                    description: new showtime.RichText(orangeStr('Просмотров: ') + match[3] +
                        orangeStr(' Перевод: ') + match[8] +
                        orangeStr(' Страна: ') + match[9] +
                        orangeStr('\nРежиссер: ') + match[10] +
                        orangeStr(' Бюджет: ') + match[11] +
                        orangeStr('\nПремьера (Мир): ') + match[12] +
                        orangeStr('\nПремьера (РФ): ') + match[13] +
                        orangeStr('\nКиноПоиск: ') + match[15] +
                        orangeStr(' IMDB: ') + match[16] +
                        orangeStr('\nОписание: ') + match[19])
                });
            }

            if (match[18].match(/serial/)) { // handle as series
                var html = showtime.httpReq(match[18]).toString();
                var block = html.match(/<select id="season"([\s\S]*?)<\/select>/);
                //1-value, 2-title
                var re = /value="([\s\S]*?)">([\s\S]*?)<\/option>/g;
                var series = re.exec(block[1])
                while (series) {
                    addItem(plugin.getDescriptor().id + ':listSeason:' + escape(match[18]) + ':' + series[1], series[2], series[2]);
                    series = re.exec(block[1])
                }
            } else
                 addItem(plugin.getDescriptor().id + ':play:' + escape(match[18]), blueStr(match[7]) + ' ' + match[2], match[2]);

        };

        if (genres) {
            page.appendItem("", "separator", {
	        title: 'Жанры:'
	    });
            // Let's get the genres
            var re = /<a href="([\s\S]*?)">([\s\S]*?)<\/a>/g;
            var gMatch = re.exec(genres);
            while (gMatch) {
                page.appendItem(plugin.getDescriptor().id + ':listGenre:' + escape(gMatch[1]) + ":" + escape(gMatch[2]), 'directory', {
                    title: gMatch[2]
                });
                gMatch = re.exec(genres)
             }
        }

        page.appendItem("", "separator", {
            title: 'В ролях:'
	});
        var re = /<a href="([\s\S]*?)">([\s\S]*?)<\/a>/g;
        var gMatch = re.exec(actors);
            while (gMatch) {
                page.appendItem(plugin.getDescriptor().id + ':listGenre:' + escape(gMatch[1]) + ":" + escape(gMatch[2]), 'directory', {
                    title: gMatch[2]
                });
                gMatch = re.exec(actors)
             }

        var related = htmlBlock.match(/<div class="rel-news">([\s\S]*?)<\/ul>/);
        if (related) {
            page.appendItem("", "separator", {
	        title: 'Похожие новости:'
	    });
            // 1-link, 2-icon, 3-title
            var re = /<div class="rel-news-image">[\S\s]*?<a href="([\S\s]*?)"><img src="([\S\s]*?)" alt="([\S\s]*?)"><\/a>/g;
            var match = re.exec(related[1]);
            while (match) {
                page.appendItem(plugin.getDescriptor().id + ':indexItem:' + escape(match[1]) + ":" + escape(match[3]), 'video', {
                    title: match[3],
                    icon: checkLink(match[2])
                });
                match = re.exec(related[1]);
            }
        }

        // 1-icon, 2-nick, 3-stats, 4-text
        var re = /<div class="comment-block">[\S\s]*?<img src="([\S\s]*?)"[\S\s]*?href="[\S\s]*?">([\S\s]*?)<\/a>([\S\s]*?)<\/div>[\S\s]*?<div id='[\S\s]*?'>([\S\s]*?)<\/div>/g;
        var first = true;
        var match = re.exec(htmlBlock);
        while (match) {
            if (first) {
                page.appendItem("", "separator", {
	            title: 'Комментарии:'
	        });
                first = false;
            }
            page.appendPassiveItem('video', '', {
                title: match[2],
                icon: checkLink(match[1]),
                description: new showtime.RichText(orangeStr('Добавлено: ') + trim(match[3]) + '\n' + orangeStr('Комментарий: ') + trim(match[4]))
            });
            match = re.exec(htmlBlock);
        }
        page.loading = false;
    });

    plugin.addURI(plugin.getDescriptor().id + ":showGenres:(.*)", function(page, htmlBlock) {
        setPageHeader(page, plugin.getDescriptor().synopsis);
        htmlBlock = unescape(htmlBlock);
	var re = /<a href="([\s\S]*?)">([\s\S]*?)<\/a>/g;
        var match = re.exec(htmlBlock);
	while (match) {
            page.appendItem(plugin.getDescriptor().id + ':listGenre:' + escape(match[1]) + ":" + escape(match[2]), 'directory', {
                title: match[2]
            });
	    match = re.exec(htmlBlock);
	};
    });

    plugin.addURI(plugin.getDescriptor().id + ":listGenre:(.*):(.*)", function(page, url, title) {
        setPageHeader(page, unescape(title));
        page.loading = true;
        v = showtime.httpReq(checkLink(unescape(url))).toString();
        page.loading = false;
        var tryToSearch = true;
        function loader() {
            if (!tryToSearch) return false;
            scraper(page);
            var next = v.match(/<i class="next-nav1">([\S\s]*?)<span>/);
            if (!next || !next[1]) return tryToSearch = false;
            page.loading = true;
            v = showtime.httpReq(next[1].match(/<a href="([\S\s]*?)">/)[1]).toString();
            page.loading = false;
            return true;
        };
        loader();
        page.paginator = loader;
    });

    var v;

    function scraper(page) {
        var htmlBlock = v.match(/<div class="main-content">([\S\s]*?)<div class="bg-fotter">/)
        if (htmlBlock) {
            page.entries = 0;
            // 1-link, 2-icon, 3-title, 4-description, 5-genre, 6-rating
            var re = /<a href="([\S\s]*?)"><img src="([\S\s]*?)" alt="([\S\s]*?)"><\/a>[\S\s]*?style="display:inline;">([\S\s]*?)<\/div>[\S\s]*?<div class="main-news-janr">([\S\s]*?)<\/div>[\S\s]*?<li class="current-rating" style="[\S\s]*?">([\S\s]*?)<\/li>/g;
            var match = re.exec(htmlBlock[1]);
            while (match) {
                page.appendItem(plugin.getDescriptor().id + ':indexItem:' + escape(match[1]) + ":" + escape(match[3]), 'video', {
                    title: new showtime.RichText(match[3]),
                    icon: checkLink(match[2]),
                    genre: getGenres(match[5]),
                    rating: +match[6],
                    description: new showtime.RichText(trim(match[4]))
                });
                page.entries++;
                match = re.exec(htmlBlock[1]);
            }
        }
    }

    plugin.addURI(plugin.getDescriptor().id + ":top250", function(page) {
        setPageHeader(page, 'Топ 250');
        page.loading = true;
        var doc = showtime.httpReq(BASE_URL + '/top250.html');
        // 1 - link&title, 2-orig title, 3-rating, 4-numbers
        var re = /<td class="topname" valign="top">([\s\S]*?)<br \/>([\s\S]*?)<\/td>[\s\S]*?<div class="topkono">([\s\S]*?)<span>([\s\S]*?)<\/span>/g;
        var match = re.exec(doc);
	while (match) {
            var title = match[1].match(/">([\s\S]*?)<\/a>/);
            if (title)
                title = title[1];
            else
                title = match[1];
            var origTitle = match[2].match(/<span class="topspan">([\s\S]*?)<\/span>/);
            if (origTitle)
                title = title + ' | ' + origTitle[1];
            var url = match[1].match(/href="([\s\S]*?)"/);

            if (url) {
                url = escape(BASE_URL + (url[1][0] == '/' ? url[1] : '/' + url[1]));
            }
            page.appendItem(plugin.getDescriptor().id + ':indexItem:' + url + ":" + escape(title), 'video', {
                title: url ? title : '-' + title,
                rating: match[3] * 10,
                description: new showtime.RichText((url ? title : '-' + title) +
                    orangeStr('\nК-во голосов: ') + match[4].match(/\((.*)\)/)[1])
            });
	    match = re.exec(doc);
	};
        page.loading = false;
    });

    plugin.addURI(plugin.getDescriptor().id + ":start", function(page) {
        setPageHeader(page, plugin.getDescriptor().synopsis);
        var showAuthCredentials = false;
        while (1) {
            var credentials = plugin.getAuthCredentials(plugin.getDescriptor().synopsis, "Login required", showAuthCredentials);
            if (credentials.rejected) return; //rejected by user
            if (credentials) {
                page.loading = true;
                v = showtime.httpReq(BASE_URL, {
                    postdata: {
                        'login_name': credentials.username,
                        'login_password': credentials.password,
                        'login': 'submit'
                    },
                    noFollow: true
                }).toString();
                page.loading = false;
                showAuthCredentials = v.match(/<div class="logintext">/);
                if (!showAuthCredentials) break;
            };
            showAuthCredentials = true;
        };

        //top 250
        page.appendItem(plugin.getDescriptor().id + ':top250', 'directory', {
            title: 'Топ 250'
        });

        // genres
        var htmlBlock = v.match(/<div class="janr-block-content">([\S\s]*?)<div style/)
        if (htmlBlock) {
            page.appendItem(plugin.getDescriptor().id + ':showGenres:' + escape(htmlBlock[1]), 'directory', {
                title: 'Жанры'
            });
        }

        // recommended
        htmlBlock = v.match(/<div class="news-block">([\S\s]*?)<div class="bg-janr-block">/)
        if (htmlBlock) {
            page.appendItem("", "separator", {
	        title: 'Рекомендуемое:'
	    });

            // 1-link, 2-icon, 3-title, 4-description
            var re = /<div class="news-new-news-image">[\S\s]*?<a href="([\S\s]*?)"><img src="([\S\s]*?)" alt="([\S\s]*?)"><\/a>[\S\s]*?<div class="news-new-news-content" style="display: none; ">([\S\s]*?)<div/g;
            var match = re.exec(htmlBlock[1]);
            while (match) {
                page.appendItem(plugin.getDescriptor().id + ':indexItem:' + escape(match[1]) + ":" + escape(match[3]), 'video', {
                    title: new showtime.RichText(match[3]),
                    icon: checkLink(match[2]),
                    description: showtime.entityDecode(trim(match[4]))
                });
                match = re.exec(htmlBlock[1]);
            }
        }

        // news
        var tryToSearch = true;
        page.appendItem("", "separator", {
            title: 'Новинки:'
        });

        function loader() {
            if (!tryToSearch) return false;
            scraper(page);
            var next = v.match(/<i class="next-nav1">([\S\s]*?)<span>/);
            if (!next || !next[1]) return tryToSearch = false;
            page.loading = true;
            v = showtime.httpReq(next[1].match(/<a href="([\S\s]*?)">/)[1]).toString();
            page.loading = false;
            return true;
        };

        loader();
        page.paginator = loader;
    });

    plugin.addSearcher(plugin.getDescriptor().id, logo, function(page, query) {
        var credentials = plugin.getAuthCredentials(plugin.getDescriptor().synopsis, "Login required", false);
        if (credentials) {
             v = showtime.httpReq(BASE_URL, {
                 postdata: {
                     'login_name': credentials.username,
                     'login_password': credentials.password,
                     'login': 'submit'
                 },
                 noFollow: true
            }).toString();
            if (v.match(/<div class="logintext">/)) return;
        };

        v = showtime.httpReq(BASE_URL + '/?do=search&subaction=search&story=' + unicode2win1251(query)).toString();
        var tryToSearch = true;
        function loader() {
            if (!tryToSearch) return false;
            scraper(page);
            var next = v.match(/<i class="next-nav1">([\S\s]*?)<span>/);
            if (!next || !next[1]) return tryToSearch = false;
            page.loading = true;
            var next = next[1].match(/<a href="([\S\s]*?)">/);
            if (next) {
                 v = showtime.httpReq([1]).toString();
                 page.loading = false;
                 return true;
            }
            return page.loading = tryToSearch = false;
        };

        loader();
        page.paginator = loader;
    });
})(this);