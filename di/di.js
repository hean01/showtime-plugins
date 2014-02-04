/*
 *  Digitally Imported
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
    var BASE_URL = "http://www.di.fm";
    var PREFIX = "di:";

    plugin.createService("Digitally Imported", PREFIX + "start", "audio", true,
			 plugin.path + "di_square.png");

    // Start page
    plugin.addURI(PREFIX + "start", function(page) {
	page.type = "directory";
	page.metadata.glwview = plugin.path + "views/array.view";
	page.contents = "items";
	page.metadata.logo = plugin.path + "di_square.png";
	page.metadata.title = "Digitally Imported";
	var doc = showtime.httpGet("http://www.di.fm").toString();

	// 1-description, 2-key, 3-name, 4-icon
        var re = /"description"\:"(.*?)"[\S\s]*?"key"\:"(.*?)"[\S\s]*?"name"\:"(.*?)"[\S\s]*?"default":"(.*?){/g;
        var match = re.exec(doc);
        while (match) {
		page.appendItem("icecast:http://listen.di.fm/public3/"+match[2]+".pls", "station", {
			station: match[3],
			title: match[3],
			description: match[1],
			icon: match[4]+'.jpg?size=150x150',
			album_art: match[1],
			album: ""
		}); 
		match = re.exec(doc);
	};
	page.loading = false;
    });
})(this);
