/**
 * brb.to plugin for Showtime
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

    var PREFIX = 'brb_to';
    var BASE_URL = 'http://brb.to';
    var slogan = 'brb.to - Рекомендательная видеосеть';
    var logo = plugin.path + "logo.jpg";

    var sURL = {};
    var sTitle = {};

    var service = plugin.createService("brb.to", PREFIX + ":start", "video", true, logo);

    function setPageHeader(page, title) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    }

    // remove multiple, leading or trailing spaces and line feeds
    function trim(s) {
        return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ").replace(/\t/g, '');
    }

    function removeSlashes(s) {
        return s.replace(/\\'/g, '\'').replace(/\\"/g, '"').replace(/\\0/g, '\0').replace(/\\\\/g, '\\');
    }

    function blueStr(str) {
        return '<font color="6699CC">' + str + '</font>';
    }

    var blue = '6699CC', orange = 'FFA500', red = 'EE0000', green = '008B45';

    function colorStr(str, color) {
        return '<font color="' + color + '">(' + str + ')</font>';
    }

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    function getFontColor(type) {
        switch (type) {
            case "Видео":
                return '"FFDE00"';
            case "Аудио":
                return '"FF0000"';
            case "Игры":
                return '"92CD00"';
            case "Литература":
                return '"6699CC"';
            default:
                return '"FFDE00"';
        }
    }

    function getType(type) {
        type = type.toLowerCase();
        switch (type) {
            case "mkv":
            case "avi":
            case "flv":
            case "mp4":
            case "mov":
            case "ts":
            case "mpg":
            case "mpeg":
            case "vob":
            case "iso":
            case "m4v":
            case "wmv":
            case "m2ts":
                return "video";
            case "jpg":
            case "jpeg":
            case "png":
            case "bmp":
            case "gif":
                return "image";
            case "mp3":
            case "flac":
            case "wav":
            case "ogg":
            case "aac":
            case "m4a":
            case "ape":
            case "dts":
            case "ac3":
                return "audio";
            default:
                return "file";
        }
    }

    // Appends the item and lists it's root folder
    plugin.addURI(PREFIX + ":listRoot:(.*):(.*)", function(page, url, title) {
        title = unescape(title).replace(/(<([^>]+)>)/ig).replace(/undefined/g,'');
        setPageHeader(page, title);
        page.loading = true;
        var response = showtime.httpReq(BASE_URL + url).toString();
        page.loading = false;

        // Scrape icon
	var icon = response.match(/<link rel="image_src" href="([^"]+)"/);
	if (icon) icon = icon[1];

        // Scrape description
	var description = response.match(/<p class="item-decription [^"]+">([\S\s]*?)<\/p>/);
	if (description) description = coloredStr("Описание: ", orange) + description[1]; else description = '';

        // Scrape duration
        var duration = response.match(/itemprop="duration"[\S\s]*?>([\S\s]*?)<\/span>/);
        if (duration) duration = duration[1];

        // Scrape item info
        var iteminfo = response.match(/<div class="item-info">([\S\s]*?)<\/div>/);
        if (iteminfo) {
           iteminfo = iteminfo.toString();
           // Scrape years
           var year = iteminfo.match(/Год:[\S\s]*?<span>([\S\s]*?)<\/span>/);
           if (year) {
              year = year[1];
           } else { // handle as serials
              year = iteminfo.match(/показа:[\S\s]*?<span>([\S\s]*?)<\/span>[\S\s]*?<span>([\S\s]*?)<\/span>/);
              if (year) year = year[1];
           };

           // Scrape genres
           var htmlBlock = iteminfo.match(/itemprop="genre"([\S\s]*?)<\/td>/);
           // Try to handle as shows
           if (!htmlBlock) htmlBlock = iteminfo.match(/Жанр:([\S\s]*?)<\/tr>/);
           if (htmlBlock) {
              var genres = '';
              var notFirst = 0;
              var re = /<span>([\S\s]*?)<\/span>/g;
              var m = re.exec(htmlBlock[1]);
              while (m) {
                    if (!notFirst) genres = genres + m[1]; else genres = genres + ", " + m[1];
                    notFirst++;
                    m = re.exec(htmlBlock[1]);
              };
           }; // Scrape genres

           // Scrape actors
           htmlBlock = iteminfo.match(/itemprop="actor"([\S\s]*?)<\/td>/);
           if (htmlBlock) {
              var actors = '';
              var notFirst = 0;
              var re = /itemprop="name">([\S\s]*?)<\/span>/g;
              var m = re.exec(htmlBlock[1]);
              while (m) {
                    if (!notFirst) actors = actors + m[1]; else actors = actors + ", " + m[1];
                    notFirst++;
                    m = re.exec(htmlBlock[1]);
              };
              description = coloredStr("В ролях: ", orange) + actors + " " + description;
           }; // Scrape actors

           // Scrape directors
           htmlBlock = iteminfo.match(/itemprop="director"([\S\s]*?)<\/td>/);
           if (htmlBlock) {
              var directors = '';
              var notFirst = 0;
              var re = /itemprop="name">([\S\s]*?)<\/span>/g;
              var m = re.exec(htmlBlock[1]);
              while (m) {
                    if (!notFirst) directors = directors + m[1]; else directors = directors + ", " + m[1];
                    notFirst++;
                    m = re.exec(htmlBlock[1]);
              };
              description = coloredStr("Режиссер: ", orange) + directors + " " + description;
           }; // Scrape directors

           // Try to handle as shows
           htmlBlock = iteminfo.match(/Ведущие:([\S\s]*?)<\/tr>/);
           if (htmlBlock) {
              var directors = '';
              var notFirst = 0;
              var re = /<span>([\S\s]*?)<\/span>/g;
              var m = re.exec(htmlBlock[1]);
              while (m) {
                    if (!notFirst) directors = directors + m[1]; else directors = directors + ", " + m[1];
                    notFirst++;
                    m = re.exec(htmlBlock[1]);
              };
              description = coloredStr("Ведущие: ", orange) + directors + " " + description;
           }; // handle as shows

           // Scrape countries
           var htmlBlock = iteminfo.match(/class="tag-country-flag"([\S\s]*?)<\/td>/);
           if (htmlBlock) {
              var countries = '';
              var notFirst = 0;
              var re = /<\/span>([\S\s]*?)<\/span>/g;
              var m = re.exec(htmlBlock[1]);
              while (m) {
                    if (!notFirst) countries = countries + m[1]; else countries = countries + ", " + m[1];
                    notFirst++;
                    m = re.exec(htmlBlock[1]);
              };
              description = coloredStr("Страна:", orange) + countries + " " + description;
           }; // Scrape countries

        }; // Scrape item info

        page.loading = false;
        page.appendItem(PREFIX + ":playOnline:" + url + ":" + escape(title), "video", {
            title: new showtime.RichText(title),
            duration: duration,
            icon: icon,
            year: +year,
            genre: genres,
            description: new showtime.RichText(description)
        });

        var what_else = response.match(/<div class="b-posters">([\S\s]*?)<div class="clear">/);
        var commented = response.match(/<div class="b-item-material-comments__content">([\S\s]*?)<div class="b-item-material-comments__footer">/);

        // list files/folders
        page.loading = true;
        response = showtime.httpReq(BASE_URL + url + '?ajax&blocked=0&folder=0');
        page.loading = false;
        var re = /<ul class="filelist[^"]+[\S\s]*?<\/ul>/;
        response = re.exec(response);
        var start = 0, end = 0;
        if (response) {
            response = response[0].replace(/(class="b-transparent-area")/g, "");
            start = response.indexOf('<li class="', start + 1);
            end = response.indexOf('</li>', start + 1);
            // 1 - type, 2 - folder_id, 3 - name, 4 - size, 5 - details, 6 - date
            re = /<li class="([^"]+)[\S\s]*?rel="\{parent_id: ([^}]+)\}"[\S\s]*?>([\S\s]*?)<\/a>[\S\s]*?<span class="material-size">([\S\s]*?)<span class="material-details">([^\<]+)[\S\s]*?<span class="material-date">([^\<]+)/;
            var m = re.exec(response.substring(start, end));
        }
        while (m && (start > 0)) {
            m[3] = trim(m[3]);
            // Material size clean & join
            m[4] = m[4].replace(/<span class="material-size">/g, "");
            m[4] = m[4].replace(/<\/span>/g, "");
            m[4] = trim(m[4]);
            if (m[1] == "folder") {
                page.appendItem(PREFIX + ":listFolder:" + escape(url) + ":" + m[2].replace("\'", "") + ":" + escape(title), "directory", {
                    title: new showtime.RichText(m[3] + '<font color="6699CC"> (' + m[4] + ')</font> ' + m[5] + " " + m[6])
                });
            };
            start = response.indexOf('<li class="', start + 1);
            end = response.indexOf('</li>', start + 1);
            m = re.exec(response.substring(start, end));
        }


        if (iteminfo) {
            // Show year
            var year = iteminfo.match(/Год:[\S\s]*?<a href="([\S\s]*?)"[\S\s]*?<span>([\S\s]*?)<\/span>/);
            if (year) {
                page.appendItem(PREFIX + ":index:" + BASE_URL + year[1] + ":" + escape(year[2]) + '::&sort=rating', "directory", {
                    title: year[2]
                });
            } else { // handle as serials
                year = iteminfo.match(/показа:[\S\s]*?<a href="([\S\s]*?)"[\S\s]*?<span>([\S\s]*?)<\/span>[\S\s]*?<span>([\S\s]*?)<\/span>/);
                if (year) {
                    page.appendItem(PREFIX + ":index:" + BASE_URL + year[1] + ":" + escape(year[2]) + '::&sort=rating', "directory", {
                        title: 'Год: ' + year[2]
                    });
                }
            };

            // Scrape genres
            htmlBlock = iteminfo.match(/itemprop="genre"([\S\s]*?)<\/td>/);
            // Try to handle as shows
            if (!htmlBlock) htmlBlock = iteminfo.match(/Жанр:([\S\s]*?)<\/tr>/);
            if (htmlBlock) {
                page.appendItem("", "separator", {
                    title: 'Жанр'
                });
                var re = /<a href="([\S\s]*?)"[\S\s]*?<span>([\S\s]*?)<\/span>/g;
                var m = re.exec(htmlBlock[1]);
                while (m) {
                    page.appendItem(PREFIX + ":index:" + BASE_URL + m[1] + ":" + escape('Фильмы '+m[2]) + '::&sort=year', "directory", {
                        title: m[2]
                    });
                    m = re.exec(htmlBlock[1]);
                };
            }; // Scrape genres

            // Scrape countries
            var htmlBlock = iteminfo.match(/Страна:([\S\s]*?)<\/tr>/);
            if (htmlBlock) {
                page.appendItem("", "separator", {
                    title: 'Страна'
                });
                var re = /<a href="([\S\s]*?)"[\S\s]*?<\/span>([\S\s]*?)<\/span>/g;
                var m = re.exec(htmlBlock[1]);
                while (m) {
                    page.appendItem(PREFIX + ":index:" + BASE_URL + m[1] + ":" + escape('Фильмы '+trim(showtime.entityDecode(m[2]))) + '::&sort=year', "directory", {
                        title: trim(showtime.entityDecode(m[2]))
                    });
                    m = re.exec(htmlBlock[1]);
                };
           }; // Scrape countries

            // Show directors
            htmlBlock = iteminfo.match(/itemprop="director"([\S\s]*?)<\/td>/);
            if (htmlBlock) {
                page.appendItem("", "separator", {
                    title: 'Режиссеры'
                });
                //1-link, 2-title
                var re = /<a href="([\S\s]*?)"[\S\s]*?<span itemprop="name">([\S\s]*?)<\/span>/g;
                var m = re.exec(htmlBlock[1]);
                while (m) {
                    page.appendItem(PREFIX + ":index:" + BASE_URL + m[1] + ":" + escape('Фильмы режиссера '+m[2]) + '::&sort=year', "directory", {
                        title: m[2]
                    });
                    m = re.exec(htmlBlock[1]);
                };
            };
            // Show actors
            htmlBlock = iteminfo.match(/itemprop="actor"([\S\s]*?)<\/td>/);
            if (htmlBlock) {
                page.appendItem("", "separator", {
                    title: 'Актеры'
                });
                //1-link, 2-title
                var re = /<a href="([\S\s]*?)"[\S\s]*?<span itemprop="name">([\S\s]*?)<\/span>/g;
                var m = re.exec(htmlBlock[1]);
                while (m) {
                    page.appendItem(PREFIX + ":index:" + BASE_URL + m[1] + ":" + escape('Фильмы с участием '+m[2]) + '::&sort=year', "directory", {
                        title: m[2]
                    });
                    m = re.exec(htmlBlock[1]);
                };
            };
        };

        // Show related
        if (what_else) {
            what_else = what_else[1];
            page.appendItem("", "separator", {
                title: 'Похожие материалы'
            });
            // 1 - link, 2 - image, 3 - title
            re = /<a href="([^"]+)[\S\s]*?url\('([^']+)[\S\s]*?<span class="m-poster-new__full_title">([\S\s]*?)<\/span>/g;
            m = re.exec(what_else);
            while (m) {
                title = m[3].replace('<p>', " / ").replace('</p><p>', " ").replace('</p>', "");
                page.appendItem(PREFIX + ":listRoot:" + m[1] + ":" + escape(title), "video", {
                    title: new showtime.RichText(title),
                    icon: m[2].replace('/9/', '/2/')
                });
                m = re.exec(what_else);
            }
        }

        // Show comments
        if (commented) {
            commented = commented[1];

            page.appendItem("", "separator", {
                title: commented.match(/<p class="b-item-material-comments__count">([\S\s]*?)<\/p>/)[1].replace('<span itemprop="reviewCount">', '').replace('</span>', '').replace('  ', ' ')
            });
            // 1-icon, 2-nick, 3-datetime, 4-positive, 5-negative, 6-description
            re = /url\('([\S\s]*?)'\);[\S\s]*?<span itemprop="reviewer">([\S\s]*?)<\/span>[\S\s]*?datetime="[\S\s]*?">([\S\s]*?)<\/time>[\S\s]*?<span class="b-item-material-comments__item-answer-value">([\S\s]*?)<\/span>[\S\s]*?<span class="b-item-material-comments__item-answer-value">([\S\s]*?)<\/span>[\S\s]*?itemprop="description">([\S\s]*?)<\/div>/g;
            var match = re.exec(commented);
            while (match) {
                page.appendPassiveItem('video', '', {
                    title: new showtime.RichText(trim(match[2]) + ' (' + coloredStr(match[4], green) + ' / ' + coloredStr(match[5], red) + ') ' + trim(match[3])),
                    icon: match[1].replace('/3/', '/1/'),
                    description: new showtime.RichText(match[6])
                });
                match = re.exec(commented);
            }
        }
    });

    plugin.addURI(PREFIX + ":listFolder:(.*):(.*):(.*)", function(page, url, folder, title) {
        title = unescape(title);
        setPageHeader(page, title);
        page.loading = true;
        var response = showtime.httpReq(BASE_URL + unescape(url) + '?ajax&blocked=0&folder=' + folder);
        page.loading = false;
        var re = /<li class="([^"]+)([\S\s]*?)<\/li>/g;
        var m = re.exec(response); // parsed list will live here
        while (m) {
            if (m[1].indexOf("file") > -1) {
                var flv_link = "";
                if (m[2].match(/a href="([^"]+)/)) flv_link = m[2].match(/a href="([^"]+)/)[1];
                var name = m[2].match(/span class="[\S\s]*?filename-text".?>([\S\s]*?)<\/span>/)[1];
                var size = m[2].match(/span class="[\S\s]*?material-size">([\S\s]*?)<\/span>/)[1];
                var direct_link = m[2].match(/" href="([^"]+)/)[1];
                if (getType(direct_link.split('.').pop()) == 'video') {
                    sURL[direct_link] = flv_link;
                    sTitle[direct_link] = name;
                    page.appendItem(PREFIX + ":play:" + direct_link, getType(direct_link.split('.').pop()), {
                        title: new showtime.RichText(name + '<font color="6699CC"> (' + size + ')</font>')
                    });
                } else {
                    page.appendItem(BASE_URL + direct_link, getType(direct_link.split('.').pop()), {
                        title: new showtime.RichText(name + '<font color="6699CC"> (' + size + ')</font>')
                    });
                }
            } else {
                if (m[1] == "folder") {
                    var re2 = /<li class="([^"]+)[\S\s]*?href="([^"]+)[\S\s]*?class="link-material" ><span style="">([\S\s]*?)<\/span>[\S\s]*?<span class="material-size">([\S\s]*?)<\/span>/;
                    var n = re2.exec(m[2]);
                    if (n) { // checking for opened folder
                        re2 = /<li class="([^"]+)[\S\s]*?" href="([^"]+)[\S\s]*?class="link-material" ><span style="">([\S\s]*?)<\/span>[\S\s]*?<span class="material-size">([\S\s]*?)<\/span>/;
                        n = re2.exec(m[2]);
                        page.appendItem(n[2], getType(n[1]), {
                            title: new showtime.RichText(n[3] + '<font color="6699CC"> (' + n[4] + ')</font>')
                        });
                    } else {
                        var re2 = /rel="\{parent_id: ([^}]+)\}">([\S\s]*?)<\/a>[\S\s]*?<span class="material-size">([\S\s]*?)<\/span>[\S\s]*?<span class="material-details">([^\<]+)[\S\s]*?<span class="material-date">([^\<]+)/;
                        var n = re2.exec(m[2]);
                        n[2] = trim(n[2]);
                        page.appendItem(PREFIX + ":listFolder:" + escape(url) + ":" + n[1].replace("'", "") + ":" + escape(title), "directory", {
                            title: new showtime.RichText(n[2] + '<font color="6699CC"> (' + n[3] + ')</font> ' + n[4] + " " + n[5])
                        });
                    }
                }
            }
            m = re.exec(response);
        }
    });

    // Processes "Play online" button 
    plugin.addURI(PREFIX + ":playOnline:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var response = showtime.httpReq(BASE_URL + url).toString();
        page.loading = false;
        var re = /playlist: \[[\S\s]*?url: '([^']+)/;
        url = re.exec(response) // Some clips autoplay
        if (!url) {
            re = /<div id="page-item-viewonline"[\S\s]*?<a href="([^"]+)/;
            page.loading = true;
            response = showtime.httpReq(BASE_URL + re.exec(response)[1]).toString();
            page.loading = false;
            re = /<a id="[\S\s]*?" href="([\S\s]*?)" title="([\S\s]*?)"/;
            response = re.exec(response);
            if (!response) {
                page.error("Линк на проигрывание отсутствует :(");
                return;
            }
            re = /playlist: \[[\S\s]*?url: '([^']+)/;
            page.loading = true;
            url = re.exec(showtime.httpReq(BASE_URL + response[1]));
            page.loading = false;
        }
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            sources: [{
                url: BASE_URL + url[1]
            }]
        });
    });

    // Play URL
    plugin.addURI(PREFIX + ":play:(.*)", function(page, url) {
        page.type = "video";
        page.loading = true;
        if (showtime.probe(BASE_URL + url).result == 0) {
            page.source = "videoparams:" + showtime.JSONEncode({
                title: sTitle[url],
                canonicalUrl: PREFIX + ":play:" + url,
                sources: [{
                    url: BASE_URL + url
                }]
            });
            page.loading = false;
            return;
        }
        var origURL = url;
        if (sURL[url]) url = sURL[url];
        page.loading = true;
        var response = showtime.httpReq(BASE_URL + url).toString();
        page.loading = false;
        var start = 0,
            end = 0;
        start = response.indexOf('<title>', start + 1);
        end = response.indexOf('</title>', start + 1);
        var re = /<title>([\S\s]+)/;
        var title = re.exec(response.substring(start, end))[1]; // problem lives here
        start = response.indexOf('class="b-view-material"', start + 1);
        end = response.indexOf('</div>', start + 1);
        re = /<a href="([^"]+)/;
        if (start > 0) {
            var link = re.exec(response.substring(start, end))[1];
        }
        if (!link) {
            re = /playlist: \[[\S\s]*?url: '([^']+)/;
            m = re.exec(response);
        } else {
            re = /playlist: \[[\S\s]*?url: '([^']+)/;
            page.loading = true;
            var m = re.exec(showtime.httpReq(BASE_URL + link));
            page.loading = false;
        }
        if (!m) { // first file from the first folder
            re = /class="filelist m-current"[\S\s]*?" href="([^"]+)/;
            page.loading = true;
            m = re.exec(showtime.httpReq(BASE_URL + url + '?ajax&blocked=0&folder=0'));
            page.loading = false;
        }
        if (m) {
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                canonicalUrl: PREFIX + ":play:" + origURL,
                sources: [{
                    url: BASE_URL + m[1]
                }]
            });
        } else page.error("Линк не проигрывается :(");
    });

    // Index page
    plugin.addURI(PREFIX + ":index:(.*):(.*):(.*):(.*)", function(page, url, title, populars, param) {
        setPageHeader(page, unescape(title));
        page.loading = true;
        var doc = showtime.httpReq(url + '?view=detailed'+param).toString();
        page.loading = false;
        if (populars) {
            var match = doc.match(/<div id="adsProxy-zone-section-glowadswide"><\/div>([\S\s]*?)<div class="b-clear">/);
            if (match) {
                showPopulars(page, match[1], 'Самое просматриваемое сейчас');
	        page.appendItem("", "separator", {
                    title: ''
                });
            }
        }

        response = doc.match(/<div class="b-section-list([\S\s]*?)<script type="text\/javascript">/)[1];
        indexer(page);

        var pos = 90;
        function loader() {
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq(url +'?scrollload=1&view=detailed&start='+pos+'&length=18'));
            page.loading = false;
            for (i in json.content) {
                response = showtime.entityDecode(json.content[i]);
                indexer(page);
            }
            pos+=90;
            return !json.is_last
        }
        loader();
        page.paginator = loader;
    });

    // Top 9
    function showPopulars(page, match, title) {
        page.appendItem("", "separator", {
            title: title
        });

        // 1-link, 2-logo, 3-title
        var re = /<div class="b-poster-[\S\s]*?<a href="([\S\s]*?)"[\S\s]*?url\('([\S\s]*?)'\)[\S\s]*?<span class=".-poster-[\S\s]*?title">([\S\s]*?)<\/span>/g;
        var m = re.exec(match);
        while (m) {
            page.appendItem(PREFIX + ":listRoot:" + m[1] + ":" + escape(trim(m[3])), "video", {
                title: new showtime.RichText(trim(m[3]).replace(/(<([^>]+)>)/ig, "")),
                icon: m[2].replace('/9/', '/2/')
            });
            m = re.exec(match);
        }
    }

    // shows last commented
    var comments;
    plugin.addURI(PREFIX + ":comments", function(page) {
        setPageHeader(page, 'Обcуждаемые материалы');
        //1-link, 2-title, 3-icon, 4-type, 5-year, 6-country, 7-genres list,
        //8-directors, 9-actors,
        //10-positive/negative, 11-rating, 12-text, 13-nick,
        //14-positive/negative, 15-rating, 16-text, 17-nick
        var re = /<a href="([\S\s]*?)"[\S\s]*?<span class="b-main__top-commentable-item-title-value">([\S\s]*?)<\/span>[\S\s]*?url\(([\S\s]*?)\);[\S\s]*?<span class="b-main__top-commentable-item-subsection">([\S\s]*?)<\/span>[\S\s]*?<span class="b-main__top-commentable-item-year-country">([\S\s]*?)<span class="b-main__new-item-attributes-delimiter"><\/span>([\S\s]*?)<\/span>[\S\s]*?<span class="b-main__top-commentable-item-genre">([\S\s]*?)<span class="b-main__top-commentable-item-director">([\S\s]*?)<\/span>[\S\s]*?<span class="b-main__top-commentable-item-cast">([\S\s]*?)<\/span>[\S\s]*?class="b-main__top-commentable-item-comment m-main__top-commentable-item-comment_bg_([\S\s]*?)">[\S\s]*?<span class="b-main__top-commentable-item-comment-content-rating">([\S\s]*?)<\/span>[\S\s]*?<span class="b-main__top-commentable-item-comment-content-text">([\S\s]*?)<\/span>[\S\s]*?<span class="b-main__top-commentable-item-comment-content-name m-main__top-commentable-item-comment-content-name_">([\S\s]*?)<\/span>[\S\s]*?class="b-main__top-commentable-item-comment m-main__top-commentable-item-comment_bg_([\S\s]*?)">[\S\s]*?<span class="b-main__top-commentable-item-comment-content-rating">([\S\s]*?)<\/span>[\S\s]*?<span class="b-main__top-commentable-item-comment-content-text">([\S\s]*?)<\/span>[\S\s]*?<span class="b-main__top-commentable-item-comment-content-name m-main__top-commentable-item-comment-content-name_">([\S\s]*?)<\/span>/g;
        var match = re.exec(comments);
        while (match) {
            page.appendItem(PREFIX + ":listRoot:" + match[1]+ ':' + escape(trim(match[2])), 'video', {
                title: trim(match[2]),
                icon: match[3].replace('/9/', '/2/'),
                year: +(trim(match[5].replace(/\D+/, '')).substr(0,4)),
                genre: new showtime.RichText(match[4] + ' ' + colorStr(trim(match[7].replace(/<[^>]*>/g, '')), orange)),
                description: new showtime.RichText(colorStr(trim(match[11]), match[10] == "negative" ? red : green) + ' '+
                    coloredStr(match[13], orange) + ': ' + match[12] + ' '+
                    '<br>' + colorStr(trim(match[15]), match[14] == "negative" ? red : green) + ' '+
                    coloredStr(match[17], orange) + ': ' + match[16])
            });
            match = re.exec(comments);
        }
    });

    var response;
    function indexer(page) {
        // 1-link, 2-icon, 3-title, 4-qualities(for films),
        // 5-votes+, 6-votes-, 7-year/country, 8-genre/actors, 9-description
        var re = /<a class="b-poster-detail__link" href="([\S\s]*?)">[\S\s]*?<img src="([\S\s]*?)" alt='([\S\s]*?)' width=([\S\s]*?)<span class="b-poster-detail__vote-positive">([\S\s]*?)<\/span>[\S\s]*?<span class="b-poster-detail__vote-negative">([\S\s]*?)<\/span>[\S\s]*?<span class="b-poster-detail__field">([\S\s]*?)<\/span>[\S\s]*?<span class="b-poster-detail__field">([\S\s]*?)<\/span>[\S\s]*?<span class="b-poster-detail__description">([\S\s]*?)<\/span>/g;
        var match = re.exec(response);
        while (match) {
            // parsing quality list
            var quality = '';
            var re2 = /<span class="quality m-([\S\s]*?)">/m;
            var match2 = re2.exec(match[4]);
            if (match2)
                quality = match2[1].toUpperCase();
            var genre = '', actors = '';
            if (quality) {
                quality = coloredStr(quality, blue) + ' ';
                actors = coloredStr('Актеры: ', orange) + match[8] + ' ';
            } else {
                genre = match[8];
            }
            page.appendItem(PREFIX + ":listRoot:" + escape(match[1]) + ":" + escape(match[3].replace(/\\\'/g, "'").replace(/\\\"/g, '"')), "video", {
                title: new showtime.RichText(quality + match[3].replace(/\\\'/g, "'").replace(/\\\"/g, '"')),
                icon: match[2].replace('/6/', '/2/'),
                genre: genre,
                year: +match[7].substr(0,4),
                description: new showtime.RichText(actors + coloredStr("Производство: ", orange) + ' ' +
                    trim(match[7].split('●')[1]) + ' ' + (match[9] ? coloredStr("<br>Описание: ", orange) + trim(match[9]) : ''))
            });
            match = re.exec(response);
        }
    }

    function processScroller(page, url) {
        url = unescape(url);
        page.loading = true;
        var doc = showtime.httpReq(BASE_URL + url).toString();
        page.loading = false;
        var match = doc.match(/<div class="b-nowviewed">([\S\s]*?)<div class="b-clear">/);
        if (match)
            showPopulars(page, match[1], 'Самое просматриваемое сейчас');
        else { // try like series
            var match = doc.match(/<div id="adsProxy-zone-section-glowadswide">([\S\s]*?)<div class="b-clear">/);
            if (match)
                 showPopulars(page, match[1], 'Популярно сейчас');
        }

        response = doc.match(/<div class="b-section-list([\S\s]*?)<script type="text\/javascript">/);
        if (response) {
            page.appendItem("", "separator", {
                title: 'Популярные материалы'
            });
            response = response[1];
            indexer(page);

            var pos = 90;
            function loader() {
                page.loading = true;
                var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + url +'?scrollload=1&view=detailed&start='+pos+'&length=18'));
                page.loading = false;
                for (i in json.content) {
                    response = showtime.entityDecode(json.content[i]);
                    indexer(page);
                }
                pos += 90;
                return !json.is_last
            }
            loader();
            page.paginator = loader;
        }
    }

    // lists submenu
    plugin.addURI(PREFIX + ":submenu:(.*):(.*):(.*)", function(page, url, title, menu) {
        setPageHeader(page, unescape(title));
        menu = unescape(menu);
        //1-url, 2-title
        var re = /<a class="b-header__menu-subsections-item" href="([\S\s]*?)">[\S\s]*?<span class="b-header__menu-subsections-item-title m-header__menu-subsections-item-title_type_[\S\s]*?">([\S\s]*?)<\/span>/g;
        var match = re.exec(menu);
        while (match) {
            page.appendItem(PREFIX + ":index:" + BASE_URL + match[1] + ':' + trim(match[2]) + ':yes:', 'directory', {
                title: trim(match[2])
            });
            match = re.exec(menu);
        }
        processScroller(page, url);
    });

    plugin.addURI(PREFIX + ":start", function(page) {
        setPageHeader(page, slogan);
        page.loading = true;
        var doc = showtime.httpReq(BASE_URL).toString();
        page.loading = false;

        // Building menu
        //1-link, 2-title, 3-submenus
        var re = /<div class="b-header__menu-section[\S\s]*?<a href="([\S\s]*?)"[\S\s]*?">([\S\s]*?)<\/a>([\S\s]*?)<div class="b-clear">/g;
        var match = re.exec(doc);
        while (match) {
            page.appendItem(PREFIX + ":submenu:" + match[1]+ ':' + escape(trim(match[2])) + ':' + escape(match[3]), 'directory', {
                title: trim(match[2])
            });
            match = re.exec(doc);
        }

        // Scraping commentable
        comments = doc.match(/<div class="b-main__top-commentable-inner">([\S\s]*?)<div class="b-clear">/);
        if (comments) {
            comments = comments[1];
            page.appendItem(PREFIX + ':comments', "directory", {
                title: 'Обcуждаемые материалы'
            });
        }

        // Show most popular
        match = doc.match(/<div class="b-main__posters([\S\s]*?)<div class="b-clear">/);
        if (match)
            showPopulars(page, match[1], 'Самые популярные материалы');

        // Front page scraper
        page.appendItem("", "separator", {
            title: 'Новое на сайте'
        });
        doc = doc.match(/<div class="b-main__new-title">([\S\s]*?)<a class="b-endless-scroll/)[1];

        //1-link, 2-icon, 3-type, 4-title, 5-genre, 6-produced, 7-description,
        //8-author, 9-time
        var re = /<a href="([\S\s]*?)"[\S\s]*?url\('([\S\s]*?)'\);[\S\s]*?<span class="b-main__new-item-subsection">([\S\s]*?)<\/span>[\S\s]*?<span class="b-main__new-item-title m-main__new-item-title_theme_[\S\s]*?">([\S\s]*?)<\/span>[\S\s]*?<span>([\S\s]*?)<\/span>[\S\s]*?<\/span>([\S\s]*?)<\/span>([\S\s]*?)<span class="b-main__new-item-add-info-auth">([\S\s]*?)<\/span>[\S\s]*?<span class="b-main__new-item-add-info-time">([\S\s]*?)<\/span>/g;

        function scrape() {
            var match = re.exec(doc);
            while (match) {
                var description = trim(match[7].replace(/<[^>]*>/g, '').replace('.......',''))
                page.appendItem(PREFIX + ":listRoot:" + escape(match[1]) + ":" + escape(showtime.entityDecode(match[4])), "video", {
                    title: new showtime.RichText(match[4]),
                    icon: match[2].replace('/9/','/2/'),
                    genre: new showtime.RichText(match[3] + ' ' + (trim(match[5].replace(/<[^>]*>/g, '')) ? colorStr(trim(match[5]), orange) : '')),
                    description: new showtime.RichText((trim(match[6]) ? coloredStr('Произведено: ',orange) + trim(match[6]) + ' ' : '') +
                       coloredStr('Добавил: ',orange) + match[8] + ' ' + colorStr(match[9], blue) +
                       (description ? coloredStr(' Описание: ',orange) + description : ''))
                });
                match = re.exec(doc);
            }
        }
        scrape();

        var pos = 100;
        function loader() {
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq(BASE_URL+'/main?scrollload=1&start=100&length=20'));
            page.loading = false;
            for (i in json.content) {
                doc = showtime.entityDecode(json.content[i]);
                scrape();
            }
            pos += 100;
            return !json.is_last
        }
        loader();
        page.paginator = loader;
    });

    plugin.addSearcher("brb.to", logo, function(page, query) {
        page.entries = 0;
	var fromPage = 0, tryToSearch = true;

        //1-link, 2-title, 3-image, 4 - description, 5 - type, 6 - type in text, 7 - genre
        var re = /class="image-wrap">[\S\s]*?<a href="([\S\s]*?)" title="([\S\s]*?)"><img src="([\S\s]*?)"[\S\s]*?<p class="text">([\S\s]*?)<\/p>[\S\s]*?<span class="section ([^"]+)">([\S\s]*?)<\/span>([\S\s]*?)<\/td>/g;

        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var response = showtime.httpReq(BASE_URL + "/search.aspx?search=" + query.replace(/\s/g, '\+') + (fromPage ? "&page=" + fromPage : '')).toString();
            page.loading = false;
            var match = re.exec(response);
            while (match) {
                var genre = match[7].match(/<span class="genre"><span class="caption">Жанр:<\/span><span>([\S\s]*?)<\/span>/m);
                if (genre) genre = genre[1];
                var rate = match[7].match(/<span class="rate ([\S\s]*?)"[\S\s]*?">([\S\s]*?)<\/span>/m);
                if (rate)
                    (rate[1] == 'positive' ? rate = colorStr(rate[2], green)+' ' : rate = colorStr(rate[2], red)+' ');
                else rate = '';
                page.appendItem(PREFIX + ":listRoot:" + escape(match[1]) + ":" + escape(match[2]), "video", {
                    title: new showtime.RichText(match[2]),
                    icon: match[3].replace('/5/', '/2/'),
                    genre: new showtime.RichText(match[6] + ' ' + (genre ? colorStr(genre, orange) : '')),
                    description: new showtime.RichText(rate + coloredStr('Описание: ', orange) + match[4])
                });
                page.entries++;
                match = re.exec(response);
            };
            if (!response.match(/<b>Следующая страница<\/b>/)) return tryToSearch = false;
            fromPage++;
            return true;
        };
        loader();
        page.paginator = loader;
    });
})(this);