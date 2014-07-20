/**
 * yts.re plugin for Showtime
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
    var PREFIX = 'yts';
    var BASE_URL = 'https://yts.re/api/';
    var logo = plugin.path + "logo.png";
    var slogan = 'Welcome to the official YTS website. Here you will be able to browse and download movies in excellent DVD, 720p, 1080p and 3D quality, all at the smallest file size.';

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

    plugin.createService("yts.re", PREFIX + ":start", "video", true, logo);

    plugin.addURI(PREFIX + ":start", function(page) {
        setPageHeader(page, 'Genres');
        for(var i in genres) {
            var item = page.appendItem(PREFIX + ":genre:" + genres[i], "directory", {
               title: genres[i]
            });
        }
    });

    plugin.addURI(PREFIX + ":movie:(.*)", function(page, id) {
        page.loading = true;
        var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + 'movie.json?id=' + id));
        setPageHeader(page, json.MovieTitle);

        page.appendItem('torrent:video:' + json.TorrentUrl, "video", {
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
        var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + 'comments.json?movieid=' + id));
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

    function browseItems(page, query) {
        var offset = 1;
        page.entries = 0;

        function loader() {
            var c = showtime.JSONDecode(showtime.httpReq(BASE_URL + 'list.json', {
                args: [{
                    quality: '1080p',
                    limit: 40,
                    set: offset,
                    sort: 'seeds'
                }, query]
            }));

            for (var i in c.MovieList) {
                var mov = c.MovieList[i];
                var item = page.appendItem(PREFIX + ':movie:' + mov.MovieID, "video", {
                    title: mov.MovieTitleClean,
                    icon: mov.CoverImage
                });
                page.entries++;
                item.bindVideoMetadata({
                    imdb: mov.ImdbCode
                });
            }
            offset++;
            return c.MovieList && c.MovieList.length > 0;
        }

        page.loading = true;
        loader();
        page.loading = false;
        page.paginator = loader;
    }


    plugin.addURI(PREFIX + ":list:(.*)", function(page, query) {
        setPageHeader(page, 'Filter by: ' + unescape(query));
        browseItems(page, {
            keywords: query
        });
    });

    plugin.addURI(PREFIX + ":genre:(.*)", function(page, genre) {
        setPageHeader(page, genre);
        browseItems(page, {
            genre: genre
        });
    });

    plugin.addSearcher("yts.re", logo, function(page, query) {
        browseItems(page, {
            keywords: query
        });
    });
})(this);