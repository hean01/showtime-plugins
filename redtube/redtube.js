/**
 * Redtube plugin for Showtime
 *
 *  Copyright (C) 2012 lprot
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

    var PREFIX = 'redtube';

    var service = plugin.createService("Redtube", PREFIX + ":start", "video", true,	plugin.path + "logo.png");
        
    function startPage(page) {
        page.metadata.title = 'Redtube - Home Page';
        page.metadata.logo = plugin.path + "logo.png";        
        page.type = "directory";
        page.contents = "items";
        page.appendItem(PREFIX + ':categories', 'directory', {title: 'Categories'});
        page.appendItem(PREFIX + ':tags', 'directory', {title: 'Tags'});
        page.appendItem(PREFIX + ':stars', 'directory', {title: 'Stars'});
        page.loading = false;
    };
  
    plugin.addURI(PREFIX + ":categories", function(page) {
        page.metadata.title = 'Redtube - Categories';
        page.metadata.logo = plugin.path + "logo.png";
        page.type = "directory";
        page.contents = "items";
		var jsonobj = showtime.JSONDecode(showtime.httpGet("http://api.redtube.com/?data=redtube.Categories.getCategoriesList&output=json").toString());
        for (var i in jsonobj.categories) {
            page.appendItem(PREFIX + ':search:category=' + escape(jsonobj.categories[i].category), 'directory', {
                title: jsonobj.categories[i].category
            })
        }
        page.loading = false;
    });
  
    plugin.addURI(PREFIX + ":tags", function(page) {
        page.metadata.title = 'Redtube - Tags';
        page.metadata.logo = plugin.path + "logo.png";
        page.type = "directory";
        page.contents = "items";
		var jsonobj = showtime.JSONDecode(showtime.httpGet("http://api.redtube.com/?data=redtube.Tags.getTagList&output=json").toString());
        for (var i in jsonobj.tags) {
            page.appendItem(PREFIX + ':search:tags[]=' + escape(jsonobj.tags[i].tag.tag_name), 'directory', {
                title: jsonobj.tags[i].tag.tag_name
            })
        }
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":stars", function(page) {
        page.metadata.title = 'Redtube - Stars';
        page.metadata.logo = plugin.path + "logo.png";
        page.type = "directory";
        page.contents = "items";
		var jsonobj = showtime.JSONDecode(showtime.httpGet("http://api.redtube.com/?data=redtube.Stars.getStarList&output=json").toString());
        for (var i in jsonobj.stars) {
            page.appendItem(PREFIX + ':search:stars[]=' + escape(jsonobj.stars[i].star.star_name), 'directory', {
                title: jsonobj.stars[i].star.star_name
            });
        }
        page.loading = false;
    });

	function getTimestamp(str) {
		if (!str) return false;
		var d = str.match(/\d+/g); // extract date parts
		return +Date.UTC(d[0], d[1]-1, d[2], d[3], d[4], d[5])/1000;
	}

	function preparePage(page, jsonobj, url, query, pageNum) {
		url = unescape(url);
		query = unescape(query);
		for (var i in jsonobj.videos) {
			var description = '<font size="4" color="6699CC">Video ID: </font><font size="4">' + jsonobj.videos[i].video.video_id + '</font>\n\n';
			description += '<font size="4" color="6699CC">Views: </font><font size="4">' + jsonobj.videos[i].video.views + '</font>\n\n';
			description += '<font size="4" color="6699CC">Ratings: </font><font size="4">' + jsonobj.videos[i].video.ratings + '</font>\n\n';

			var stars = 0; 
			if (jsonobj.videos[i].video.stars) {
				stars = '';
				for (var j in jsonobj.videos[i].video.stars) {
					if (stars) stars += ", ";
					stars += jsonobj.videos[i].video.stars[j].star_name;
				};
			};
			if (stars) description += '<font size="4" color="6699CC">Starring: </font><font size="4">'+stars+'.</font>\n\n';
				
			var tags = 0; 
			if (jsonobj.videos[i].video.tags) {
				tags = '';
				for (var j in jsonobj.videos[i].video.tags) {
					if (tags) tags += ", ";
					tags += jsonobj.videos[i].video.tags[j].tag_name;
				};
			};
			if (tags) description += '<font size="4" color="6699CC">Tags: </font><font size="4">'+tags+'.</font>\n';
				
			var title = (!jsonobj.videos[i].video.title)?"Unnamed video":jsonobj.videos[i].video.title;
			page.appendItem(PREFIX + ":play:"+jsonobj.videos[i].video.video_id+":"+escape(title),"video", {
				title: new showtime.RichText(title+'<font size="3" color="6699CC"> ( ' + jsonobj.videos[i].video.duration + ' )</font>'),
				rating: +(jsonobj.videos[i].video.rating)*20,
				icon: jsonobj.videos[i].video.default_thumb,
				duration: jsonobj.videos[i].video.duration,
				year: jsonobj.videos[i].video.publish_date ? +parseInt(jsonobj.videos[i].video.publish_date) : 0,
				timestamp: getTimestamp(jsonobj.videos[i].video.publish_date),
				genre: jsonobj.videos[i].video.tags ? jsonobj.videos[i].video.tags[0].tag_name : 0,
				description: new showtime.RichText(description)
			});
		};

		if (pageNum < Math.round(jsonobj.count/20)) {
			page.appendItem(PREFIX + ":next:"+escape(url)+":"+escape(query)+":"+pageNum,"directory", {
				title: new showtime.RichText('<font size="5" color="FFFFFF">Page<font size="5" color="6699CC"> '+ pageNum +'<font size="5" color="FFFFFF"> of <font size="5" color="6699CC">' + Math.round(jsonobj.count/20) + ' <font size="5" color="FF0000">Next page>></font>')
			})}
		else {
			page.appendItem(PREFIX + ":next:"+escape(url)+":"+escape(query)+":"+(pageNum-1),"directory", {
				title: new showtime.RichText('<font size="5" color="FFFFFF">Page<font size="5" color="6699CC"> '+ pageNum +'<font size="5" color="FFFFFF"> of <font size="5" color="6699CC">' + Math.round(jsonobj.count/20))
			})
		};
		
		page.loading = false;
		return;
	};

	plugin.addURI(PREFIX + ":next:(.*):(.*):(.*)", function(page, url, query, pageNum) {
        page.metadata.logo = plugin.path + "logo.png";
        page.type = "directory";
        page.contents = "items";
		pageNum++;
		url = unescape(url);
		query = unescape(query);
		var jsonobj = showtime.JSONDecode(showtime.httpGet(url+query+"&page="+pageNum).toString());
		if (!jsonobj.videos) return;
		page.metadata.title = 'Redtube - Search (found '+ jsonobj.count +' videos)';
		preparePage(page, jsonobj, escape(url), escape(query), pageNum)
	});
	
	plugin.addURI(PREFIX + ":search:(.*)", function(page, query) {
        page.metadata.logo = plugin.path + "logo.png";
        page.type = "directory";
        page.contents = "items";
        var url = "http://api.redtube.com/?data=redtube.Videos.searchVideos&output=json&thumbsize=none&";
		var jsonobj = showtime.JSONDecode(showtime.httpGet(url+query).toString());
		if (!jsonobj.videos) return;
        page.metadata.title = 'Redtube - Search (found '+ jsonobj.count +' videos)';
		preparePage(page, jsonobj, escape(url), escape(query), 1)
    });
    
    plugin.addURI(PREFIX + ":play:(.*):(.*)", function(page, video_id, title) {
		var re = new RegExp("flv_h264_url\=(.*?)\&","i");
		var m = re.exec(showtime.httpGet("http://www.redtube.com/"+video_id).toString());
		page.type = "video";
		page.source = "videoparams:" + showtime.JSONEncode({
			title: unescape(title),
			sources: [{
				url: unescape(m[1])
			}]
		});
		page.loading = false;
    });
    
	plugin.addURI(PREFIX+":start", startPage);

	plugin.addSearcher("Redtube - Videos", plugin.path + "logo.png", 
	function(page, query) {
		try {
			var url = "http://api.redtube.com/?data=redtube.Videos.searchVideos&output=json&thumbsize=none&search=";
			var jsonobj = showtime.JSONDecode(showtime.httpGet(url+query).toString());
			if (!jsonobj.videos) return;
			preparePage(page, jsonobj, escape(url), escape(query), 1)
			page.entries = jsonobj.videos.length;
		}
		catch(err){
			showtime.trace('Search Redtube - Videos: '+err)
		}
	});
	
})(this);
