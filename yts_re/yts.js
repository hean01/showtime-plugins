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
        page.loading = false;
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
        ['seeds', 'Seeds', true],
        ['peers', 'Peers'],
        ['date', 'Date'],
        ['size', 'Size'],
        ['alphabet', 'Alphabet'],
        ['rating', 'Rating'],
        ['downloaded', 'Downloaded'],
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

    function browseItems(page, query, count) {
        var offset = 1;
        page.entries = 0;

        function loader() {
            if (!offset) return false;
            var c = showtime.JSONDecode(showtime.httpReq(service.proto + service.baseurl + 'list.json', {
                args: [{
                    quality: service.quality,
                    limit: 40,
                    set: offset,
                    order: service.order
                }, query]
            }));

            if (offset == 1 && page.metadata)
               page.metadata.title += ' (' + c.MovieCount + ')';

            for (var i in c.MovieList) {
                var mov = c.MovieList[i];
                var item = page.appendItem(PREFIX + ':movie:' + mov.MovieID, "video", {
                    title: new showtime.RichText(mov.MovieTitleClean + ' ' + coloredStr(mov.Quality, orange)),
                    icon: mov.CoverImage,
                    year: +mov.MovieYear,
                    rating: mov.MovieRating * 10,
                    genre: mov.Genre,
                    description: new showtime.RichText(coloredStr('Seeds: ', orange) + coloredStr(mov.TorrentSeeds, green) + coloredStr(' Peers: ', orange) + coloredStr(mov.TorrentPeers, red) + ' ' +
                        coloredStr('Uploaded: ', orange) + mov.DateUploaded +
                        coloredStr(' By: ', orange) + mov.Uploader +
                        coloredStr('\nAge rating: ', orange) + mov.AgeRating +
                        coloredStr(' Downloaded: ', orange) + mov.Downloaded +
                        coloredStr(' Size: ', orange) + mov.Size
                    )

                });
                page.entries++;
                if (count && page.entries > count) return offset = false;

                if (service.enableMetadata) {
                   item.bindVideoMetadata({
                       imdb: mov.ImdbCode
                   });
                }
            }
            offset++;
            return c.MovieList && c.MovieList.length > 0;
        }
        page.loading = true;
        loader();
        page.loading = false;
        page.paginator = loader;
    }

    plugin.addURI(PREFIX + ":genre:(.*)", function(page, genre) {
        setPageHeader(page, genre);
        browseItems(page, {
            genre: genre
        });
    });

    plugin.addURI(PREFIX + ":genres", function(page, genre) {
        setPageHeader(page, 'Genres');
        for(var i in genres) {
            var item = page.appendItem(PREFIX + ":genre:" + genres[i], "directory", {
               title: genres[i]
            });
        }
    });

    plugin.addURI(PREFIX + ":newest", function(page) {
        setPageHeader(page, 'Newest');
        browseItems(page, {
            sort: 'peers'
        });
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
    });

    plugin.addURI(PREFIX + ":list:(.*)", function(page, query) {
        setPageHeader(page, 'Filter by: ' + unescape(query));
        browseItems(page, {
            keywords: query
        });
    });

    // Search IMDB ID by title
    function getIMDBid(title) {
        var resp = showtime.httpReq('http://www.imdb.com/find?ref_=nv_sr_fn&q=' + encodeURIComponent(showtime.entityDecode(unescape(title))).toString()).toString();
        var imdbid = resp.match(/<a href="\/title\/(tt\d+)\//);
        if (imdbid) return imdbid[1];
        return imdbid;
    };

    plugin.addURI(PREFIX + ":movie:(.*)", function(page, id) {
        page.loading = true;
        var json = showtime.JSONDecode(showtime.httpReq(service.proto + service.baseurl + 'movie.json?id=' + id));
        setPageHeader(page, json.MovieTitle);
        var link = json.TorrentUrl.match(/(download(.*))/);
        if (link)
            link = service.proto + service.baseurl.replace('/api', '') + link[1];
        else
            link = json.TorrentUrl;

        var vparams = "videoparams:" + showtime.JSONEncode({
	    title: json.MovieTitle,
	    canonicalUrl: PREFIX + ":movie:" + id,
	    imdbid: getIMDBid(json.MovieTitle),
	    no_fs_scan: true,
	    sources: [{
	        url: 'torrent:video:' + link
	    }]
	});

        page.appendItem(vparams, "video", {
               title: new showtime.RichText(json.MovieTitleClean + colorStr(json.Size, blue)),
               year: +json.MovieYear,
               duration: json.MovieRuntime * 60,
               rating: +json.MovieRating * 10,
               icon: json.LargeCover,
               genre: json.Genre1 + ', ' + json.Genre2,
               description: new showtime.RichText(coloredStr('Seeds: ', orange) + coloredStr(json.TorrentSeeds, green) + coloredStr(' Peers: ', orange) + coloredStr(json.TorrentPeers, red) + ' ' +
                   coloredStr('Uploaded: ', orange) + json.DateUploaded +
                   coloredStr(' By: ', orange) + json.Uploader +
                   (json.UploaderNotes ? coloredStr(' Notes: ', orange) + json.UploaderNotes : '') +
                   coloredStr('<br>Language: ', orange) + json.Language + coloredStr(' Subtitles: ', orange) + json.Subtitles +
                   coloredStr('<br>Age rating: ', orange) + json.AgeRating +
                   coloredStr(' Downloaded: ', orange) + json.Downloaded +
                   coloredStr(' Resolution: ', orange) + json.Resolution + 'x' + json.FrameRate + 'fps' +
                   coloredStr(' Size: ', orange) + json.Size +
                   coloredStr('<br>Description: ', orange) + json.LongDescription)
        });
        page.appendItem('youtube:video:'+escape(json.YoutubeTrailerUrl), "video", {
            title: 'Trailer'
        });
        page.appendItem(json.LargeCover, "image", {
            title: 'Cover'
        });
        page.appendItem(json.LargeScreenshot1, "image", {
            title: 'Screenshot1'
        });
        page.appendItem(json.LargeScreenshot2, "image", {
            title: 'Screenshot2'
        });
        page.appendItem(json.LargeScreenshot3, "image", {
            title: 'Screenshot3'
        });

        page.appendItem("", "separator", {
	    title: 'Actors:'
	});
        for (var i in json.CastList) {
            page.appendItem(PREFIX + ':list:' + escape(json.CastList[i].ActorName), "directory", {
                title: json.CastList[i].ActorName + ' as ' + json.CastList[i].CharacterName
            });
        }

        page.appendItem("", "separator", {
	    title: 'Directors:'
	});
        for (var i in json.DirectorList) {
            page.appendItem(PREFIX + ':list:' + escape(json.DirectorList[i].DirectorName), "directory", {
                title: json.DirectorList[i].DirectorName
            });
        }

        page.loading = true;
        var json = showtime.JSONDecode(showtime.httpReq(service.proto + service.baseurl + 'comments.json?movieid=' + id));
        page.loading = false;

        var first = true;
        for (var i in json) {
            if (first) {
                page.appendItem("", "separator", {
	            title: 'Comments:'
           	});
                first = false;
            };
            page.appendPassiveItem('video', '', {
                title: new showtime.RichText(coloredStr(json[i].UserName, orange) + ' (' + json[i].DateAdded + ')'),
                icon: json[i].UserAvatar,
                description: new showtime.RichText(json[i].CommentText)
            });
        }
    });

    plugin.addSearcher(plugin.getDescriptor().id, logo, function(page, query) {
        browseItems(page, {
            keywords: query
        });
    });
})(this);