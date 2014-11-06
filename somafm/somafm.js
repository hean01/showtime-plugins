/*
 *  soma fm
 *
 *  Copyright (C) 2012-2014 Henrik Andersson, lprot
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
    var logo = plugin.path + "somafm.png";

    plugin.createService(plugin.getDescriptor().title, plugin.getDescriptor().id + ":start", "audio", true, logo);

    function descr(s) {
        var tmp = s.match(/<p class="descr">([\S\s]*?)<dl>/);
        if (tmp) return tmp[1].replace("<!--","").replace("-->","").replace("</p>","").replace(/^\s+|\s+$/g, '');
        tmp = s.match(/<h1>([\S\s]*?)<\/h1>/);
        if (tmp) return tmp[1];
        return null;
    }

    // Start page
    plugin.addURI(plugin.getDescriptor().id + ":start", function(page) {
	page.type = "directory";
	page.metadata.glwview = plugin.path + "views/array.view";
	page.contents = "items";
	page.metadata.logo = logo;
	page.metadata.title = plugin.getDescriptor().title;

        page.options.createInt('childTilesX', 'Tiles by X', 6, 1, 10, 1, '', function(v) {
            page.metadata.childTilesX = v;
        }, true);

        page.options.createInt('childTilesY', 'Tiles by Y', 2, 1, 4, 1, '', function(v) {
            page.metadata.childTilesY = v;
        }, true);

        page.options.createBool('informationBar', 'Information Bar', true, function(v) {
            page.metadata.informationBar = v;
        }, true);

        var doc = showtime.httpReq(BASE_URL + "/listen").toString();

        // 1-id, 2-listeners, 3-icon, 4-title, 5-(description/now playing)
        var re = /<!-- Channel: (.*) Listeners: (.*) -->[\S\s]*?<img src="([\S\s]*?)"[\S\s]*?<h3>([\S\s]*?)<\/h3>([\S\s]*?)<\/li>/g;
        var match = re.exec(doc);
        while (match) {
	    page.appendItem("icecast:" + BASE_URL + "/startstream=" + match[1] + ".pls", "station", {
	        station: match[4],
	        title: match[4],
	        description: descr(match[5]),
	        icon: BASE_URL + match[3],
                album_art: BASE_URL + match[3],
                nowplaying: (match[5].match(/<span class="playing"><a href="[\S\s]*?">([\S\s]*?)<\/a>/) ? match[5].match(/<span class="playing"><a href="[\S\s]*?">([\S\s]*?)<\/a>/)[1] : null),
	        listeners: match[2]
	    });
            match = re.exec(doc);
        };
	page.loading = false;
    });
})(this);