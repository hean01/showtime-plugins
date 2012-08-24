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

	var str = "<div id=\"stations\">";
	var s = doc.indexOf(str);
	if (s < 0)
	    return;
	doc = doc.substr(s);

	while(1) {
	    var str = "<li>";
	    var s = doc.indexOf(str, 2);
	    if (s < 0)
		break;
	    doc = doc.substr(s);

	    // get key
	    str = getValue(doc, "<!-- Channel: ", " Listeners");
	    if (str == null) continue;
	    itemmd.key = str;

	    // get listeners
	    str = getValue(doc, "Listeners: ", " -->");
	    if (str == null) continue;
	    itemmd.listeners = str;

	    // get icon
	    str = getValue(doc, "<img src=\"", "\"");
	    if (str == null) continue;
	    itemmd.icon = BASE_URL +  str;
	    
	    // get title
	    str = getValue(doc, "<h3>", "</h3>");
	    if (str == null) continue;
	    itemmd.station = str;
	    
	    // get desc
	    str = getValue(doc, "<p class=\"descr\">", "</p>");
	    if (str == null) continue;
	    itemmd.description = str;

	    // get current track playing
	    str = getValue(doc, "<span class=\"playing\">", "</span>");
	    str = getValue(str, "/played\">","</a>");
	    if (str == null) continue;
	    itemmd.title = str;


	    // add item to showtime page
	    page.appendItem("shoutcast:" + BASE_URL + "/startstream=" + itemmd.key + ".pls", "station", {
		station: itemmd.station,
		title: itemmd.title,
		description: itemmd.description,
		icon: itemmd.icon,
		listeners: itemmd.listeners
	    }); 
	}
    }

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

        page.options.createInt('childTilesY', 'Number of Y Child Tiles', 3, 1, 4, 1, '', function (v) {
            page.metadata.childTilesY = v;
        }, true);

        page.options.createBool('informationBar', 'Information Bar', true, function (v) {
            page.metadata.informationBar = v;
        }, true);

	var doc = showtime.httpGet(BASE_URL + "/listen", {}).toString();
	scrape_page(page, doc);
	page.loading = false;
    });
})(this);
