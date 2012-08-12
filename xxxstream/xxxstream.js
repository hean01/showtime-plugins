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
    var BASE_URL = "http://www.xxxstream.org"
    var PREFIX = "xxxstream:"

    plugin.createService("xXx Stream", PREFIX + "start", "video", true,
			 plugin.path + "xxxstream.png");

    function fixup_html(doc) {
	doc = doc.replace(/\&amp;/g,'&');
	doc = doc.replace(/\&gt;/g,'>');
	doc = doc.replace(/\&lt;/g,'<');
	doc = doc.replace(/\&#039;/g,'\'');
	doc = doc.replace(/\&#39;/g,'\'');
	return doc;
    }

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

    function get_video_url(url) {
	var str = "so.addVariable('file', '";
	var res = showtime.httpGet(url).toString();
	var s = res.indexOf(str);
	if (s < 0 ) 
	{
	    str = "so.addVariable('video_url'";
	    s = res.indexOf(str);
	    if (s < 0 )
		return null;

	    str = "encodeURIComponent('";
	    var s2 = res.indexOf(str, s);
	    s = s2;
	}
	s = s + str.length;
	var e = res.indexOf("'", s);

	res = res.substr(s,e-s)

	return res;
    }

    function scrape_page(page, url) {
	// load page
	var res = showtime.httpGet(url).toString();
	if (res == null)
	    return false;

	res = fixup_html(res);

	// cleanup document of stupid problems...
	var itemmd = { 
	};

	while(1) {
	    var str = "<div class=\"video_box\">";
	    var se = res.indexOf(str,2);
	    if (se < 0)
		break;
	    res = res.substr(se);

	    showtime.trace("Got video_box");

	    // get video url
	    str = getValue(res, "<a href=\"", "\"");
	    if (str == null)
		continue;
	    itemmd.video_url = str;
	    
	    // get thumb and title
	    str = getValue(res, "<img src=\"", "\"");
	    if (str == null)
		continue;
	    str = str.replace("1.jpg","3.jpg");
	    itemmd.thumb_url = BASE_URL+str;

	    str = getValue(res, "title=\"", "\"");
	    if (str == null)
		continue;
	    itemmd.title = str;
	    
	    // get rating
	    str = getValue(res, "<ul class=\"rating_small\">","</ul>");
	    if (str == null)
		continue;
	    var rating = 0.0;
	    var cnt = 5;
	    se = 0;
	    while(cnt) 
	    {
		cnt = cnt - 1;
		se = str.indexOf("<span class=\"full\">", se);
		if (se < 0)
		    continue;
		rating += 1;
	    }


	    // add item to showtime page
	    page.appendItem(PREFIX+"play:"+itemmd.video_url, "video", {
		title: unescape(itemmd.title),
		icon: itemmd.thumb_url,
		rating: itemmd.rating
	    }); 
	}

	return true;
    }

    plugin.addURI(PREFIX + "play:(.*)", function(page, url) {
	page.type = "video";
	page.source = "videoparams:" + showtime.JSONEncode({
	    sources: [{
		url: get_video_url(BASE_URL + url)
	    }]
	});

	showtime.trace(page.source);
	page.loading = false;
    });

    plugin.addURI(PREFIX + "recent", function(page) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.title = "Most recent";
	page.metadata.logo = plugin.path + "xxxstream.png";
	scrape_page(page, BASE_URL + "/videos/recent");
	page.loading = false;
    });

    plugin.addURI(PREFIX + "viewed", function(page) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.title = "Most viewed";
	page.metadata.logo = plugin.path + "xxxstream.png";
	scrape_page(page, BASE_URL + "/videos/popular");
	page.loading = false;
    });

    plugin.addURI(PREFIX + "rated", function(page) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.title = "Top rated";
	page.metadata.logo = plugin.path + "xxxstream.png";
	scrape_page(page, BASE_URL + "/videos/top-rated");
	page.loading = false;
    });

    plugin.addURI(PREFIX + "favorites", function(page) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.title = "Top favorites";
	page.metadata.logo = plugin.path + "xxxstream.png";
	scrape_page(page, BASE_URL + "/videos/top-favorites");
	page.loading = false;
    });


    plugin.addURI(PREFIX + "search", function(page) {
	page.loading = false;
	var search = showtime.textDialog('Search: ', true, false);
	if (search.rejected)
	    return;
	var query = search.input;
	page.type = "directory";
	page.contents = "items";
	page.metadata.title = "Search result: " + query;
	page.metadata.logo = plugin.path + "xxxstream.png";
	page.loading = true;
	scrape_page(page, BASE_URL + "/search?search_type=videos&search_query=" + query);
	page.loading = false;
    });

    plugin.addURI(PREFIX + "search:(.*)", function(page, query) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.title = "Search result: " + query;
	page.metadata.logo = plugin.path + "xxxstream.png";
	scrape_page(page, BASE_URL + "/search?search_type=videos&search_query=" + query);
	page.loading = false;
    });

    // Start page
    plugin.addURI(PREFIX + "start", function(page) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.title = "Home";
	page.metadata.logo = plugin.path + "xxxstream.png";

	// most recent
	page.appendItem(PREFIX + "recent", "video", {
	    title: "Most recent"
	});

	// most viewed
	page.appendItem(PREFIX + "viewed", "video", {
	    title: "Most viewed"
	});

	// top rated
	page.appendItem(PREFIX + "rated", "video", {
	    title: "Top rated"
	});

	// top favorites
	page.appendItem(PREFIX + "favorites", "video", {
	    title: "Top favorites"
	});

	// search
	page.appendItem(PREFIX + "search", "video", {
	    title: "Search"
	});
	
	page.loading = false;
    });
})(this);
