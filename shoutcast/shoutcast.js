/*
 *  SHOUTcast
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
    var BASE_URL = "http://www.shoutcast.com";
    var PREFIX = "sc:";

    plugin.createService("SHOUTcast", PREFIX + "start", "audio", true,
			 plugin.path + "shoutcast_square.png");

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
	    var str = "<div class=\"stationcol\"";
	    var s = doc.indexOf(str, 2);
	    if (s < 0)
		break;
	    doc = doc.substr(s);

	    // get title
	    str = getValue(doc, "name=\"", "\"");
	    if (str == null) continue;
	    itemmd.title = str;

	    // get playlist url
	    str = getValue(doc, "href=\"", "\"");
	    if (str == null) continue;
	    itemmd.url = str

	    // add item to showtime page
	    page.appendItem("shoutcast:"+itemmd.url, "audio", {
		title: itemmd.title
	    }); 
	}
    }

    // Start page
    plugin.addURI(PREFIX + "start", function(page) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.logo = plugin.path + "shoutcast_square.png";
	page.metadata.title = "SHOUTcast";
	var doc = showtime.httpGet(BASE_URL, {}).toString();
	scrape_page(page, doc);
	page.loading = false;
    });
})(this);
