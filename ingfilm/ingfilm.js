/**
 * ingfilm.ru plugin for Showtime
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
    var PREFIX = 'ingfilm';
    var BASE_URL = 'http://ingfilm.ru';
    var slogan = getDescriptor().synopsis;
    var logo = plugin.path + "logo.png";

    function trim(s) {
        return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ");
    }

    function orangeStr(str) {
        return '<font color="FFA500">' + str + '</font>';
    }
    function blueStr(str) {
        return '<font color="6699CC">' + str + '</font>';
    }

    function checkLink(url) {
        return url.substr(0, 4) == 'http' ? url : BASE_URL + url;
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

    var service = plugin.createService(getDescriptor().id, PREFIX + ":start", "video", true, logo);

    // Search IMDB ID by title
    function getIMDBid(title) {
        var origTitle = unescape(title).split(' | ');
        origTitle[1] ? origTitle = origTitle[1] : origTitle = origTitle[0];
        var resp = showtime.httpReq('http://www.imdb.com/find?q=' + encodeURIComponent(showtime.entityDecode(origTitle.replace(/ (HD)/,''))).toString()).toString();
        var imdbid = resp.match(/class="findResult[\S\s]*?<a href="\/title\/([\S\s]*?)\/\?/);
        return imdbid ? imdbid[1] : '';
    };

    // Play links
    plugin.addURI(PREFIX + ":play:(.*):(.*)", function(page, url, title) {
        page.type = "video";
        page.loading = true;
        switch (unescape(url).substr(0, 9)) {
            case 'http://mo':
                    var html = showtime.httpReq(unescape(url)).toString();
                    var link = showtime.JSONDecode(showtime.httpReq('http://moonwalk.cc/sessions/create_session', {
                               postdata: {
                                   'video_token': html.match(/video_token: '([\s\S]*?)'/)[1],
                                   'video_secret': html.match(/video_secret: '([\s\S]*?)'/)[1]
                               }
                    }));
                    link = 'hls:' + link['manifest_m3u8']
                break;
            case 'http://vk':
            case 'https://v':
                var html = showtime.httpReq(unescape(url));
                var re = /url720=(.*?)&/;
                var link = re.exec(html);
                if (!link) {
                    re = /url480=(.*?)&/;
                    link = re.exec(html);
                }
                if (!link) {
                    re = /url360=(.*?)&/;
                    link = re.exec(html);
                }
                if (!link) {
                    re = /url240=(.*?)&/;
                    link = re.exec(html);
                }
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
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            canonicalUrl: PREFIX + ':play:' + url + ':' + title,
            imdbid: getIMDBid(title),
            sources: [{
                url: link
            }]
        });
    });

    plugin.addURI(PREFIX + ":indexItem:(.*):(.*)", function(page, url, title) {
        setPageHeader(page, unescape(title));
        page.loading = true;
        var htmlBlock = showtime.httpReq(unescape(url)).toString();

        // 1-icon, 2-title, 3-genre, 4-rating, 5-year, 6-quality, 7-soundtrack,
        // 8-country, 9-director, 10-budget, 11-out(worldwide), 12-out(russia),
        // 13-duration, 14-actors, 15-url, 16-description
        var match = htmlBlock.match(/<div class="full-news-image"><img src="([\s\S]*?)" alt="([\s\S]*?)"[\s\S]*?<div class="main-news-janr">Жанр: ([\s\S]*?)<\/div>[\s\S]*?<li class="current-rating" style="[\s\S]*?">([\s\S]*?)<\/li>[\s\S]*?<span class="year">([\s\S]*?)<\/span>[\s\S]*?<font color="quality">([\s\S]*?)<\/font>[\s\S]*?<font color="[\s\S]*?">([\s\S]*?)<\/font>[\s\S]*?<\/b>([\s\S]*?)<br>[\s\S]*?<\/b>([\s\S]*?)<br>[\s\S]*?<\/b>([\s\S]*?)<br>[\s\S]*?<\/b>([\s\S]*?)<br>[\s\S]*?<\/b>([\s\S]*?)<br>[\s\S]*?<\/b>([\s\S]*?)<br>[\s\S]*?<\/b>([\s\S]*?)<br>[\s\S]*?<iframe id="div_video" src="([\s\S]*?)"[\s\S]*?<br \/>([\s\S]*?)<\/div>/);
        if (match) {
           function addItem(link, title, simpleTitle) {
               page.appendItem(PREFIX + ':play:' + escape(link) + ":" + escape(simpleTitle), 'video', {
                   title: new showtime.RichText(title),
                   icon: checkLink(match[1]),
                   genre: match[3],
                   duration: match[13],
                   year: +match[5],
                   rating: +match[4],
                   description: new showtime.RichText(orangeStr('Перевод: ') + match[7] +
                       ' ' +orangeStr('Страна: ') + match[8] + '<br>' + orangeStr('Режиссер: ') + match[9] +
                       ' ' +orangeStr('Бюджет: ') + match[10] + '<br>' + orangeStr('Премьера (Мир): ') + match[11] +
                       ' ' +orangeStr('Премьера (РФ): ') + match[12] + '<br>' + orangeStr('В ролях: ') + match[14] +
                       '<br>' + orangeStr('Описание: ') + match[16])
               });
            }

            if (match[15].substr(0, 9) == 'http://mo' && match[15].match(/serial/)) { // handle as series
                var html = showtime.httpReq(match[15]).toString();
                var block = html.match(/<select id="season"([\s\S]*?)<\/select>/);
                //1-value, 2-title
                var re = /value="([\s\S]*?)">([\s\S]*?)<\/option>/g;
                var series = re.exec(block[1])
                while (series) {
                    page.appendItem("", "separator", {
	                title: series[2]
    	            });
                    var video = showtime.httpReq(match[15]+'?season='+series[1]+'&episode=1').toString();
                    var videos = video.match(/<select id="episode"([\s\S]*?)<\/select>/);
                    //1-value, 2-title
                    var re2 = /value="([\s\S]*?)">([\s\S]*?)<\/option>/g;
                    video = re2.exec(videos[1])
                    while (video) {
                        addItem(match[15]+'?season='+series[1]+'&episode='+video[1], series[2] + ' - ' + video[2], series[2] + ' - ' + video[2]);
                        video = re2.exec(videos[1])
                    }
                    series = re.exec(block[1])
                }
            } else
                 addItem(match[15], blueStr(match[6]) + ' ' + match[2], match[2]);
        };
        htmlBlock = htmlBlock.match(/<div class="rel-news">([\s\S]*?)<\/ul>/);
        if (htmlBlock) {
            page.appendItem("", "separator", {
	        title: 'Похожие новости:'
	    });
            // 1-link, 2-icon, 3-title
            var re = /<div class="rel-news-image">[\S\s]*?<a href="([\S\s]*?)"><img src="([\S\s]*?)" alt="([\S\s]*?)"><\/a>/g;
            var match = re.exec(htmlBlock[1]);
            while (match) {
                page.appendItem(PREFIX + ':indexItem:' + escape(match[1]) + ":" + escape(match[3]), 'video', {
                    title: match[3],
                    icon: checkLink(match[2])
                });
                match = re.exec(htmlBlock[1]);
            }
        }
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":showGenres:(.*)", function(page, htmlBlock) {
        setPageHeader(page, slogan);
        htmlBlock = unescape(htmlBlock);
	var re = /<a href="([\s\S]*?)">([\s\S]*?)<\/a>/g;
        var match = re.exec(htmlBlock);
	while (match) {
            page.appendItem(PREFIX + ':listGenre:' + escape(match[1]) + ":" + escape(match[2]), 'directory', {
                title: match[2]
            });
	    match = re.exec(htmlBlock);
	};
    });

    plugin.addURI(PREFIX + ":listGenre:(.*):(.*)", function(page, url, title) {
        setPageHeader(page, unescape(title));
        page.loading = true;
        v = showtime.httpReq(BASE_URL + '/' + unescape(url)).toString();
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
                page.appendItem(PREFIX + ':indexItem:' + escape(match[1]) + ":" + escape(match[3]), 'video', {
                    title: new showtime.RichText(match[3]),
                    icon: checkLink(match[2]),
                    genre: match[5],
                    rating: +match[6],
                    description: new showtime.RichText(trim(match[4]))
                });
                page.entries++;
                match = re.exec(htmlBlock[1]);
            }
        }
    }

    plugin.addURI(PREFIX + ":start", function(page) {
        setPageHeader(page, slogan);
        var showAuthCredentials = false;
        while (1) {
            var credentials = plugin.getAuthCredentials(slogan, "Login required", showAuthCredentials);
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

        // genres
        var htmlBlock = v.match(/<div class="janr-block-content">([\S\s]*?)<div style/)
        if (htmlBlock) {
            page.appendItem(PREFIX + ':showGenres:' + escape(htmlBlock[1]), 'directory', {
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
                page.appendItem(PREFIX + ':indexItem:' + escape(match[1]) + ":" + escape(match[3]), 'video', {
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

    plugin.addSearcher(getDescriptor().id, logo, function(page, query) {
        var credentials = plugin.getAuthCredentials(slogan, "Login required", false);
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
            v = showtime.httpReq(next[1].match(/<a href="([\S\s]*?)">/)[1]).toString();
            page.loading = false;
            return true;
        };

        loader();
        page.paginator = loader;
    });
})(this);