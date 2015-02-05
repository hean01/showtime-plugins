/**
 * yts.re plugin for Showtime Media Center
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
    var PREFIX = 'yts';
    var logo = plugin.path + "logo.png";

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
        page.loading = true;
    }

    var genres = [
        "Action", "Adventure", "Animation", "Biography", "Comedy", "Crime",
        "Documentary", "Drama", "Family", "Fantasy", "Film-Noir", "History",
        "Horror", "Music", "Musical", "Mystery", "Romance", "Sci-Fi", "Short",
        "Sport", "Thriller", "War", "Western"];

    var service = plugin.createService(plugin.getDescriptor().id, PREFIX + ":start", "video", true, logo);

    var settings = plugin.createSettings(plugin.getDescriptor().id, logo, plugin.getDescriptor().synopsis);

    settings.createBool('enableMetadata', 'Enable metadata fetching', false, function(v) {
        service.enableMetadata = v;
    });

    settings.createMultiOpt("protocol", "Protocol", [
        ['https', 'https', true],
        ['http', 'http']
        ], function(v) {
            service.proto = v;
    });

    settings.createMultiOpt('baseurl', "Base URL", [
        ['://yts.re/api/', 'yts.re', true],
        ['://yify.unlocktorrent.com/api/', 'yify.unlocktorrent.com'],
        ['://yts.im/api/', 'yts.im'],
        ['://yts.wf/api/', 'yts.wf'],
        ['://yify.link/api/', 'yify.link']
        ], function(v) {
            service.baseurl = v;
    });

    settings.createMultiOpt('filter', "Filter quality by", [
        ['ALL', 'All', true],
        ['1080p', '1080p'],
        ['720p', '720p'],
        ['3D', '3D']
        ], function(v) {
            service.quality = v;
    });

    settings.createMultiOpt('sorting', "Sort results by", [
        ['date_added', 'Date', true],
        ['seeds', 'Seeds'],
        ['peers', 'Peers'],
        ['like_count', 'Like Count'],
        ['title', 'Title'],
        ['rating', 'Rating'],
        ['downloaded_count', 'Downloaded Count'],
        ['year', 'Year']
        ], function(v) {
            service.sorting = v;
    });

    settings.createMultiOpt('order', "Order by", [
        ['desc', 'Descending', true],
        ['asc', 'Ascending']
        ], function(v) {
            service.order = v;
    });

    function concat(what) {
        var s = 0;
        for (var i in what)
            (s ? s+= ', ' + what[i] : s = what[i]);
        return s;
    }

    function concatEntity(entity, field) {
        var s = 0;
        for (var i in entity)
            (s ? s+= ', ' + entity[i][field] : s = entity[i][field]);
        return s;
    }

    function browseItems(page, query, count) {
        var offset = 1;
        page.entries = 0;

        function loader() {
            if (!offset) return false;
            page.loading = true;
            var c = showtime.JSONDecode(showtime.httpReq(service.proto + service.baseurl + 'v2/list_movies.json', {
                args: [{
                    limit: 40,
                    page: offset,
                    quality: service.quality,
                    sort_by: service.sorting,
                    order_by: service.order
                }, query]
            }));
            page.loading = false;
            if (offset == 1 && page.metadata)
               page.metadata.title += ' (' + c.data.movie_count + ')';

            for (var i in c.data.movies) {
                addMovieItem(page, c.data.movies[i]);
                if (count && page.entries > count) return offset = false;
            }
            offset++;
            return c.data.movies && c.data.movies.length > 0;
        }
        loader();
        page.paginator = loader;
        page.loading = false;
    }

    plugin.addURI(PREFIX + ":genre:(.*)", function(page, genre) {
        setPageHeader(page, genre);
        browseItems(page, {
            genre: genre
        });
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":genres", function(page, genre) {
        setPageHeader(page, 'Genres');
        for(var i in genres) {
            var item = page.appendItem(PREFIX + ":genre:" + genres[i], "directory", {
               title: genres[i]
            });
        }
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":newest", function(page) {
        setPageHeader(page, 'Newest');
        browseItems(page, {
            sort: 'peers'
        });
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":start", function(page) {
        setPageHeader(page, plugin.getDescriptor().synopsis);
        page.appendItem(PREFIX + ":genres", "directory", {
            title: 'Genres'
        });

        page.appendItem("", "separator", {
            title: 'Newest'
        });
        browseItems(page, {
            sort: 'date'
        }, 7);
        page.appendItem(PREFIX + ':newest', 'directory', {
            title: 'More ►'
        });

        page.appendItem("", "separator", {
            title: 'The most popular'
        });
        browseItems(page, {
            sort: 'peers'
        });
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":list:(.*)", function(page, query) {
        setPageHeader(page, 'Filter by: ' + unescape(query));
        browseItems(page, {
            keywords: query
        });
        page.loading = false;
    });

    // Search IMDB ID by title
    function getIMDBid(title) {
        var resp = showtime.httpReq('http://www.imdb.com/find?ref_=nv_sr_fn&q=' + encodeURIComponent(showtime.entityDecode(unescape(title))).toString()).toString();
        var imdbid = resp.match(/<a href="\/title\/(tt\d+)\//);
        if (imdbid) return imdbid[1];
        return imdbid;
    };

    function addMovieItem(page, mov) {
        var item = page.appendItem(PREFIX + ':movie:' + mov.id, "video", {
            title: new showtime.RichText(mov.title + ' ' + coloredStr(concatEntity(mov.torrents, 'quality'), orange)),
            icon: mov.medium_cover_image,
            year: +mov.year,
            rating: mov.rating * 10,
            duration: mov.runtime,
            genre: concat(mov.genres),
            description: new showtime.RichText(coloredStr('Seeds: ', orange) + coloredStr(concatEntity(mov.torrents, 'seeds'), green) +
                coloredStr('\nPeers: ', orange) + coloredStr(concatEntity(mov.torrents, 'peers'), red) + ' ' +
                coloredStr('\nUploaded: ', orange) + concatEntity(mov.torrents, 'date_uploaded') +
                coloredStr('\nSize: ', orange) + concatEntity(mov.torrents, 'size') +
                coloredStr('\nMPA rating: ', orange) + mov.mpa_rating +
                coloredStr('\nLanguage: ', orange) + mov.language +
                coloredStr('\nState: ', orange) + mov.state
            )
        });
        page.entries++;
        if (service.enableMetadata) {
            item.bindVideoMetadata({
                imdb: mov.imdb_code
            });
        }
    }

    plugin.addURI(PREFIX + ":movie:(.*)", function(page, id) {
        page.loading = true;
        var json = showtime.JSONDecode(showtime.httpReq(service.proto + service.baseurl + 'v2/movie_details.json?movie_id=' + id + '&with_images=true&with_cast=true'));
        setPageHeader(page, json.data.title);
        page.metadata.background = json.data.images.background_image;
        page.metadata.backgroundAlpha = 0.3;
        for (var i in json.data.torrents) {
            var link = json.data.torrents[i].url.match(/(\/torrent\/download(.*))/);
            if (link)
                link = service.proto + service.baseurl.replace('/api/', '') + link[1];
            else
                link = json.data.torrents[i].url;

            var vparams = "videoparams:" + showtime.JSONEncode({
                title: json.data.title,
                canonicalUrl: PREFIX + ':movie:' + id + ':' + json.data.torrents[i].quality,
                imdbid: json.data.imdb_code, //getIMDBid(json.MovieTitle),
                no_fs_scan: true,
                sources: [{
                    url: 'torrent:video:' + link
                }]
	    });

            page.appendItem(vparams, "video", {
                 title: new showtime.RichText(coloredStr(json.data.torrents[i].quality, orange) + ' ' + json.data.title),
                 year: +json.data.year,
                 duration: json.data.runtime * 60,
                 rating: +json.data.rating * 10,
                 icon: json.data.images.medium_cover_image,
                 genre: concat(json.data.genres),
                 description: new showtime.RichText(coloredStr('Seeds: ', orange) + coloredStr(json.data.torrents[i].seeds, green) +
                   coloredStr(' Peers: ', orange) + coloredStr(json.data.torrents[i].peers, red) + ' ' +
                   coloredStr('Like Count: ', orange) + json.data.like_count +
                   coloredStr('\nLanguage: ', orange) + json.data.language +
                   coloredStr(' MPA rating: ', orange) + json.data.mpa_rating +
                   coloredStr('\nDate Uploaded: ', orange) + json.data.torrents[i].date_uploaded +
                   coloredStr(' Download Count: ', orange) + json.data.download_count +
                   coloredStr('\nResolution: ', orange) + json.data.torrents[i].resolution + 'x' + json.data.torrents[i].framerate + 'fps' +
                   coloredStr(' Size: ', orange) + json.data.torrents[i].size +
                   coloredStr('<br>Description: ', orange) + json.data.description_full)
            });
        }
        page.appendItem('youtube:video:'+escape(json.data.yt_trailer_code), "video", {
            title: 'Trailer'
        });
        page.appendItem(json.data.images.large_cover_image, "image", {
            title: 'Cover'
        });
        page.appendItem(json.data.images.large_screenshot_image1, "image", {
            title: 'Screenshot1'
        });
        page.appendItem(json.data.images.large_screenshot_image2, "image", {
            title: 'Screenshot2'
        });
        page.appendItem(json.data.images.large_screenshot_image3, "image", {
            title: 'Screenshot3'
        });

        page.appendItem("", "separator", {
	    title: 'Actors:'
	});
        for (var i in json.data.actors) {
            page.appendItem(PREFIX + ':list:' + escape(json.data.actors[i].name), "video", {
                title: json.data.actors[i].name + ' as ' + json.data.actors[i].character_name,
                icon: json.data.actors[i].medium_image
            });
        }

        page.appendItem("", "separator", {
	    title: 'Directors:'
	});
        for (var i in json.data.directors) {
            page.appendItem(PREFIX + ':list:' + escape(json.data.directors[i].name), "video", {
                title: json.data.directors[i].name,
                icon: json.data.directors[i].medium_image
            });
        }

        // Suggestions
        json = showtime.JSONDecode(showtime.httpReq(service.proto + service.baseurl + 'v2/movie_suggestions.json?movie_id=' + id));
        var first = true;
        for (var i in json.data.movie_suggestions) {
            if (first) {
                page.appendItem("", "separator", {
	            title: 'Suggestions:'
           	});
                first = false;
            };
            addMovieItem(page, json.data.movie_suggestions[i]);
        }

        // Comments
        json = showtime.JSONDecode(showtime.httpReq(service.proto + service.baseurl + 'v2/movie_comments.json?movie_id=' + id));
        first = true;
        for (var i in json.data.comments) {
            if (first) {
                page.appendItem("", "separator", {
	            title: 'Comments:'
           	});
                first = false;
            };
            page.appendPassiveItem('video', '', {
                title: new showtime.RichText(coloredStr(json.data.comments[i].username, orange) + ' (' + json.data.comments[i].date_added + ')'),
                icon: json.data.comments[i].medium_user_avatar_image,
                description: new showtime.RichText(json.data.comments[i].comment_text +
                   coloredStr('\nLike Count: ', orange) + json.data.comments[i].like_count)
            });
        }
        page.loading = false;
    });

    plugin.addSearcher(plugin.getDescriptor().id, logo, function(page, query) {
        browseItems(page, {
            query_term: query
        });
    });
})(this);