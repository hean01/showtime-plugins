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
    var slogan = 'oll.tv — все видео здесь. Смотри с комфортом и в хорошем качестве.';
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

    var service = plugin.createService("oll.tv", PREFIX + ":start", "video", true, logo);

    // Shows items of the genre
    plugin.addURI(PREFIX + ":genre:(.*):(.*):(.*)", function(page, cat_id, genre_id, title) {
        setPageHeader(page, unescape(title));

        var from = 1, tryToSearch = true;
        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/items?' + sn + '&block_id=cat_' + cat_id + '_genre_'+ genre_id + '&start=' + from + '&limit=20'));
            page.loading = false;
            for (var j in json.items) {
                page.appendItem(PREFIX + ':index:' + json.items[j].id + ':' + escape(json.items[j].title), 'video', {
                    title: new showtime.RichText((json.items[j].hd_quality == 1 ? coloredStr('HD ', blue) : '') + unescape(json.items[j].title)),
                    description: new showtime.RichText(coloredStr('Страна: ', orange) + unescape(json.items[j].country) +
                        coloredStr('<br>Описание: ', orange) + unescape(json.items[j].descr)),
                    year: +unescape(json.items[j].release_date),
                    duration: json.items[j].duration != null ? +unescape(json.items[j].duration) * 60 : '',
                    icon: unescape(json.items[j].src),
                    genre: unescape(json.items[j].genre),
                    rating: unescape(json.items[j].rating)*10
                });
                page.entries++;
            };
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
        for (var i=0; json[0][i]; i++) {
            page.appendItem(PREFIX + ':genre:' + id + ':' + json[0][i].equal + ':' + escape(json[0][i].name), 'directory', {
                title: new showtime.RichText(json[0][i].name)
            });
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
        for (var i in json.series) {
            page.appendItem(PREFIX + ':play:' + json.series[i].series_id + ':' + json.series[i].series_title, 'video', {
                title: new showtime.RichText(unescape(json.series[i].series_title)),
                description: new showtime.RichText(coloredStr('Страна: ', orange) + unescape(json.country) +
                    coloredStr('<br>Описание: ', orange) + unescape(json.descr)),
                year: +unescape(json.release_date),
                duration: json.series[i].duration != null ? +unescape(json.series[i].duration) * 60 : '',
                icon: unescape(json.src),
                genre: unescape(json.genre),
                rating: unescape(json.rating)*10
            });
        }
        page.loading = false;
    });

    // Index media by id
    plugin.addURI(PREFIX + ":index:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, unescape(title));
        page.loading = true;
        var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/info?' + sn + '&id=' + id + '&showfull=true'));
        if (json.seasons) {
              for (var i in json.seasons) {
                   page.appendItem(PREFIX + ':indexSeason:' + json.seasons[i].season_id + ':' + json.seasons[i].season_title, 'video', {
                       title: new showtime.RichText(unescape(json.seasons[i].season_title)),
                       description: new showtime.RichText(coloredStr('Страна: ', orange) + unescape(json.country) +
                       coloredStr('<br>Описание: ', orange) + unescape(json.descr)),
                       year: +unescape(json.release_date),
                       duration: json.duration != null ? +unescape(json.duration) * 60 : '',
                       icon: unescape(json.src),
                       genre: unescape(json.genre),
                       rating: unescape(json.rating)*10
                   });
              }
        } else if (json.series) {
              for (var j in json.series) {
                  page.appendItem(PREFIX + ':play:' + json.series[j].series_id + ':' + json.series[j].series_title, 'video', {
                      title: new showtime.RichText(unescape(json.series[j].series_title)),
                      description: new showtime.RichText(coloredStr('Страна: ', orange) + unescape(json.country) +
                      coloredStr('<br>Описание: ', orange) + unescape(json.descr)),
                      year: +unescape(json.release_date),
                      duration: json.series[j].duration != null ? +unescape(json.series[j].duration) * 60 : '',
                      icon: unescape(json.src),
                      genre: unescape(json.genre),
                      rating: unescape(json.rating)*10
                  });
              }
        } else {
             page.appendItem(PREFIX + ':play:' + json.id + ':' + json.title, 'video', {
                 title: new showtime.RichText((json.hd_quality == 1 ? coloredStr('HD ', blue) : '') + unescape(json.title)),
                 description: new showtime.RichText(coloredStr('Страна: ', orange) + unescape(json.country) +
                     coloredStr('<br>Описание: ', orange) + unescape(json.descr)),
                 year: +unescape(json.release_date),
                 duration: json.duration != null ? +unescape(json.duration) * 60 : '',
                 icon: unescape(json.src),
                 genre: unescape(json.genre),
                 rating: unescape(json.rating)*10
             });
        }

        //if (json.actors) showtime.print(json.actors);
        //if (json.director) showtime.print(json.director);
        //if (json.authors) showtime.print(json.authors);

        var first = 1;
        for (var i in json.similar) {
            if (first) {
                page.appendItem("", "separator", {
                    title: 'Похожие:'
                });
                first = 0;
            }
            page.appendItem(PREFIX + ':index:' + json.similar[i].id + ':' + json.similar[i].title, 'video', {
                title: new showtime.RichText((json.similar[i].hd_quality == 1 ? coloredStr('HD ', blue) : '') + unescape(json.similar[i].title)),
                description: new showtime.RichText(coloredStr('Страна: ', orange) + unescape(json.similar[i].country) +
                    coloredStr('<br>Описание: ', orange) + unescape(json.similar[i].descr)),
                year: +unescape(json.similar[i].release_date),
                duration: json.similar[i].duration != null ? +unescape(json.similar[i].duration) * 60 : '',
                icon: unescape(json.similar[i].src),
                genre: unescape(json.similar[i].genre),
                rating: unescape(json.similar[i].rating)*10
            });
        }
        page.loading = false;
    });

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
                   for (var j = 0; j < json[i].items_number; j++) {
                       //if (json[i].items[j].cost) continue;
                       page.appendItem(PREFIX + ':index:' + json[i].items[j].id + ':' + escape(json[i].items[j].title), 'video', {
                           title: new showtime.RichText((json[i].items[j].hd_quality == 1 ? coloredStr('HD ', blue) : '') + unescape(json[i].items[j].title)),
                           description: new showtime.RichText(coloredStr('Страна: ', orange) + unescape(json[i].items[j].country) +
                               coloredStr('<br>Описание: ', orange) + unescape(json[i].items[j].descr)),
                           year: +unescape(json[i].items[j].release_date),
                           duration: json[i].items[j].duration != null ? +unescape(json[i].items[j].duration) * 60 : '',
                           icon: unescape(json[i].items[j].src),
                           genre: unescape(json[i].items[j].genre),
                           rating: unescape(json[i].items[j].rating)*10
                       });
                   };
                   break;
           };
        };
        page.loading = false;
    });

    plugin.addSearcher("oll.tv", logo, function(page, query) {
        page.entries = 0;
        var fromPage = 1, tryToSearch = true;

        function loader() {
            if (!tryToSearch) return false;
            if (fromPage == 1)
                var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/search?' + sn + '&q=' + query.replace(/\s/g, '+')));
            else
                var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/search?' + sn + '&q=' + query.replace(/\s/g, '+') + '&page=' + fromPage));
            for (var j = 0; j < json.items_number; j++) {
                page.appendItem(PREFIX + ':index:' + json.items[j].id + ':' + escape(json.items[j].title), 'video', {
                    title: new showtime.RichText((json.items[j].hd_quality == 1 ? coloredStr('HD ', blue) : '') + unescape(json.items[j].title)),
                    description: new showtime.RichText(coloredStr('Страна: ', orange) + unescape(json.items[j].country) +
                        coloredStr('<br>Описание: ', orange) + unescape(json.items[j].descr)),
                    year: +unescape(json.items[j].release_date),
                    duration: json.items[j].duration != null ? +unescape(json.items[j].duration) * 60 : '',
                    icon: unescape(json.items[j].src),
                    genre: unescape(json.items[j].genre),
                    rating: unescape(json.items[j].rating)*10
                });
                page.entries++;
            };
            if (json.hasMore == 0) return tryToSearch = false;
            fromPage++;
            return true;
        };
        loader();
        page.loading = false;
        page.paginator = loader;
    });
})(this);