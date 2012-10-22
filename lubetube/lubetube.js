/*
 *  LubeTube - Showtime Plugin
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
    var BASE_URL = "http://lubetube.com"
    var PREFIX = "lubetube:"
 
    plugin.createService("LubeTube", PREFIX + "start", "video", true,
			 plugin.path + "lubetube.png");

    function fixup_html(doc) {
	doc = doc.replace(/\&amp;/g,'&');
	doc = doc.replace(/\&gt;/g,'>');
	doc = doc.replace(/\&lt;/g,'<');
	doc = doc.replace(/\&#039;/g,'\'');
	doc = doc.replace(/\&#39;/g,'\'');
	return doc;
    }

    function addItem(page, name, url, icon) {
	page.appendItem(PREFIX+"play:"+escape(url)+":"+name, "video", {
	    title: unescape(name),
	    icon: icon
	});
    }

    function categories(page) {
	var response = showtime.httpGet(BASE_URL+"/categories");
	var re = /<a href="http:\/\/lubetube.com([^\s]+)page=1"><img width="[0-9]+" height="[0-9]+" alt="[^"]+" class="main_gallery" src="([^\s]+)" title="([^"]+)" \/><\/a><br \/>/g;

	var match = re.exec(response);
	while(match)
	{
	    page.appendItem(PREFIX + "category:" + match[3] + ":" + match[1], "directory", {
		title: match[3],
		icon: match[2]
	    });
	    var match = re.exec(response);
	}
    }

    function index(page, url) {
	var offset = 0;

	function loader() {
	    var entries = 0;
	    var p = Math.floor( 1 + (offset / 50));
	    var response = showtime.httpGet(url + "page=" + p).toString();
	    //showtime.trace(response);
	    //<span class="details"><span class="length">Length: 02:00</span><span class="views">Views: 3138</span><span class="ratingbg"><span class="rating" style="width:00%;"></span></span></span>
	    var re = /<a class="frame" href="(http:\/\/lubetube.com\/video\/([^"]+))" title="([^"]+)"><\/a><img src="([^"]+)"/g;
	    var match = re.exec(response);
	    while(match)
	    {
		addItem(page, match[3], match[1], match[4]);
		match = re.exec(response);
		offset++;
	    }

	    re = /<strong>([0-9]+)<\/strong> videos/;
	    match = re.exec(response);
	    if (match)
		page.entries = match[1];

	    //showtime.trace("LubeTube loader: offeset " + offset + " page.entries " + page.entries);
	    return offset < page.entries;
	}

	page.type = "directory";
	loader();
	page.loading = false;
	page.paginator = loader;
    }

    function videolink(url) {
	var response = showtime.httpGet(url).toString();
	var re = /playlist_flow_player_flv.php\?vid=[0-9]+/;
	var match = re.exec(response);
	if (match) {
	    re = /url="([^"]+)"/;
	    var response = showtime.httpGet(BASE_URL + "/" + match[0]).toString();
	    response = fixup_html(response);
	    match = re.exec(response);
	    if(match)
		return unescape(match[1])
	}
	return null;
    }

    // Start page
    plugin.addURI(PREFIX + "play:(.*):(.*)", function(page, url, title) {
	page.type = "video";
	page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            sources: [{
                url: videolink(unescape(url))
            }]
        });
	page.loading = false;
    });

    // Start page
    plugin.addURI(PREFIX + "category:(.*):(.*)", function(page, name, uri) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.title = name;
	page.metadata.logo = plugin.path + "lubetube.png";
	index(page, BASE_URL+uri);
	page.loading = false;
    });

    // Start page
    plugin.addURI(PREFIX + "start", function(page) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.title = "Home";
	page.metadata.logo = plugin.path + "lubetube.png";

	categories(page);
	
	page.loading = false;
    });

    plugin.addSearcher("LubeTube", plugin.path + "lubetube.png", function(page, query) {
	page.type = "directory";
	index(page, BASE_URL + "/search/videos?search_id=" +  showtime.paramEscape(query) + "&");
	page.loading = false;
    });

})(this);
