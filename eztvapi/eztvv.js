/**
 * eztvapi.re plugin for Movian Media Center
 *
 *  Copyright (C) 2015 Gekko, lprot
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
    var logo = plugin.path + "logo.png";

    var blue = '6699CC', orange = 'FFA500';

    function colorStr(str, color) {
        return '<font color="' + color + '"> (' + str + ')</font>';
    }

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    function setPageHeader(page, title) {
        page.loading = true;
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
    }

    var service = plugin.createService(plugin.getDescriptor().id, plugin.getDescriptor().id + ":start", "video", true, logo);

    var settings = plugin.createSettings(plugin.getDescriptor().id, logo, plugin.getDescriptor().synopsis);

    settings.createBool('forceSD', 'Force SD quality while playing', false, function(v) {
        service.forceSD = v;
    });

    settings.createBool('enableMetadata', 'Enable metadata fetching', false, function(v) {
        service.enableMetadata = v;
    });
	
    settings.createMultiOpt("protocol", "Protocol", [
        ['http', 'http', true],
        ['https', 'https']
        ], function(v) {
            service.proto = v;
    });

    settings.createMultiOpt('baseurl', "Base URL", [
        ['://eztvapi.re/', 'eztvapi.re', true],
        ['://br.api.ptn.pm/', 'eztvapi.pm']
        ], function(v) {
            service.baseurl = v;
    });
	
    settings.createMultiOpt('sortby', "Sort by", [
        ['', 'default (popularity)', true],
        ['?sort=name', 'Name'],
	['?sort=year', 'Date'],
	['?sort=updated', 'Updated']
        ], function(v) {
            service.sortby = v;
    });
	
    function browseItems(page, query) {
        var offset = 1;
        page.entries = 0;

        function loader() {
            if (!offset) return false;
            page.loading = true;
            var url = service.proto + service.baseurl + 'shows/' + offset + service.sortby;
            if (query) {
                if (url.match(/\?/)) url += '&keywords=' + query;
                else url += '?keywords=' + query;
            }
            var doc = showtime.httpReq(url).toString();
            page.loading = false;
            if (doc[0] != '[') return offset = false;
            var json = showtime.JSONDecode(doc);
            if (offset == 1 && page.metadata)
               page.metadata.title

            for (var i in json)
                addShowItem(page, json[i]);
            offset++;
            return true;
        }
        loader();
        page.paginator = loader;
        page.loading = false;
    }
	
    plugin.addURI(plugin.getDescriptor().id + ":start", function(page) {
        setPageHeader(page, plugin.getDescriptor().synopsis);
        browseItems(page);
        page.loading = false;
    });

    function addShowItem(page, mov) {
        var item = page.appendItem(plugin.getDescriptor().id + ':showlist:' + mov._id, "video", {
            title: new showtime.RichText(mov.title),
            icon: mov.images.poster,
            year: +mov.year,
            description: new showtime.RichText(coloredStr('\nLast updated: ', orange) + new Date(mov.last_updated) +
                coloredStr('\nNumber of seasons: ', orange) + mov.num_seasons +
                coloredStr('\nIMDb ID: ', orange) + mov.imdb_id +
                coloredStr(' TVDb ID: ', orange) + mov.tvdb_id
	    )
        });
        page.entries++;
        if (service.enableMetadata) {
            item.bindVideoMetadata({
                imdb: mov.imdb_id
            });
        }
    }
	
    function sortData(data) {
        var sorted = [];
        Object.keys(data).sort(function(a,b) {
            return ((data[a].season < data[b].season) ||
                (data[a].season == data[b].season && data[a].episode < data[b].episode)) ? -1 : 1
        }).forEach(function(key) {
            sorted.push(data[key]);
        });
        return sorted;
    }

    plugin.addURI(plugin.getDescriptor().id + ":showlist:(.*)", function browseshowItems(page, showid) {
        page.entries = 0;
        page.loading = true;
        var cde = showtime.JSONDecode(showtime.httpReq(service.proto + service.baseurl + 'show/' + showid));
        setPageHeader(page, cde.title);
        page.metadata.background = cde.images.fanart;
        page.metadata.backgroundAlpha = 0.3;
        var episodes = sortData(cde.episodes);
        for (var i in episodes) {
            var stapje = episodes[i];
            var hd = false;
            var url = stapje.torrents["0"].url;;
            if (!service.forceSD)
                if (stapje.torrents["720p"]) {
                    url = stapje.torrents["720p"].url
                    hd = true;
                } else if (stapje.torrents["480p"])
                    url = stapje.torrents["480p"].url

            var genres = null;
            cde.genres.forEach(function(genre) {
                if (genres)
                     genres += ', ' + genre
                else
                    genres = genre;
            });

            var link = "videoparams:" + showtime.JSONEncode({
                title: episodes[i].title,
                canonicalUrl: plugin.getDescriptor().id + ':showlist:' + showid,
                sources: [{
                    url: 'torrent:video:' + url
                }],
                imdbid: cde.imdb_id,
                season: episodes[i].season,
                episode: episodes[i].episode,
                no_fs_scan: true

            });

            page.appendItem(link, "video", {
                title: new showtime.RichText(coloredStr('S' + episodes[i].season + 'E' + episodes[i].episode, blue) + ' ' + (hd ? coloredStr('HD', orange) + ' ' : '') + episodes[i].title),
	        icon: cde.images.poster,
                year: +cde.year,
                duration: cde.runtime * 60,
                rating: cde.rating.percentage,
                season: episodes[i].season,
                genre: genres,
                episode: episodes[i].episode,
                description: new showtime.RichText(coloredStr('\nSeason: ', orange) + episodes[i].season +
	            coloredStr(' Episode: ', orange) + episodes[i].episode +
                    coloredStr(' Number of seasons: ', orange) + cde.num_seasons +
                    coloredStr('\nFirst aired: ', orange) + new Date(episodes[i].first_aired * 1000).toString().substr(0, 10) +
                    coloredStr(' Last updated: ', orange) + new Date(cde.last_updated) +
                    coloredStr('\nStatus: ', orange) + cde.status +
	            coloredStr('\nCountry: ', orange) + cde.country +
                    coloredStr(' Network: ', orange) + cde.network +
                    coloredStr(' Air day: ', orange) + cde.air_day +
                    coloredStr(' Air time: ', orange) + cde.air_time +
                    coloredStr('\n\nSynopsis: ', orange) + cde.synopsis + ' ' +
                    coloredStr('\n\nOverview: ', orange) + episodes[i].overview + ' ' +
                    coloredStr('\n\nIMDb ID: ', orange) + cde.imdb_id +
                    coloredStr(' TVDb ID: ', orange) + episodes[i].tvdb_id
	        )
            });
            page.entries++;
        }
        page.loading = false;
    });
	
    plugin.addSearcher(plugin.getDescriptor().id, logo, function(page, query) {
        browseItems(page, encodeURIComponent(query));
    });
})(this);