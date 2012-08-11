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

    plugin.createService("Digtally Imported", PREFIX + "start", "audio", true,
			 plugin.path + "di_square.png");

    function getValue(doc, start, end) {
	var s = doc.indexOf(start);
	if (s < 0)
 	    return null;

	s = s + start.length;

	var e = doc.indexOf(end,s);
	if (e < 0)
	    return null;

	return doc.substr(s,e-s);
    }

    function scrape_page(page, doc) {

	var itemmd = {};

	while(1) {
	    var str = "<li data-key=\"";
	    var s = doc.indexOf(str, 2);
	    if (s < 0)
		break;
	    doc = doc.substr(s);

	    // get key and id
	    str = getValue(doc, "data-key=\"", "\"");
	    if (str == null) continue;
	    itemmd.key = str;
	    str = getValue(doc, "data-id=\"", "\"");
	    if (str == null) continue;
	    itemmd.id = str;

	    // get icon
	    doc = doc.substr(doc.indexOf("src="));
	    str = getValue(doc, "src=\"", "\"");
	    if (str == null) continue;
	    itemmd.icon = str;

	    

	    // get title
	    str = getValue(doc, "<a href=\"/" + itemmd.key + "\">", "</a>");
	    if (str == null) continue;
	    itemmd.title = str;

	    // get current playing as description
	    str = getValue(doc,"<p class=\"track\">", "</p>");
	    if (str == null) continue;
	    itemmd.description = str;
	    itemmd.artist = str;
	    itemmd.album = str;

	    // add item to showtime page
	    page.appendItem("shoutcast:http://listen.di.fm/public3/"+itemmd.key+".pls", "audio", {
		title: itemmd.title,
		description: itemmd.description,
		icon: itemmd.icon,
		album_art: itemmd.icon,
		additional_artists: {
		    artist: itemmd.artist
		},
		album: itemmd.album
	    }); 
	}
    }

    // Start page
    plugin.addURI(PREFIX + "start", function(page) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.logo = plugin.path + "di_square.png";
	page.metadata.title = "Digitally Imported";
	var doc = showtime.httpGet("http://www.di.fm/", {}).toString();
	scrape_page(page, doc);
	page.loading = false;
    });
})(this);
