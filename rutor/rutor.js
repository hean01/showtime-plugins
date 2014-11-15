/**
 * rutor.org plugin for Showtime
 *
 *  Copyright (C) 2014 lprot
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
    var plugin_info = plugin.getDescriptor();
    var PREFIX = plugin_info.id;
    //var BASE_URL = 'http://torrent-rutor.org';
    var BASE_URL = 'http://new-rutor.org';
    var logo = plugin.path + "logo.png";
    var slogan = plugin_info.synopsis;

    var blue = '6699CC', orange = 'FFA500', red = 'EE0000', green = '008B45';

    function colorStr(str, color) {
        return '<font color="' + color + '"> (' + str + ')</font>';
    }

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    function setPageHeader(page, title) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    }

    plugin.createService(plugin_info.title, PREFIX + ":start", "video", true, logo);

    plugin.addURI(PREFIX + ":start", function(page) {
        setPageHeader(page, plugin_info.synopsis);
        page.loading = true;
        var doc = showtime.httpReq(BASE_URL + '/top').toString();
        //var doc = showtime.httpReq(BASE_URL).toString();
        page.loading = false;
        doc = doc.match(/<div id="index">([\s\S]*?)<!-- bottom banner -->/);
        if (doc) {
           var re = /<h2>([\s\S]*?)<\/h2>([\s\S]*?)<\/table>/g;
           var match = re.exec(doc[1]);
           while (match) {
               page.appendItem("", "separator", {
 	           title: new showtime.RichText(match[1])
               });
               // 1-date, 2-filelink, 3-infolink, 4-title,
               // 5-(1)size, (2)seeds, (3)peers
               var re2 = /<tr class="[gai|tum]+"><td>([\s\S]*?)<\/td>[\s\S]*?href="([\s\S]*?)"[\s\S]*?<a href[\s\S]*?<a href="([\s\S]*?)">([\s\S]*?)<\/a>([\s\S]*?)<\/tr>/g;
               var match2 = re2.exec(match[2]);
               while (match2) {
                   if (match2[5].match(/alt="C"/)) {
                       var end = match2[5].match(/[\s\S]*?<td align="right">[\s\S]*?<td align="right">([\s\S]*?)<[\s\S]*?nbsp;([\s\S]*?)<\/span>[\s\S]*?nbsp;([\s\S]*?)<\/span>/);
                       var comments = match2[5].match(/[\s\S]*?<td align="right">([\s\S]*?)</)[1];
                   } else
                       var end = match2[5].match(/[\s\S]*?<td align="right">([\s\S]*?)<[\s\S]*?nbsp;([\s\S]*?)<\/span>[\s\S]*?nbsp;([\s\S]*?)<\/span>/);
                       page.appendItem('torrent:browse:'+ BASE_URL + match2[2], "directory", {
    	                   title: new showtime.RichText(colorStr(match2[1], orange) + ' ' +
                               match2[4] + ' ('+ coloredStr(end[2], green) + '/'+
                               coloredStr(end[3], red) + ') ' + colorStr(end[1], blue) +
                               (comments ? colorStr(comments, orange) : ''))
                   });
                   match2 = re2.exec(match[2]);
               }
               match = re.exec(doc[1]);
           }

        }
    });

      plugin.addSearcher(plugin.getDescriptor().id, logo, function(page, query) {
	page.entries = 0;
	var fromPage = 0, tryToSearch = true;
	
	//1-date, 2-torrent, 3-link, 4-title, 5-size, 6-seeders, 7-leechers
	var re = /<tr class="gai"><td>([\S\s]{0,100}?)<\/td><td ><a class="downgif" href="([\S\s]{0,100}?)"[\S\s]{0,200}?<a href="([\S\s]{0,300}?)">([\S\s]*?)<\/a>[\S\s]{0,100}<td align="right">([\S\s]{0,100}?)<\/td>[\S\s]{0,200}?alt="S" \/>([\S\s]{0,50}?)<\/span>[\S\s]*?alt="L" \/><span class="red">([\S\s]{0,50}?)<\/span>/g;
	
	function loader() {
	  if (!tryToSearch) return false;
			 page.loading = true;
	  var response = showtime.httpReq(BASE_URL + "/search/"+ fromPage +"/0/010/0/" + query.replace(/\s/g, '\+')).toString();
	  page.loading = false;
	  var match = re.exec(response);
	  var date,
	  torrent,
	  link,
	  title,
	  size,
	  seeders,
	  leechers;
	  while (match) {
	  date = match[1],
	  torrent = match[2],
	  link = match[3],
	  title = match[4],
	  size = match[5],
	  seeders = match[6],
	  leechers = match[7];
	  
	    
			 page.appendItem('torrent:browse:'+ BASE_URL + torrent, "directory", {
    	                   title: new showtime.RichText(colorStr(date, orange) + ' ' +
                               title + ' ('+ coloredStr(seeders, green) + '/'+
                               coloredStr(leechers, red) + ') ' + colorStr(size, blue))
                   });
	    page.entries++;
	    match = re.exec(response);
	  };
	  if (!response.match(/downgif/)) return tryToSearch = false;
			 fromPage++;
	  return true;
	};
	loader();
	page.paginator = loader;
      });
})(this);