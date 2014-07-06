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

    function browseItems(page, query) {
        var offset = 1;
        page.entries = 0;

        function loader() {
            var c = showtime.JSONDecode(showtime.httpReq(BASE_URL + 'list.json', {
                args: [{
                    quality: '1080p',
                    limit: 40,
                    set: offset,
                    sort: 'rating'
                }, query]
            }));

            for(var i in c.MovieList) {
                var mov = c.MovieList[i];
                var item = page.appendItem("torrent:video:" + mov.TorrentUrl, "video", {
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
