/*
 *  soma fm
 *
 *  Copyright (C) 2012 Henrik Andersson
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
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


(function(plugin) {
    var BASE_URL = "http://www.somafm.com";
    var PREFIX = "somafm:";

    plugin.createService("soma fm", PREFIX + "start", "audio", true,
			 plugin.path + "somafm.png");

    // Start page
    plugin.addURI(PREFIX + "start", function(page) {
	page.type = "directory";
	page.metadata.glwview = plugin.path + "views/array.view";
	page.contents = "items";
	page.metadata.logo = plugin.path + "somafm.png";
	page.metadata.title = "soma fm";

        page.options.createInt('childTilesX', 'Number of X Child Tiles', 6, 1, 10, 1, '', function (v) {
            page.metadata.childTilesX = v;
        }, true);

        page.options.createInt('childTilesY', 'Number of Y Child Tiles', 2, 1, 4, 1, '', function (v) {
            page.metadata.childTilesY = v;
        }, true);

        page.options.createBool('informationBar', 'Information Bar', true, function (v) {
            page.metadata.informationBar = v;
        }, true);

        var doc = showtime.httpGet(BASE_URL + "/listen").toString();

        // 1-id, 2-listeners, 3-icon, 4-title, 5-description, 6-now playing
        var re = /<!-- Channel: (.*) Listeners: (.*) -->[\S\s]*?<img src="([\S\s]*?)"[\S\s]*?alt="([\S\s]*?)"[\S\s]*?<p class="descr">([\S\s]*?)<\/p>[\S\s]*?<span class="playing"><a href="[\S\s]*?">([\S\s]*?)<\/a>/g;
        var match = re.exec(doc);

        while (match) {
	    page.appendItem("icecast:" + BASE_URL + "/startstream=" + match[1] + ".pls", "station", {
	        station: match[4],
	        title: match[4],
	        description: match[5],
	        icon: BASE_URL + match[3],
                album_art: BASE_URL + match[3],
                nowplaying: match[6],
	        listeners: match[2]
	    });
            match = re.exec(doc);
        };

	page.loading = false;
    });
})(this);
