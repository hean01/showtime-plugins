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
    var BASE_URL = "http://www.lubetube.com"
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
		page.appendItem(PREFIX+"play:"+url, "video", {
			title: unescape(name),
			icon: icon
		});
    }

    function addDir(page, name, url, image) {
		page.appendItem(PREFIX + "category:" + name + ":" + url, "directory", {
			title: name
		});
    }

    function categories(page) {
	addDir(page, "Most Recent", "/", 1, "")
        addDir(page, "Amateur", "/search/cat/amateur", 1, "")
        addDir(page, "Anal", "/search/cat/anal", 1, "")
        addDir(page, "Asian", "/search/cat/asian", 1, "")
        addDir(page, "Ass", "/search/cat/asslicking", 1, "")
        addDir(page, "BBW", "/search/cat/bbw", 1, "")
        addDir(page, "Big Butt", "/search/cat/bigbutt", 1, "")
        addDir(page, "Big Cock", "/search/cat/bigcock", 1, "")
        addDir(page, "Big Tits", "/search/cat/bigtits", 1, "")
        addDir(page, "Blonde", "/search/cat/blonde", 1, "")
        addDir(page, "Blowjob", "/search/cat/blowjob", 1, "")
        addDir(page, "Bondage", "/search/cat/bondage", 1, "")
        addDir(page, "Creampie", "/search/cat/creampie", 1, "")
        addDir(page, "Cumshot", "/search/cat/cumshot", 1, "")
        addDir(page, "Cum Swapping", "/search/cat/cumswapping", 1, "")
        addDir(page, "Double Penetration", "/search/cat/doublepenetration", 1, "")
        addDir(page, "Ebony", "/search/cat/ebony", 1, "")
        addDir(page, "Facial", "/search/cat/facial", 1, "")
        addDir(page, "Fetish", "/search/cat/fetish", 1, "")
        addDir(page, "Fingering", "/search/cat/fingering", 1, "")
        addDir(page, "Fisting", "/search/cat/fisting", 1, "")
        addDir(page, "Foot Fetish", "/search/cat/footfetish", 1, "")
        addDir(page, "Footjob", "/search/cat/footjob", 1, "")
        addDir(page, "Fucking Machine", "/search/cat/fuckingmachine", 1, "")
        addDir(page, "Gagging", "/search/cat/gagging", 1, "")
        addDir(page, "Gangbang", "/search/cat/gangbang", 1, "")
        addDir(page, "Group Sex", "/search/cat/groupsex", 1, "")
        addDir(page, "Handjob", "/search/cat/handjob", 1, "")
        addDir(page, "Hardcore", "/search/cat/hardcore", 1, "")
        addDir(page, "Insertion", "/search/cat/insertion", 1, "")
        addDir(page, "Interracial", "/search/cat/interracial", 1, "")
        addDir(page, "Latex", "/search/cat/latex", 1, "")
        addDir(page, "Latina", "/search/cat/latina", 1, "")
        addDir(page, "Lesbian", "/search/cat/lesbian", 1, "")
        addDir(page, "Masturbation", "/search/cat/masturbation", 1, "")
        addDir(page, "MILF", "/search/cat/milf", 1, "")
        addDir(page, "Party", "/search/cat/party", 1, "")
        addDir(page, "Pornstar", "/search/cat/pornstar", 1, "")
        addDir(page, "POV", "/search/cat/pov", 1, "")
        addDir(page, "Public", "/search/cat/public", 1, "")
        addDir(page, "Reality", "/search/cat/reality", 1, "")
        addDir(page, "Redhead", "/search/cat/redhead", 1, "")
        addDir(page, "Solo", "/search/cat/solo", 1, "")
        addDir(page, "Spanking", "/search/cat/spanking", 1, "")
        addDir(page, "Squirting", "/search/cat/squirting", 1, "")
        addDir(page, "Striptease", "/search/cat/striptease", 1, "")
        addDir(page, "Teen", "/search/cat/teen", 1, "")
        addDir(page, "Threesome", "/search/cat/threesome", 1, "")
        addDir(page, "Toys", "/search/cat/toys", 1, "")
        addDir(page, "Tranny", "/search/cat/tranny", 1, "")
        addDir(page, "Voyeur", "/search/cat/voyeur", 1, "")
    }

    function index(page, url) {
		var response = showtime.httpGet(url).toString();
		var re = /<a class="frame.*" href="(http:\/\/lubetube.com\/video\/([^\s]+))" title="(.*)">.*?<img src="([^\s]+)"/g;
		var match = re.exec(response);
		while(match) {
			addItem(page, match[3], match[1], match[4]);
			match = re.exec(response);
		}
    }

    function videolink(url) {
		var re = /playlist_flow_player_flv.php\?vid=[0-9]+/g;
		var match = re.exec(showtime.httpGet(url).toString());
		if (!match) {
			showtime.trace("Can't get the link. Retrying...");
			match = re.exec(showtime.httpGet(url).toString());
		}

		if (match) {
			var answer=match[0];
			showtime.trace("Player: " + BASE_URL + "/" + match[0]);
			re = /url="(.*)" type/g;
			match = re.exec(fixup_html(showtime.httpGet(BASE_URL + "/" + match[0]).toString()));

			if (!match) {
				showtime.trace("Can't get the link again. Retrying...");
				match = re.exec(fixup_html(showtime.httpGet(BASE_URL + "/" + answer).toString()));
			}
			
			showtime.trace("Player2: " + unescape(match[1]));
			if(match)
				return unescape(match[1])
		}
		return null;
    }

    // Start page
    plugin.addURI(PREFIX + "play:(.*)", function(page, url) {
		page.type = "video";
		showtime.trace("Opening: " + url);
		page.source = videolink(url);
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

})(this);
