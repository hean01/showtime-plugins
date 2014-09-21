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
    var slogan = getDescriptor().synopsis;
    var sn = 'serial_number=cc05f1545c376407';

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
        page.loading = false;
    }

    var service = plugin.createService(getDescriptor().id, PREFIX + ":start", "video", true, logo);

    // Shows items of the genre
    plugin.addURI(PREFIX + ":genre:(.*):(.*):(.*)", function(page, cat_id, genre_id, title) {
        setPageHeader(page, unescape(title));

        var from = 1, tryToSearch = true;
        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/items?' + sn + '&block_id=cat_' + cat_id + '_genre_'+ genre_id + '&start=' + from + '&limit=20'));
            page.loading = false;
            for (var j in json.items)
                appendItem(page, json.items[j], ':index:');

            if (json.hasMore == 0) return tryToSearch = false;
            from+=20;
            return true;
        };
        loader();
        page.loading = false;
        page.paginator = loader;
    });

    // Shows genres of the category
    plugin.addURI(PREFIX + ":category:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, unescape(title));
        page.loading = true;
        var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/getFilters?' + sn + '&cat_id=' + id));
        page.loading = false;
        if (json[0]) {
            for (var i=0; json[0][i]; i++) {
                page.appendItem(PREFIX + ':genre:' + id + ':' + json[0][i].equal + ':' + escape(json[0][i].name), 'directory', {
                    title: new showtime.RichText(json[0][i].name)
                });
            };
        } else { // Process as a category
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/category?' + sn + '&id=' + id));
            page.loading = false;
            for (i in json) {
               switch (json[i].block_type) {
                   case 'navigation':
                       break;
                   default:
                       page.appendItem("", "separator", {
                           title: unescape(json[i].block_title)
                       });
                       for (var j = 0; j < json[i].items_number; j++) {
                           if (!json[i].items[j]) continue;
                           appendItem(page, json[i].items[j], ':index:');
                       };
                       break;
               };
            };
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

    // Play oll_tv links
    plugin.addURI(PREFIX + ":play:(.*):(.*)", function(page, id, title) {
        page.loading = true;
        var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/media?id=' + id + '&' +sn));
        page.loading = false;
        //showtime.print(showtime.JSONEncode(json));
        if (!json.media_url) {
            showtime.message("Error: Video link is empty :(", true, false);
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
        setPageHeader(page, slogan);
        page.loading = true;
        var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/home?' + sn));
        for (i in json) {
           switch (json[i].block_type) {
               case 'navigation':
                   for (var j = 0; j < json[i].items_count; j++) {
                       page.appendItem(PREFIX + ':category:' + json[i].items[j].id + ':' + escape(json[i].items[j].title), 'directory', {
                           title: new showtime.RichText(unescape(json[i].items[j].title))
                       });
                   };
                   break;
               default:
                   page.appendItem("", "separator", {
                       title: unescape(json[i].block_title)
                   });
                   for (var j = 0; j < json[i].items_number; j++)
//showtime.print(showtime.JSONEncode(json[i].items[j]));
                       appendItem(page, json[i].items[j], ':index:');

                   break;
           };
        };
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":search:(.*)", function(page, query) {
        setPageHeader(page, unescape(query));
        search(page, unescape(query));
    });

    function appendItem(page, json, route, id, title) {
        page.appendItem(PREFIX + route + (id ? id : json.id) + ':' + escape(title ? title : json.title), 'video', {
            title: new showtime.RichText(getReason(json.subs_type) +
                (json.hd_quality == 1 ? coloredStr('HD ', blue) : '') + unescape((title ? title : json.title))),
            description: new showtime.RichText((!json.is_free && +json.cost ? coloredStr('Стоимость: ', orange) + json.cost + ' ' + json.cost_currency + ' ' : '') +
                coloredStr('Страна: ', orange) + unescape(json.country) +
                coloredStr('<br>Рейтинг: ', orange) + unescape(json.age_limit_name) +
                coloredStr('<br>Описание: ', orange) + unescape(json.descr)),
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
        search(page, query);
    });
})(this);