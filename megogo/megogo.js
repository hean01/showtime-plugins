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
    var BASE_URL = 'http://megogo.net/p';
    var sign = '1e5774f77adb843c';
    var devType = '_samsungtv';

    var logo = plugin.path + "logo.png";

    function trim(s) {
        return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ");
    }

    function blueStr(str) {
        return '<font color="6699CC"> (' + str + ')</font>';
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

    function startPage(page) {
        setPageHeader(page, 'megogo.net - онлайн-кинотеатр с легальным контентом');

        page.appendItem("", "separator", {
            title: 'Категории:'
        });
        var json = showtime.JSONDecode(showtime.httpGet(BASE_URL + '/categories?&sign=' + showtime.md5digest(sign) + devType));
        for (i in json.category_list) {
            page.appendItem(PREFIX + ':genres:' + json.category_list[i].id + ':' + escape(json.category_list[i].title), 'directory', {
                title: new showtime.RichText(unescape(json.category_list[i].title) + blueStr(json.category_list[i].total_num)),
                icon: logo
            });
        };

        page.appendItem("", "separator", {
            title: 'Рекомендуемое:'
        });
        var json = showtime.JSONDecode(showtime.httpGet(BASE_URL + '/recommend?&sign=' + showtime.md5digest(sign) + devType));
        for (var i in json.video_list) {
            var type = "video";
            if (json.video_list[i].isSeries) type = "directory";
            page.appendItem(PREFIX + ':' + type + ':' + json.video_list[i].id + ':' + json.video_list[i].title, "video", {
                  title: showtime.entityDecode(unescape(json.video_list[i].title)) + (json.video_list[i].title_orig ? " / " + showtime.entityDecode(json.video_list[i].title_orig) : ""),
                  year: +parseInt(json.video_list[i].year),
                  genre: (json.video_list[i].genre_list[0] ? unescape(json.video_list[i].genre_list[0].title) : ''),
                  rating: json.video_list[i].rating_imdb * 10,
                  duration: +parseInt(json.video_list[i].duration),
                  description: new showtime.RichText(trim(showtime.entityDecode(unescape(json.video_list[i].description)))),
                  icon: 'http://megogo.net' + unescape(json.video_list[i].image.small)
            });
        };
    };

    // Shows genres of the category
    plugin.addURI(PREFIX + ":genres:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, unescape(title));
        var json = showtime.JSONDecode(showtime.httpGet(BASE_URL + '/genres?category=' + id + '&sign=' + showtime.md5digest('category=' + id + sign) + devType));
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
            var json = showtime.JSONDecode(showtime.httpGet(BASE_URL + '/videos?' + params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + sign) + devType));
            for (var i in json.video_list) {
                var type = "video";
                if (json.video_list[i].isSeries) type = "directory";
                page.appendItem(PREFIX + ':' + type + ':' + json.video_list[i].id + ':' + escape(json.video_list[i].title), "video", {
                    title: showtime.entityDecode(unescape(json.video_list[i].title)) + (json.video_list[i].title_orig ? " / " + showtime.entityDecode(json.video_list[i].title_orig) : ""),
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
        var request = BASE_URL + '/video?' + params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + 'megogosign123');
        var json = showtime.JSONDecode(showtime.httpGet(request));
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
        var resp = showtime.httpGet('http://www.google.com/search?q=imdb+' + encodeURIComponent(showtime.entityDecode(unescape(title))).toString()).toString();
        var re = /http:\/\/www.imdb.com\/title\/(tt\d+).*?<\/a>/;
        var imdbid = re.exec(resp);
        if (imdbid) imdbid = imdbid[1];
        else {
            re = /http:\/\/<b>imdb<\/b>.com\/title\/(tt\d+).*?\//;
            imdbid = re.exec(resp);
            if (imdbid) imdbid = imdbid[1];
        };
        return imdbid;
    };

    // Play megogo links
    plugin.addURI(PREFIX + ":video:(.*):(.*)", function(page, id, title) {
        var json = showtime.JSONDecode(showtime.httpGet(BASE_URL + '/info?video=' + id + '&sign=' + showtime.md5digest('video=' + id + sign) + devType));
        if (!json.src) {
            page.loading = false;
            showtime.message("Error: This video is not available in your region :(", true, false);
            return;
        }

	var counter = 0;
	var s1 = json.src.match(/(.*)\/a\/0\//);
	var s2 = json.src.match(/\/a\/0\/(.*)/);
        for (var i in json.audio_list) {
	    if (counter) setPageHeader(page, unescape(json.title));
            page.appendItem('hls:'+ s1[1] +"/a/" + json.audio_list[i].index + "/" + s2[1], "video", {
                title: unescape(json.title) + ' (' + showtime.entityDecode(unescape(json.audio_list[i].lang)) + (json.audio_list[i].lang_orig ? '/' + showtime.entityDecode(unescape(json.audio_list[i].lang_orig)) : '')+')'
            });
	    counter++;
        };
	if (counter) return;

        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(json.title),
            canonicalUrl: PREFIX + ":video:" + id + ":" + title,
            imdbid: getIMDBid(json.title),
            sources: [{
                url: json.src
            }]	    
        });
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":start", startPage);

    plugin.addSearcher("megogo.net", logo, function(page, query) {
	    page.entries = 0;
            var offset = 0, counter = 0;
            function loader() {
                var params = 'text=' + query + '&limit=20' + '&offset=' + offset;
                var request = BASE_URL + '/search?' + params + '&sign=' + showtime.md5digest(params.replace(/\&/g, '') + sign) + devType;
                var json = showtime.JSONDecode(showtime.httpGet(request));
                for (var i in json.video_list) {
                    var type = "video";
                    if (json.video_list[i].isSeries) type = "directory";
                    page.appendItem(PREFIX + ':' + type + ':' + json.video_list[i].id + ':' + json.video_list[i].title, "video", {
                        title: showtime.entityDecode(unescape(json.video_list[i].title)) + (json.video_list[i].title_orig ? " / " + showtime.entityDecode(json.video_list[i].title_orig) : ""),
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
