/**
 * Navi-X plugin for showtime by facanferff (Fábio Ferreira / facanferff.showtime@hotmail.com)
 *
 *  Copyright (C) 2012-2014 facanferff, lprot
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
    var PREFIX = "navi-x";
    var plxVersion = 8;
    var version = '1.1';
    var nxserver_URL = "navixtreme.com";
    var logo = plugin.path + "logo.png";

    var downloader = new Downloader();
    var store = new Store();
    var imdb = new IMDB();
    var server = new Server();
    var playlist;
  
    var home_URL = 'http://navi-x.googlecode.com/svn/trunk/Playlists/home.plx';

    // stores
    var report_processors = plugin.createStore('report_processors', true);
    var user_playlists = plugin.createStore('user_playlists', true);
    var user_settings = plugin.createStore('user_settings', true);
    var reports_ids = plugin.createStore('reports_ids', true);

    // stores - playlists
    store.history = plugin.createStore('playlists/history', true);
    store.favorites = plugin.createStore('playlists/favorites', true);

    // stores - configuration
    store.homeitems = plugin.createStore('playlists/homeitems', true);

    if (!store.history.list) {
        store.history.version = "1";
        store.history.background = "http://www.navixtreme.com/images/backgrounds/bkg_navix_bh_plain.jpg";
        store.history.title = "Navi-X » Local History";
        store.history.list = "[]";
    }

    if (!store.favorites.list) {
        store.favorites.version = "1";
        store.favorites.background = "http://www.navixtreme.com/images/backgrounds/bkg_navix_bh_plain.jpg";
        store.favorites.title = "Navi-X » Local Favorites";
        store.favorites.list = "[]";
    }

    if (!store.homeitems.list) {
        store.homeitems.version = "1";
        store.homeitems.background = "http://www.navixtreme.com/images/backgrounds/bkg_navix_bh_plain.jpg";
        store.homeitems.title = "Navi-X » Home Items";
        store.homeitems.list = "[]";
    }
  
    var service = plugin.createService("Navi-X", "navi-x:start", "video", true, logo);

    var settings = plugin.createSettings("Navi-X", logo, "Navi-X: Online Media Resources");

    settings.createInfo("info", logo,
        "Plugin developed by facanferff. Create your playlists on http://www.navixtreme.com/");

    settings.createDivider('General Settings');

    settings.createString("homeUrl", "Home Page URL", home_URL, function(v) {
        home_URL = v;
    });

    settings.createDivider('Action Settings');

    settings.createAction("cleanLocalPlaylists", "Clean All Local Playlists", function () {
        store.history.list = "[]";
        store.favorites.list = "[]";
        store.homeitems.list = "[]";
    });

    settings.createAction("cleanLocalHistoryPlaylist", "Clean Local History", function () {
        store.history.list = "[]";
    });

    settings.createAction("cleanLocalFavoritesPlaylist", "Clean Local Favorites", function () {
        store.favorites.list = "[]";
    });

    settings.createAction("cleanLocalHomeItemsPlaylist", "Clean Local Home Items", function () {
        store.homeitems.list = "[]";
    });

    settings.createDivider('User Interface');

    settings.createBool("backgroundEnabled", "Background", true, function(v) { service.backgroundEnabled = v; });
    settings.createBool("customViews", "Custom Views", false, function(v) { service.customViews = v; });

    settings.createDivider('Processor Settings');

    settings.createBool("cachingProcessors", "Cache Processors (only for those cacheable)", true, function (v) { service.cachingProcessors = v; });
    settings.createBool("verbose", "Verbose mode", false, function (v) { service.verbose = v; });

    settings.createDivider('User Settings (only functional if authenticated)');

    settings.createBool("enableLogin", "Enable Login", true, function (v) {
        service.enableLogin = v;
    });
    settings.createBool("adultContent", "Adult Content", false, function (v) { service.adult = v; });

    settings.createAction("login", "Login to http://navixtreme.com", function () {
        try {
            server.init();
            if (server.login()) {
                showtime.notify("Authenticated succesfully", 2);
                server.adultContent();
            }
        }
        catch (ex) { e(ex); showtime.notify('Error while authenticating and parsing default playlists', 2); }
    });
    
    settings.createDivider('Tracking Settings');

    settings.createBool("historyTracking", "Enable History Tracking (local, My History in Navi-X's homepage)", true, function (v) { service.historyTracking = v; });
    
    plugin.addURI(PREFIX + ":text:(.*):(.*)", function(page, title, url) {
        page.type = "item";
        page.metadata.background = plugin.path + "views/img/background.png";
    
        var content = showtime.httpGet(unescape(url)).toString();
        page.appendPassiveItem("bodytext", new showtime.RichText(content));
    
        page.metadata.title = unescape(title)
    
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":playlist:(.*):(.*)", function(page, type, url) {
        page.metadata.background = plugin.path + "views/img/background.png";
        page.loading = true;

        if (service.customViews) {
            addPageOptions(page); // Page Menu
            page.metadata.glwview = plugin.path + "views/array.view";
        }

        page.type = "directory";

        var mediaitem = new MediaItem();
        mediaitem.type = unescape(type);
        mediaitem.URL = unescape(url);

        playlist = new Playlist(page, mediaitem.URL, mediaitem);
        var result = playlist.loadPlaylist(mediaitem.URL);

        page.loading = false;

        showtime.trace(result.message);

        if (result.error)
            page.error(result.message);
    });

    plugin.addURI(PREFIX + ":playlist:(.*):list_processor:(.*)", function (page, type, processor) {
        page.loading = true;

        if (service.customViews)
            addPageOptions(page);

        page.type = "directory";

        var mediaitem = new MediaItem();
        mediaitem.type = unescape(type);
        mediaitem.list_processor = unescape(processor);

        playlist = new Playlist(page, null, mediaitem);
        var result = playlist.loadPlaylist(null);

        page.loading = false;

        showtime.trace(result.message);

        if (result.error)
            page.error(result.errorMsg);
    });

    plugin.addURI(PREFIX + ":video:(.*):(.*):(.*):(.*)", function (page, id, title, url, proc) {
        title = unescape(title).replace(/\[COLOR.*?\]/g, '').replace(/\[\/COLOR.*?\]/g, '');
        page.type = "directory";
        page.contents = "list";
        var video = unescape(url);

        if (playlist)
            var item = playlist.list[id];

        if (proc && proc != 'undefined') {
            var mediaitem = new MediaItem();
            mediaitem.URL = unescape(url);
            mediaitem.processor = unescape(proc);

            var processor = new Processor(mediaitem);

            processor.NIPL.vars['s_url'] = mediaitem.URL;
            var result = processor.getUrl(page, mediaitem);
        }

        page.loading = false;

        if (proc && proc != 'undefined' && result.error) {
            showtime.trace(result.message);
            page.error(result.message);
        } else {
            if (service.historyTracking == "1") {
                var name = title;
                store.add_to_playlist("history", item);
            }

            if (proc && proc != 'undefined') {
                showtime.trace(result.message);
                video = result.video;
            }

            var url_end = video.indexOf('|');
            if (url_end != -1)
                video = video.slice(0, url_end);

            var videoparams = {
                title: title,
                sources: [{
	            url: video
	        }],
                no_fs_scan: true,
                subtitles: []
            };

            if (playlist) {
                for (var i in playlist.list[id]) {
                    if (i.slice(0, 9) == 'subtitle.') {
                        videoparams.subtitles.push({
                            url: item[i],
                            language: i.slice(9)
                        });
                    }
                }
            }
            page.source = "videoparams:" + showtime.JSONEncode(videoparams);
            page.type = "video";
        }
    });

    plugin.addURI(PREFIX + ":playlist:screen", function (page) {
        page.type = "item";

        if (service.backgroundEnabled == "1") {
            page.metadata.background = playlist.background;
            page.metadata.backgroundAlpha = 0.3;
        }

        page.metadata.logo = playlist.thumb;
        page.metadata.icon = playlist.thumb;
        page.metadata.title = playlist.title;

        page.appendPassiveItem("label", new showtime.RichText(playlist.title),{title: "Name"});
        page.appendPassiveItem("label", new showtime.RichText(playlist.type), {title: "Type"});
        if (playlist.date)
            page.appendPassiveItem("label", new showtime.RichText(playlist.date), {title: "Date"});

        if (playlist.rating && playlist.rating != '-1.00')
            page.appendPassiveItem("rating", parseFloat(playlist.rating) * 2 * 10);
    
        if (playlist.bodytext) {
            page.appendPassiveItem("divider");  
            page.appendPassiveItem("bodytext", new showtime.RichText(item.overview));
        }
    
        playlist.URL = playlist.path;

        if (!store.exist_in_playlist('favorites', playlist).found)
            page.appendAction("pageevent", "addFavorite", true, { title: 'Add Favorite' });
        else
            page.appendAction("pageevent", "removeFavorite", true, { title: 'Remove Favorite' });

        page.onEvent('addFavorite', function () {
            if (store.add_to_playlist("favorites", playlist))
                showtime.notify('Navixtreme: Entry was added syccesfully to the playlist Favorites.', 3);
            else
                showtime.notify('Navixtreme: There was one error while trying to add this entry to the playlist', 3);
        });

        page.onEvent('removeFavorite', function () {
            if (store.remove_from_playlist("favorites", playlist))
                showtime.notify('Entry was removed syccesfully to the playlist Favorites.', 3);
            else
                showtime.notify('There was one error while trying to remove this entry to the playlist', 3);
        });
	
        page.loading = false;
    });

    function Playlist(page, filename, mediaitem) {
        //defaults
        this.version = '-1';

        this.page = page;
        this.mediaitem = mediaitem;

        this.path = filename;

        this.list = [];

        // Render page or not
        this.render = true;

        this.background = mediaitem.background; 
        this.logo = 'none';
        if (this.mediaitem.thumb != 'default')
            this.logo = this.mediaitem.thumb;
        //
        this.title = '';
        this.type = 'playlist';
        this.description = '';
        this.view = this.mediaitem.view;
        this.processor = this.mediaitem.processor;
        this.playmode = 'default';

        this.start_index = 0;

        // TODO: Pagination
        //this.start_index = 0;

        this.parseSearch = function() {
            var search = showtime.textDialog('Search: ' + this.mediaitem.name, true, false);

            var result = {};
			
            if (search.rejected) {
                result.error = true;
                result.errorMsg = 'User cancelled search.';
                return result;
            }
            var searchstring = search.input;
            showtime.trace(searchstring);
            if (searchstring.length == 0) {
                result.error = true;
                result.errorMsg = 'Empty search string.';
                return result;
            }
    
            //get the search type:
            var index = this.mediaitem.type.indexOf(":");
            var search_type;
            if (index != -1)
                search_type = item.type.slice(index+1);
            else
                search_type = '';
		
            var fn;
            var mediaitem;
		
            //youtube search
            if (this.mediaitem.type == 'search_youtube') {
                fn = searchstring.replace(/ /g,'+');
                var URL = '';
                if (item.URL != '')
                    URL = this.mediaitem.URL;
                else
                    URL = 'http://gdata.youtube.com/feeds/base/videos?max-results=50&alt=rss&q=';
                URL = URL + fn;
                // Use for now Published sort by default
                URL = URL + '&orderby=published';
			   
                this.mediaitem=new MediaItem();
                this.mediaitem.URL = URL;
                this.mediaitem.type = 'rss:video';
                this.mediaitem.name = 'Search results: ' + searchstring;
                this.mediaitem.processor = this.mediaitem.processor;
                return this.loadPlaylist(this.mediaitem.URL);
            }
            else { //generic search
                fn = searchstring.replace(/ /g,'+');   
                var URL = this.mediaitem.URL;
                var proc = this.mediaitem.list_processor;
                this.mediaitem = new MediaItem();
                this.mediaitem.URL = URL + fn;
                this.path = this.mediaitem.URL;
                if (search_type != '')
                    this.mediaitem.type = search_type;
                else //default
                    this.mediaitem.type = 'playlist';
					
                this.mediaitem.name = 'Search results: ' + searchstring;
                if (proc) {
                    p("TEST");
                    this.mediaitem.list_processor = proc + searchstring;
                    return this.loadPlaylist(null);
                }
                //else return this.loadPlaylist(this.mediaitem.URL);
                return this.parsePLX();
            }

            return -1;
        }

        this.parsePLX = function() {
            var result = {};
            var content = "";

            if (this.content) {
                content = this.content;
            }
            else if (this.path.slice(0, 8) != "store://") {
                content = downloader.getRemote(this.path);

                if (content.error) {
                    result.error = true;
                    return result;
                }
            }
            else {
                var file = eval(store[this.path.slice(8)]);
                if (file.list == "[]") {
                    result.error = false;
                    return result;
                }
                for (var i in file) {
                    try {
                        p(file[i]);
                        this[i] = eval(file[i]);
                    }
                    catch (ex) { 
                        e(ex);
                        continue; 
                    }
                }
                result.error = false;
                return result;
            }

            if (content == "") {
                result.error = true;
                result.errorMsg = content.error;
                return result;
            }
            if (this.path != "local" && this.path.slice(0, 8) != "store://") {
                content = content.response;
            }

            content = content.split(/\r?\n/);

            //parse playlist entries 
            var counter = 0;
            var state = 0;
            var tmp='';
            var previous_state = 0;
		
            var key = '';
            var value = '';
            var index = -1;

            for (var i in content) {
                var m = content[i];
                if (state == 2) //parsing description field
                {
                    index = m.indexOf('/description');
                    if (index != -1)
                    {
                        this.description = this.description + "\n" + m.slice(0, index);
                        state = 0;
                    }
                    else
                        this.description = this.description + "\n" + m;
                }
                else if (state == 3) //parsing description field
                {
                    index = m.indexOf('/description');
                    if (index != -1)
                    {
                        tmp.description = tmp.description + "\n" + m.slice(0, index);
                        state = 1;
                    }
                    else
                        tmp.description = tmp.description + "\n" + m;
                }
                else if (state == 4) //multiline comment
                {
                    if (m.slice(0,3) == '"""')
                        state = previous_state;
                }
                else if (m && m[0] != '//')
                {
                    if (m.slice(0,3) == '"""')
                    {
                        previous_state = state;
                        state = 4; //muliline comment state
                        continue; //continue with next line
                    }
                    if (m[0] == '#') {
                        var id = parseInt(m.slice(2));

                        if (id) {
                            if (state == 1)
                                this.list.push(tmp);
                            else //state=0                        
                                this.list.splice(0, this.list.length);

                            tmp = new MediaItem(); //create new item
                            tmp.id = id;

                            counter = counter + 1;
                            state = 1;
                        }
                    }

                    index = m.indexOf('=');
                    if (index != -1)
                    {
                        key = m.slice(0, index);
                        value = m.slice(index+1, m.length);
                        if (key == 'version' && state == 0)
                        {
                            this.version = value;
                            //check the playlist version
                            if (parseInt(this.version) > parseInt(plxVersion))
                                return -1 //invalid
                            else
                                this.list.splice(0, this.list.length);
                        }
                        else if (key == 'description' && state == 0)
                        {
                            index = value.indexOf('/description');
                            if (index != -1)
                                this.description=value.slice(0,index);
                            else
                            {
                                this.description=value;
                                state = 2; //description on more lines
                            }
                        }
                        else if (key == 'type') {
                            if (!tmp.id) {
                                if (state == 1)
                                    this.list.push(tmp);
                                else //state=0                        
                                    this.list.splice(0, this.list.length);
                            }
                            tmp = new MediaItem(); //create new item
                            counter = counter + 1;
                            state = 1;

                            tmp.type = value;
                            if (tmp.type == 'video' || tmp.type == 'audio') {
                                tmp.processor = this.processor;
                            }
                        }
                        else if (key == 'description') {
                            //this.description = ' ' //this will make the description field visible
                            index = value.indexOf('/description');
                            if (index != -1)
                                tmp.description = value.slice(0, index);
                            else {
                                tmp.description = value;
                                state = 3; //description on more lines 
                            }
                        }
                        else if (state == 0)
                            this[key] = value;
                        else if (state == 1)
                            tmp[key] = value;
                    }
                }
            }
		
            if ((state == 1) || (previous_state == 1))
                this.list.push(tmp);

            showtime.trace('Playlist: Parsed ' + this.list.length + ' items');
		
            result.error = false;
            return result;
        };

        this.parseRSS = function() {
            var result = {};

            if (this.path.slice(0,6) == 'rss://')
                this.path = this.path.replace('rss:', 'http:')

            var content = downloader.getRemote(this.path).response;

            if (content == "") {
                result.error = true;
                result.errorMsg = "Input playlist is empty.";
                return result;
            }

            content = content.split('<item');

            //parse playlist entries 
            var counter = 0;
            var state = 0;
            var tmp='';
            var previous_state = 0;
		
            var key = '';
            var value = '';
            var index = -1;

            //set the default type
            var index = mediaitem.type.indexOf(":")
            var type_default;
            if (index != -1)
                type_default = mediaitem.type.slice(index+1);
            else
                type_default = '';
		
            var counter = 0;
    
            //parse playlist entries 
            for (var i in content) {
                var m = content[i];
                if (counter == 0) {
                    //fill the title
                    index = m.indexOf('<title>');
                    if (index != -1) {
                        var index2 = m.indexOf('</title>');
                        if (index != -1) {
                            var value = m.slice(index+7,index2);
                            this.title = value;
                        }
                    }

                    index = m.indexOf('<description>');
                    if (index != -1) {
                        index2 = m.indexOf('</description>');
                        if (index2 != -1) {
                            value = m.slice(index+13,index2);
                            this.description = value;
                            var index3 = this.description.indexOf('<![CDATA[');
                            if (index3 != -1)
                                this.description = this.description.slice(9,this.description-3);
                        }
                    }
				
                    //fill the logo
                    index = m.indexOf('<image>');
                    if (index != -1) {
                        index2 = m.indexOf('</image>');
                        if (index != -1) {
                            index3 = m.indexOf('<url>', index, index2);
                            if (index != -1) {
                                var index4 = m.indexOf('</url>', index, index2);
                                if (index != -1)
                                    value = m.slice(index3+5,index4);
                                this.logo = value;
                            }
                        }
                    }
                    else { //try if itunes image
                        index = m.indexOf('<itunes:image href="');
                        if (index != -1) {
                            index2 = m.indexOf('"', index+20);
                            if (index != -1) {
                                value = m.slice(index+20,index2);
                                this.logo = value;
                            }
                        }
                    }
	   
                    counter++;
                }
                else {
                    var tmp = new MediaItem(); //create new item
                    tmp.processor = this.processor;

                    //get the publication date.
                    /*index = m.indexOf('<pubDate')
				if (index != -1) {
					index2 = m.indexOf('>', index)
					if (index2 != -1) {
						index3 = m.indexOf('</pubDate')
						if (index3 != -1) {
							index4 = m.indexOf(':', index2, index3)
							if (index4 != -1) {
								value = m.slice(index2+1,index4-2)
								value = value.replace('\n',"") 
								tmp.date = value
							}
						}
					}
				}*/

                    //get the title.
                    index = m.indexOf('<title');
                    if (index != -1) {
                        index2 = m.indexOf('>', index);
                        if (index2 != -1) {
                            index3 = m.indexOf('</title>');
                            if (index3 != -1) {
                                index4 = m.indexOf('![CDATA[', index2, index3);
                                if (index4 != -1)
                                    value = m.slice(index2+10,index3-3);
                                else
                                    value = m.slice(index2+1,index3);
                                value = value.replace('\n'," '");                         
                                tmp.name = tmp.name + value;
                            }
                        }
                    }
											 
                    //get the description.
                    var index1 = m.indexOf('<content:encoded>');
                    index = m.indexOf('<description>');
                    if (index1 != -1) {
                        index2 = m.indexOf('</content:encoded>');
                        if (index2 != -1) {
                            value = m.slice(index1+17,index2);
                            //value = value.replace('&#39;',"\'");   
                            tmp.description = value;
                            index3 = tmp.description.indexOf('<![CDATA[');
                            if (index3 != -1)
                                tmp.description = tmp.description.slice(9,-3);
                        }
                    }
                    else if (index != -1) {
                        index2 = m.indexOf('</description>');
                        if (index2 != -1) {
                            value = m.slice(index+13,index2);
                            //value = value.replace('&#39;',"\'"); 
                            tmp.description = value;
                            index3 = tmp.description.indexOf('<![CDATA[');
                            if (index3 != -1)
                                tmp.description = tmp.description.slice(9,-3);
                        }
                    }

                    //get the thumb
                    index = m.indexOf('<media:thumbnail');
                    if (index != -1) {
                        index2 = m.indexOf('url=', index+16);
                        if (index2 != -1) {
                            index3 = m.indexOf('"', index2+5);
                            if (index3 != -1) {
                                value = m.slice(index2+5,index3);
                                tmp.thumb = value;
                            }
                        }
                    }
							
                    if (tmp.thumb == 'default') {
                        //no thumb image found, therefore grab any jpg image in the item
                        index = m.indexOf('.jpg');
                        if (index != -1) {
                            index2 = m.lastIndexOf('http', 0, index);
                            if (index2 != -1) {
                                value = m.slice(index2,index+4);
                                tmp.thumb = value;
                            }
                        }
                    }
				
                    //get the enclosed content.
                    index = m.indexOf('enclosure');
                    index1 = m.indexOf ('<media:content');
                    if (((index != -1) || (index1 != -1))) { // and (tmp.processor==''):
                        //enclosure is first choice. If no enclosure then use media:content
                        if ((index == -1) && (index1 != -1))
                            index = index1;
                        index2 = m.indexOf('url="',index); //get the URL attribute
                        if (index2 != -1)
                            index3 = m.indexOf('"', index2+5);
                        else {
                            index2 = m.indexOf("url='",index);
                            if (index2 != -1)
                                index3 = m.indexOf("'", index2+5);
                        }
                        if ((index2 != -1) && (index3 != -1))
                            value = m.slice(index2+5,index3);
                        tmp.URL = value;
					
                        //get the media type
                        if (type_default != '')
                            tmp.type = type_default;

                        if (tmp.type == 'unknown') {  
                            index2 = m.indexOf('type="',index); //get the type attribute
                            if (index2 != -1) {
                                index3 = m.indexOf('"', index2+6);
                                if (index3 != -1) {
                                    var type = m.slice(index2+6,index3);
                                    if (type.slice(0,11) == 'application')
                                        tmp.type = 'download';
                                    else if (type.slice(0,5) == 'video')
                                        tmp.type = 'video';
                                }
                            }
                        }
						
                        if ((tmp.type == 'unknown') && (tmp.URL != '')) { //valid URL found
                            //validate the type based on file extension
                            var ext_pos = tmp.URL.lastIndexOf('.'); //find last '.' in the string
                            if (ext_pos != -1) {
                                var ext = tmp.URL.slice(ext_pos+1)
                                ext = ext.toLowerCase();
                                if (ext == 'jpg' || ext == 'gif' || ext == 'png')
                                    tmp.type = 'image';
                                else if (ext == 'mp3')
                                    tmp.type = 'audio';
                                else
                                    tmp.type = 'video';
                            }
                        }
                    }
                    if ((tmp.type == 'unknown') || (tmp.processor != '')) {
                        //else: //no enclosed URL and media content or the processor tag has been set, use the link
                        index = m.indexOf('<link>');
                        if (index != -1) {
                            index2 = m.indexOf('</link>', index+6);
                            if (index2 != -1) {
                                value = m.slice(index+6,index2);
                                tmp.URL = value;
						
                                //get the media type
                                if (type_default != '')
                                    tmp.type = type_default;
                                else if (value.slice(0,6) == 'rss://')
                                    tmp.type = 'rss';               
                                else
                                    tmp.type = 'html';
                            }
                        }
                    }

                    if (tmp.URL != '') {
                        this.list.push(tmp);
                        counter += 1;
                    }
                }
            }
		
            result.error = false;
            return result;
        }

        this.parseATOM = function() {
            var result = {};

            var content = downloader.getRemote(this.path).response;

            if (content == "") {
                result.error = true;
                result.errorMsg = "Input playlist is empty.";
                return result;
            }

            content = content.split('<entry');
        
            //parse playlist entries 
            var counter = 0;
            var state = 0;
            var tmp='';
            var previous_state = 0;
		
            var key = '';
            var value = '';
            var index = -1;

            //set the default type
            var index = mediaitem.type.indexOf(":")
            var type_default;
            if (index != -1)
                type_default = mediaitem.type.slice(index+1);
            else
                type_default = '';
		
            var counter = 0;
		
            //parse playlist entries 
            for (var i in content) {
                var m = content[i];
                if (counter == 0) {
                    //fill the title
                    index = m.indexOf('<title>');
                    if (index != -1) {
                        var index2 = m.indexOf('</title>');
                        if (index != -1) {
                            var value = m.slice(index+7,index2);
                            this.title = value;
                        }
                    }

                    index = m.indexOf('<subtitle');
                    if (index != -1) {
                        index2 = m.indexOf('</subtitle>');
                        if (index2 != -1) {
                            value = m.slice(index+13,index2);
                            this.description = value;
                            var index3 = this.description.indexOf('<![CDATA[');
                            if (index3 != -1)
                                this.description = this.description.slice(9,-3);
                        }
                    }
				
                    //fill the logo
                    index = m.indexOf('<logo>');
                    if (index != -1) {
                        index2 = m.indexOf('</logo>');
                        if (index2 != -1) {
                            index3 = m.indexOf('http', index, index2);
                            if (index3 != -1) {
                                var index4 = m.indexOf('</', index3, index2+2);
                                if (index4 != -1) {
                                    value = m.slice(index3,index4);
                                    this.logo = value;
                                }
                            }
                        }
                    }

                    //fill the logo
                    index = m.indexOf('<icon>');
                    if (index != -1) {
                        index2 = m.indexOf('</icon>');
                        if (index2 != -1) {
                            index3 = m.indexOf('http', index, index2);
                            if (index3 != -1) {
                                index4 = m.indexOf('</', index3, index2+2);
                                if (index4 != -1) {
                                    value = m.slice(index3,index4);
                                    this.logo = value;
                                }
                            }
                        }
                    }
 
                    counter += 1;
                }
                else {
                    var tmp = new MediaItem(); //create new item
                    tmp.processor = this.processor;

                    //get the publication date.
                    index = m.indexOf('<published');
                    if (index != -1) {
                        index2 = m.indexOf('>', index);
                        if (index2 != -1) {
                            index3 = m.indexOf('</published');
                            if (index3 != -1) {
                                index4 = m.indexOf(':', index2, index3);
                                if (index4 != -1) {
                                    value = m.slice(index2+1,index4-3);
                                    value = value.replace('\n',"");
                                    tmp.name = value;
                                }
                            }
                        }
                    }
								
                    //get the publication date.
                    index = m.indexOf('<updated');
                    if (index != -1) {
                        index2 = m.indexOf('>', index);
                        if (index2 != -1) {
                            index3 = m.indexOf('</updated');
                            if (index3 != -1) {
                                index4 = m.indexOf(':', index2, index3);
                                if (index4 != -1) {
                                    value = m.slice(index2+1,index4-3);
                                    value = value.replace('\n',"");
                                    tmp.name = value;
                                }
                            }
                        }
                    }
								
                    //get the title.
                    index = m.indexOf('<title');
                    if (index != -1) {
                        index2 = m.indexOf('>', index);
                        if (index2 != -1) {
                            index3 = m.indexOf('</title>');
                            if (index3 != -1) {
                                index4 = m.indexOf('![CDATA[', index2, index3);
                                if (index4 != -1)
                                    value = m.slice(index2+10,index3-3);
                                else
                                    value = m.slice(index2+1,index3);
                                value = value.replace('\n'," '");                         
                                tmp.name = tmp.name + ' ' + value;
                            }
                        }
                    }
											 
                    //get the description.
                    index = m.indexOf('<summary');
                    if (index != -1) {
                        index2 = m.indexOf('>', index);
                        if (index2 != -1) {
                            index3 = m.indexOf('</summary');
                            if (index3 != -1) {
                                value = m.slice(index2+1,index3);
                                value = value.replace('\n',"");
                                tmp.description = value;
                            }
                        }
                    }

                    if (tmp.description == '' && tmp.name != '')
                        tmp.description = tmp.name;

                    //get the thumb
                    index = m.indexOf('<link type="image');
                    if (index != -1) {
                        index2 = m.indexOf('href=', index+16);
                        if (index2 != -1) {
                            index3 = m.indexOf('"', index2+6);
                            if (index3 != -1) {
                                value = m.slice(index2+6,index3);
                                tmp.thumb = value;
                            }
                        }
                    }

                    if (tmp.thumb == 'default') {
                        //no thumb image found, therefore grab any jpg image in the item
                        index = m.indexOf('.jpg');
                        if (index != -1) {
                            index2 = m.rfind('http', 0, index);
                            if (index2 != -1) {
                                value = m.slice(index2,index+4);
                                tmp.thumb = value;
                            }
                        }
                    }

                    //get the enclosed content.
                    index = m.indexOf('<link rel="enclosure');  
                    if (index == -1) {
                        index = m.indexOf('<link');
                    }
                    else {
                        index2 = m.indexOf('href=',index); //get the URL attribute
                        if (index2 != -1) {
                            index3 = m.indexOf(m[index2+5], index2+6);
                            if (index3 != -1) {
                                value = m.slice(index2+6,index3);
                                tmp.URL = value;
                            }
                        }
										  
                        //get the media type
                        if (type_default != '')
                            tmp.type = type_default;

                        if (tmp.type == 'unknown') {  
                            index2 = m.indexOf('type="',index); //get the type attribute
                            if (index2 != -1) {
                                index3 = m.indexOf('"', index2+6);
                                if (index3 != -1) {
                                    var type = m.slice(index2+6,index3);
                                    if (type.slice(0,11) == 'application')
                                        tmp.type = 'download';
                                    else if (type.slice(0,5) == 'video')
                                        tmp.type = 'video';
                                }
                            }
                        }
						
                        if ((tmp.type == 'unknown') && (tmp.URL != '')) {//valid URL found
                            //validate the type based on file extension
                            var ext_pos = tmp.URL.lastIndexOf('.'); //find last '.' in the string
                            if (ext_pos != -1) {
                                var ext = tmp.URL.slice(ext_pos+1);
                                ext = ext.toLowerCase();
                                if (ext == 'jpg' || ext == 'gif' || ext == 'png')
                                    tmp.type = 'image';
                                else if (ext == 'mp3')
                                    tmp.type = 'audio';
                                else
                                    tmp.type = 'html';
                            }
                        }
                    }
													   
                    if (tmp.URL != '') {
                        this.list.push(tmp);
                        counter++;
                    }
                }
            }
					
            result.error = false;
            return result;
        }

        this.parseFlickr = function() {
            var result = {};

            var content = downloader.getRemote(this.path).response;

            if (content == "") {
                result.error = true;
                result.errorMsg = "Input playlist is empty.";
                return result;
            }

            content = content.split('<item ');
        
            var counter = 0;

            //parse playlist entries 
            for (var i in content) {
                var m = content[i];
                if (counter == 0) {
                    //fill the title
                    var index = m.indexOf('<title>');
                    if (index != -1) {
                        var index2 = m.indexOf('</title>');
                        if (index != -1) {
                            var value = m.slice(index + 7, index2);
                            this.title = value;
                        }
                    }
                
                    counter += 1;
                }
                else {
                    //get the title.
                    index = m.indexOf('<title>');
                    if (index != -1) {
                        index2 = m.indexOf('</title>', index);
                        if (index2 != -1) {
                            value = m.slice(index + 7, index2);
                            var name = value;
                        }
                    }

                    //get the enclosed content.
                    var items = 0;
                    index = m.indexOf('<description>');
                    if (index != -1) {
                        index2 = m.indexOf('</description>', index);
                        if (index2 != -1) {
                            var index3 = m.indexOf('src=', index);
                            while (index3 != -1) {
                                var index4 = m.indexOf('"', index3 + 5);
                                if (index4 != -1) {
                                    var tmp = new MediaItem(); //create new item
                                    tmp.type = 'image';
                                    if (items > 0)
                                        tmp.name = name + " " + (items+1);
                                    else
                                        tmp.name = name;
                            
                                    value = m.slice(index3 + 5, index4 - 4);
                                    if (value[value.length - 6] == '_')
                                        value = value.slice(0, value.length - 6) + ".jpg";
                                    tmp.URL = value;
                                    tmp.thumb = tmp.URL.slice(0, tmp.URL.length - 4) + "_m" + ".jpg";
                                
                                    this.list.push(tmp);
                                    counter += 1;

                                    items += 1;
                                    index3 = m.indexOf('src=', index4);
                                }
                            }
                        }
                    }
                }
            }
                
            return 0;
        }

        /*
            Load a playlist and if this.render == true, render to page, return one object as result
        */
        this.loadPlaylist = function(filename, showErrors) {
            var init = new Date();

            if (filename != '')
                this.path = filename;
            else
                this.path = this.mediaitem.URL;

            var type = GetType(this.mediaitem, 0);

            var result = {};
            
            if (type == "search" && this.mediaitem.list_processor) {
                var search = showtime.textDialog('Search: ' + this.mediaitem.name, true, false);

                var result = {};

                if (search.rejected) {
                    result.error = true;
                    result.errorMsg = 'User cancelled search.';
                    return result;
                }
                var searchstring = search.input;
                showtime.trace(searchstring);
                if (searchstring.length == 0) {
                    result.error = true;
                    result.errorMsg = 'Empty search string.';
                    return result;
                }

                this.mediaitem.list_processor += searchstring;
                type = "playlist";
                this.path = "local";
            }
            if (type == "playlist" && this.mediaitem.list_processor) {
                mediaitem.processor = this.mediaitem.list_processor;

                var processor = new Processor(mediaitem);

                processor.NIPL.vars['s_url'] = mediaitem.URL;
                var result = processor.getUrl(page, mediaitem);
                this.content = result.playlist;
                this.path = "local";
            }

            //load the playlist  
            if (type == 'rss_flickr_daily') 
                result = this.parseFlickr();         
            else if (type.slice(0,3) == 'rss')
                result = this.parseRSS();
            else if (type.slice(0,4) == 'atom')
                result = this.parseATOM();
            else if (type == 'imdb_list')
                result = imdb.getList(this.path);
            else if (type == 'search')
                result = this.parseSearch();
            /*else if (type == 'opml')
                result = playlist.load_opml_10(URL, mediaitem)*/
            else //assume playlist file
                result = this.parsePLX();
				
            /*if (result == -1) { //error
                result.message = "This playlist requires a newer Navi-X version";
                return result;
            }
            else if (result == -2) { //error
                result.message = "Cannot open file.";
                return result;
            }*/
				
            if (result.error) { //failure 
                result.message = 'NAVI-X: Failed to parse playlist';
                return result;
            }

            result.message = 'NAVI-X: Parsed playlist succesfully';

            if (this.render == true)
                this.showPage(type, showErrors);

            return result;
        }

        this.showPage = function(type, showErrors) {
            this.type = type;
			
            //remove the [COLOR] tags from the name
            var t = this.title.replace(/\[COLOR.*?\]/g, '').replace(/\[\/COLOR.*?\]/g, '');
            page.metadata.title = new showtime.RichText(t);

            if (t.toLowerCase().indexOf("movie") != -1 || t.toLowerCase().indexOf("films") != -1) {
                page.metadata.childTilesX = 6;
                page.metadata.childTilesY = 2;
            }
			
            //set the background image   
            if (this.verbose)
                showtime.print("Background: " + this.background);
            if (service.backgroundEnabled == "1" && this.background != "default" && this.background != "previous") {
                var m = this.background;
                page.metadata.background = m;
                page.metadata.backgroundAlpha = 0.3;
            }
			
            /*m = this.logo;
            page.metadata.logo = m;*/
			
            /*var newview = SetListView(playlist.view);
            page.contents = newview;*/
			
            //Display the playlist page
            var page_size = 200;
            this.showPageRender(page, this.start_index / page_size, this.start_index % page_size, showErrors); 
			
            return 0; //success
        }

        this.showPageRender = function(page, current_page, start_pos, showErrors)
        {
            if (showErrors == undefined) showErrors = true;
            this.current_page = current_page;

            var today=new Date();
            var n=0;
            var page_size = 200;

            var playlist_details = this.path.match('playlist/([0-9]*)/(.+?).plx');

            this.name = this.title;

            if (playlist_details) {
                this.id = playlist_details[1];
                this.name = playlist_details[2];
            }

            /*page.appendItem(PREFIX + ':playlist:screen', "directory", {
                title: new showtime.RichText('Playlist Features')
            });*/

            if (!this.list) {
                if (showErrors)
                    page.error("Invalid result.");
                return;
            }

            if (this.list.length == 0) {
                if (showErrors)
                    page.error("No entries in this playlist.");
                return;
            }

            for (var i = current_page*page_size; i < this.list.length; i++)
            {
                var m = this.list[i];
                if (parseInt(m.version) <= parseInt(plxVersion)) {
                    if (server && !server.authenticated() && m.URL === 'My Playlists' || m.URL === 'http://www.navixtreme.com/playlist/mine.plx')
                        continue;

                    if (m.type === 'window' || m.type === 'html')
                        continue;

                    var cover = m.thumb;
                    if (cover == "default") cover = null;

                    var label2 = '';
                    if (m.date != '') {
                        try {
                            var dt = m.date.split()
                            var size = dt.length
                            var dat = dt[0].split('-')
                            var tim;
                            if (size > 1)
                                tim = dt[1].split(':')
                            else
                                tim = ['00', '00', '00']

                            var entry_date = new Date(dat[0], dat[1], dat[2], tim[0], tim[1], tim[2])
                            var days_past = (today.getDate() - entry_date.getDate())
                            var hours_past = Math(today.getHours() - entry_date.getHours())
                            if ((size > 1) && (days_past == 0) && (hours_past < 24))
                                label2 = 'New ' + hours_past + ' hrs ago';
                            else if (days_past <= 10)
                                if (days_past == 0)
                                    label2 = 'New Today'
                                else if (days_past == 1)
                                    label2 = 'New Yesterday'
                                else
                                    label2 = 'New ' + days_past + ' days ago'
                            else if (this.playlist.type != 'playlist')
                                label2 = m.date.slice(0, 10);
                        }
                        catch (err) {
                            e(err);
                            showtime.trace("ERROR: Playlist contains invalid date at entry:  " + (n + 1));
                        }
                    }

                    var link = m.URL;

                    if (link === 'My Playlists') {
                        link = 'http://www.navixtreme.com/playlist/mine.plx';
                        m.type = 'playlist';
                        m.name = 'My Playlists';
                    }
                    else if (link === 'favorites.plx') {
                        link = "store://favorites";
                    }
                    else if (link === 'history.plx') {
                        link = "store://history";
                    }

                    var name_final_color = '';
                    var name = m.name;

                    name_final_color = parse_string_color(name, 3);

                    var playlist_link = escape(m.type);
                    playlist_link += ":" + escape(link);

                    if (!m.processor)
                        m.processor = 'undefined';

                    if (m.type == "video" && m.processor && m.processor != "undefined")
                        name_final_color += " <font color=\"5AD1B5\">[Video Processor]</font>";

                    if (m.URL.match(nxserver_URL))
                        name_final_color += " <font color=\"5AD1B5\">[NAVIXTREME]</font>";

                    var metadataTitle = new showtime.RichText(name_final_color);

                    var item;

                    switch (m.type) {
                        case "image":
                            item = page.appendItem(link, "image", { title: new showtime.RichText(name_final_color), icon: cover });
                            break;
                        case "audio":
                            item = page.appendItem(link, "audio", { title: new showtime.RichText(name_final_color), icon: cover });
                            break;
                        case "video":
                            if (link.indexOf('youtube.com') != -1) {
                                var regex = new RegExp("youtu(?:\.be|be\.com)/(?:.*v(?:/|=)|(?:.*/)?)([a-zA-Z0-9-_]+)");
                                var id = regex.exec(m.URL);
                                var subs = '';
                                if (playlist)
                                    for (var tag in playlist.list[i])
                                        if (tag.slice(0, 9) == 'subtitle.')
                                             subs += ':' + escape(tag.slice(9)) + ':' + escape(playlist.list[i][tag]);
                                item = page.appendItem('youtube:video:simple:' + escape(m.name) + ":" + escape(id[1]) + escape(subs), "directory", {
                                    title: metadataTitle,
                                    icon: cover
                                });
                            }
                            else {
                                if (m.processor != "undefined") {
                                    m.description = m.description + "\n\nProcessor: " + m.processor;
                                    item = page.appendItem(PREFIX + ':video:' + i + ':' + escape(m.name) + ':' + escape(link) + ":" + escape(m.processor), "video", {
                                        title: metadataTitle,
                                        icon: cover,
                                        description: m.description,
                                        url: link,
                                        duration: m.duration,
                                        processor: m.processor
                                    });
                                } else {
                                     var videoparams = {
                                        title: name.replace(/\[COLOR.*?\]/g, '').replace(/\[\/COLOR.*?\]/g, ''),
                                        sources: [{
	                                    url: link.match(/m3u8/) ? link = 'hls:' + link : link
	                                }],
                                        no_fs_scan: true,
                                        subtitles: []
                                     };

                                     if (playlist)
                                         for (var tag in playlist.list[i])
                                             if (tag.slice(0, 9) == 'subtitle.')
                                                  videoparams.subtitles.push({
                                                      url: playlist.list[i][tag],
                                                      language: tag.slice(9),
                                                      title: 'External subtitles'
                                             });

                                     item = page.appendItem("videoparams:" + showtime.JSONEncode(videoparams), "video", {
                                         title: metadataTitle,
                                         icon: cover,
                                         description: m.description
                                     });
                                }
                            }
                            break;
                        case "text":
                            item = page.appendItem(PREFIX + ':text:' + escape(m.name) + ':' + escape(m.URL), "directory", {
                                title: new showtime.RichText(name_final_color), icon: cover
                            });
                            break;
                        case "imdb":
                            item = page.appendItem('tmdb:movie:' + m.ID + ':2', "directory", {
                                title: new showtime.RichText(name_final_color),
                                icon: cover,
                                id: m.ID,
                                service: "IMDB"
                            });
                            break;
                        case "tmdb":
                            item = page.appendItem('tmdb:movie:' + m.ID + ':1', "directory", {
                                title: new showtime.RichText(name_final_color),
                                icon: cover,
                                id: m.ID,
                                service: "TMDB"
                            });
                            break;
                        default:
                            if (!m.list_processor) {
                                item = page.appendItem(PREFIX + ':playlist:' + playlist_link, "directory", {
                                    title: new showtime.RichText(name_final_color),
                                    icon: cover
                                });
                            }
                            else {
                                item = page.appendItem(PREFIX + ':playlist:' + m.type + ':list_processor:' + escape(m.list_processor), "directory", {
                                    title: new showtime.RichText(name_final_color + " <font color=\"5AD1B5\">[List Processor]</font>"),
                                    icon: cover
                                });
                            }
                            break;

                    }

                    item.id = i;

                    if (m.type == "video") {
                        var options = {};

                        if (m.TMDB && m.TMDB != "") {
                            options.query = m.TMDB;
                            options.mode = 1;
                        }
                        else if (m.IMDB && m.IMDB != "") {
                            options.query = m.IMDB;
                            options.mode = 2;
                        }
                        else {
                            options.query = escape(m.name);
                            options.mode = 0;
                        }

                        var source = {};
                        source.image = cover;
                        try {
                            source.title = link.match("\/\/(.+?)[\/?]")[1];
                        }
                        catch (ex) {
                            e(ex);
                            source.title = m.name;
                        }
                        if (m.processor != "undefined") {
                            source.url = PREFIX + ':video:' + i + ':' + escape(m.name) + ':' + escape(link) + ":" + escape(m.processor);
                        }
                        else {
                            source.url = link;
                        }
                        options.sources = [];
                        options.sources.push(source);

                        item.addOptURL("TMDB View", 'tmdb:movie:play:' + escape(showtime.JSONEncode(options)));
                    }

                    item.addOptSeparator("Playlists");
                    
                    if (m.type == "video" || m.type == "image" || m.type == "audio" || m.type == "playlist") {
                        var exist = store.exist_in_playlist('favorites', playlist.list[i]);
                        if (!exist.found)
                            item.addOptAction("Add to local favorites", "addFavorite");
                        else
                            item.addOptAction("Remove from local favorites", "removeFavorite");

                        item.onEvent('addFavorite', function (item) {
                            if (!store.exist_in_playlist('favorites', playlist.list[this.id]).found) {
                                if (store.add_to_playlist("favorites", playlist.list[this.id])) {
                                    showtime.notify('Entry was added syccesfully to the playlist Favorites.', 3);
                                }
                                else
                                    showtime.notify('There was one error while trying to add this entry to the playlist', 3);
                            }
                            else {
                                showtime.notify('Item was already added to Favorites.', 3);
                            }
                        });

                        item.onEvent('removeFavorite', function (item) {
                            if (store.exist_in_playlist('favorites', playlist.list[this.id]).found) {
                                if (store.remove_from_playlist("favorites", playlist.list[this.id]))
                                    showtime.notify('Entry was removed syccesfully to the playlist Favorites.', 3);
                                else
                                    showtime.notify('There was one error while trying to remove this entry to the playlist', 3);
                            }
                            else {
                                showtime.notify('The item doesn\'t exist in Favorites.', 3);
                            }
                        });

                        // Home Items
                        var exist = store.exist_in_playlist('homeitems', playlist.list[i]);
                        if (!exist.found)
                            item.addOptAction("Add to Home Items", "addHomeItem");
                        else
                            item.addOptAction("Remove from Home Items", "removeHomeItem");

                        item.onEvent('addHomeItem', function (item) {
                            if (!store.exist_in_playlist('homeitems', playlist.list[this.id]).found) {
                                if (store.add_to_playlist("homeitems", playlist.list[this.id])) {
                                    showtime.notify('Entry was added syccesfully to the playlist Home Items.', 3);
                                }
                                else
                                    showtime.notify('There was one error while trying to add this entry to the playlist', 3);
                            }
                            else {
                                showtime.notify('Item was already added to Home Items.', 3);
                            }
                        });

                        item.onEvent('removeHomeItem', function (item) {
                            if (store.exist_in_playlist('homeitems', playlist.list[this.id]).found) {
                                if (store.remove_from_playlist("homeitems", playlist.list[this.id]))
                                    showtime.notify('Entry was removed syccesfully to the playlist Home Items.', 3);
                                else
                                    showtime.notify('There was one error while trying to remove this entry to the playlist', 3);
                            }
                            else {
                                showtime.notify('The item doesn\'t exist in Home Items.', 3);
                            }
                        });
                    }
                }
            }
        }
    }

    function Processor(mediaitem) {
        this.verbose = service.verbose;
        this.NIPL = new NIPL(mediaitem);
        this.downloader = new Downloader(this);
        this.haveVideoUrl = false;
        this.error = false;
        this.message = '';
        this.source = '';

        this.phase = 1;

        this.cached = false;

        var init = new Date();

        this.ifparse = new RegExp('^([^<>=!]+)\s*([!<>=]+)\s*(.+)$');
        this.conditionExtract = new RegExp('\(\s*([^\(\)]+)\s*\)');
        this.multiIfTest = new RegExp(/^\(/);

        this.concat = function(line) {
            var regex = new RegExp('([^ ]+)[ ]([^ ]+)[ =](.+)');
            var params = regex.exec(line);

            var key = params[2];
            var value = params[3];
            var append = true;

            if (this.verbose) {
                showtime.trace('Proc debug concat:');
                showtime.print('old: ' + this.NIPL.vars[key]);
            }
        
            if (value[0] == "'") {
                value = value.slice(1);
            }
            else {
                value = this.getVariableValue(value);
            }

            this.NIPL.setValue(key, value, append);

            if (this.verbose) {
                showtime.print('new: ' + this.NIPL.vars[key]);
            }
        }

        // From NP's Megaviewer
        this.countdown = function(page, line) { 
            var regex = new RegExp('([^ ]+)[ ](.+)');
            var params = regex.exec(line);

            var time = params[2];
            if (time[0] === "'")
                time = time.slice(1);

            if (this.verbose)
                showtime.print('Loading video...');
            for (var j = 0; j < parseInt(time) ; j++) {
                page.metadata.title = this.NIPL.vars['countdown_title'] + ' - Waiting ' + (time - j) + ' seconds';
                if (this.verbose)
                    showtime.print('Waiting ' + (time - j) + ' seconds');
                showtime.sleep(1000);
            }
            page.metadata.title = 'Processing...';
        }

        this.debug = function(line) { 
            var params = line.split(' ');

            if (this.verbose)
                showtime.print(params[1] + ': ' + this.getVariableValue(params[1]));
        }

        this.error = function(line) { 
            var regex = new RegExp('([^ ]+)[ ](.+)');
            var params = regex.exec(line);

            var error = params[2];
            if (error[0] == "'")
                error = error.slice(1);

            this.error = true;
            this.message = 'Processor error: ' + error;

            store.add_report_processor(mediaitem.URL, mediaitem.processor, error);
        }

        this.escape = function(line) { 
            var params = line.split(' ');

            this.NIPL.vars[params[1]] = escape(this.NIPL.vars[params[1]]);
        }

        this.match = function(line) { 
            for (var v in this.NIPL.vars) {
                if (v && typeof v == 'string' && v[0] === 'v' && !isNaN(parseInt(v.slice(1)))) {
                    delete this.NIPL.vars[v];
                }
            }

            if (!this.NIPL.vars['regex'])
                return -1;

            var params = line.split(' ');
            var key = params[1];

            var regex = this.NIPL.vars['regex'];
            var match = null;

            var switches = 'm';
            var value = this.getVariableValue(key);

            if (regex.search(/^\(\?([gmsi]+)\)/) == 0) {
                switches = RegExp.$1;
                regex = regex.replace(/^\(\?[gmsi]+\)/,'');
            }
            if(switches.match(/s/)){
                switches=switches.replace(/s/,'');
                regex = regex.replace(/\\n/g,'\\s');
                value = value.replace(/\n/g," ");
            }
        
            regex = new RegExp(regex, switches);
        
            match = regex.exec(value);

            if (!match)
                this.NIPL.vars.nomatch = '1';
            else {
                var i = 1;
                for (var q = 1; q < match.length; q++) {
                    this.NIPL.setValue('v' + i, match[q]);
                    i++;
                }

                delete this.NIPL.vars['nomatch'];
            }

            if (this.verbose) {
                if (match)
                    showtime.trace('Processor match ' + key + ':');
                else {
                    showtime.trace('Processor match ' + key + ':' + ' no match');
                    showtime.print('regex: ' + regex);
                    if (key != "htmRaw")
                        showtime.print('search: ' + value);
                }

                for (var v in this.NIPL.vars) {
                    if (v && typeof v == 'string' && v[0] === 'v' && parseInt(v.slice(1)) != NaN) {
                        showtime.print(v + '=' + this.NIPL.vars[v]);
                    }
                }
            }

            this.NIPL.vars['regex'] = undefined;

            return 0;
        }

        this.play = function() { 
            this.NIPL.vars['videoUrl'] = this.NIPL.vars.url;

            if (this.NIPL.vars['playpath']>'' || this.NIPL.vars['swfplayer']>'') {
                this.NIPL.vars.videoUrl += ' tcUrl='+this.NIPL.vars['url'];
                if (this.NIPL.vars['app']>'')
                    this.NIPL.vars.videoUrl += ' app='+this.NIPL.vars['app'];
                if (this.NIPL.vars['playpath']>'')
                    this.NIPL.vars.videoUrl += ' playpath='+this.NIPL.vars['playpath'];
                if (this.NIPL.vars['swfplayer']>'')
                    this.NIPL.vars.videoUrl += ' swfUrl='+this.NIPL.vars['swfplayer'];
                if (this.NIPL.vars['pageurl']>'')
                    this.NIPL.vars.videoUrl += ' pageUrl='+this.NIPL.vars['pageurl'];
                if (this.NIPL.vars['swfVfy']>'')
                    this.NIPL.vars.videoUrl += ' swfVfy='+this.NIPL.vars['swfVfy'];
            }

            if (this.verbose) {
                showtime.trace('Processor final result:');
                showtime.print('URL: ' + this.NIPL.vars['videoUrl']);
            }

            this.haveVideoUrl = true;

            this.NIPL.vars['videoUrl'] = this.NIPL.vars['videoUrl'].replace(/\//, '/');

            var end = new Date();
            var time = end - init;

            this.cacheProcessor();

            return {
                error: false,
                message: 'Video succesfully processed' + ' (' + time + 'ms)',
                video: this.NIPL.vars['videoUrl']
            }
        }

        this.print = function(line) {
            var params = line.split(' ');
            if (params.length === 2) {
                this.debug('debug ' + params[1]);
            }
            else {
                var regex = new RegExp('([^ ]+)[ ](.+)');
                var params = regex.exec(line);

                if (this.verbose)
                    showtime.print(params[2].slice(1));
            }
        }

        this.render = function () {
            var playlist = "";
            for (var i in this.NIPL.vars) {
                if (i.slice(0, 9) == "playlist.") {
                    /*if (this.verbose)
                        showtime.trace(i + ": " + this.NIPL.vars[i]);*/
                    playlist += i.slice(i.indexOf(".") + 1) + "=" + this.NIPL.vars[i] + "\n";
                }
            }

            for (var i in this.NIPL.vars.playlist.items) {
                var item = this.NIPL.vars.playlist.items[i];
                playlist += "\n";
                for (var j in item) {
                    /*if (this.verbose)
                        showtime.trace(j + ": " + item[j]);*/
                    playlist += j.slice(j.indexOf(".") + 1) + "=" + item[j];
                    if (j == "item.description")
                        playlist += "/description";
                    playlist += "\n";
                }
            }

            if (this.verbose) {
                showtime.trace('Processor final result:');
                showtime.print('Parsed: OK');
            }

            this.havePlaylist = true;

            this.cacheProcessor();

            return {
                error: false,
                message: 'Playlist parsed succesfully',
                playlist: playlist
            }
        }

        this.replace = function(line) { 
            if (!this.NIPL.vars['regex'])
                return -1;

            var regex = new RegExp('([^ ]+)[ ]([^ ]+)[ ](.+)');
            var params = regex.exec(line);

            var key = params[2];
            var value = params[3];
            if (value[0] == "'")
                value = value.slice(1);
            else {
                value = this.NIPL.vars[value];
            }

            var regex_match = new RegExp(this.NIPL.vars['regex'], "g");

            if (this.verbose) {
                showtime.trace('Proc debug replace src:');
                showtime.print('key: ' + key + '\nregex: ' + regex_match + '\nvalue: ' + value);
                showtime.print('old: ' + this.getVariableValue(key));
            }

            if (!this.NIPL.vars[key])
                this.NIPL.vars[key]  = "";
            this.NIPL.vars[key] = this.NIPL.vars[key].replace(regex_match, value);

            if (this.verbose) {
                showtime.print('new: ' + this.getVariableValue(key));
            }

            this.NIPL.vars['regex'] = "";

            return 0;
        }

        this.report = function(page) {
            var args = {
                'phase': this.phase
            };

            if (this.verbose) {
                showtime.trace('Processor report:');
                showtime.print('phase: ' + this.phase);
            }

            for (var v in this.NIPL.vars) {
                if (v && typeof v == 'string' && v[0] === 'v' && parseInt(v.slice(1)) != NaN) {
                    //showtime.print(v + ': ' + this.NIPL.vars[v]);
                    args[v] = this.NIPL.vars[v];
                }
            }
            for (var el in this.NIPL.vars.reports) {
                //showtime.print(el + ': ' + this.NIPL.vars.reports[el]);
                args[el] = this.NIPL.vars.reports[el];
            }

            this.phase += 1;

            if (this.verbose == '1') {
                showtime.trace('Processor: phase ' + this.phase + ' learn');
            }

            return this.getUrl(page, mediaitem, args);
        };
    
        this.report_val = function(line) { 
            var regex = new RegExp('^([^=]+)[=](.+)');
            var params = regex.exec(line);

            var key = params[1].split(' ')[1];
            var value = params[2];
            if (value[0] === "'")
                value = value.slice(1);
            else {
                value = this.NIPL.vars[value];
            }

            this.NIPL.vars.reports[key] = value;

            if (this.verbose) {
                showtime.trace('Processor debug report value: ' + key + ' set to string literal');
                showtime.print(this.NIPL.vars.reports[key]);
            }
        }
    
        this.scrape = function() {
            if (this.NIPL.vars['s_url'] == '') {
                this.error("error 'no scrape URL defined");
                return;
            }

            var downloader = new Downloader(this);
            downloader.controls.debug = false;

            if (this.NIPL.vars['s_action'] == 'geturl') {
                this.NIPL.vars['s_action'] = 'get';
                this.NIPL.vars['s_method'] = 'geturl';
            }

            if (this.NIPL.vars['s_method'] == 'geturl' || this.NIPL.vars['s_action'] == 'headers') {
                downloader.controls.headRequest = true;
                downloader.controls.noFollow = true;
            }

            var data = downloader.getRemote(this.NIPL.vars['s_url']);
        
            this.NIPL.vars['htmRaw'] = data.response;

            if (this.NIPL.vars['s_method'] != 'geturl' && this.NIPL.vars['s_action'] != 'headers') {
                if (this.verbose == '1')
                    showtime.trace('Processor debug headers:');
                for (var hdr in data.headers) {
                    if (this.verbose)
                        showtime.print(hdr + ': ' + data.headers[hdr]);
                    this.NIPL.vars.headers[hdr] = data.headers[hdr];
                }

                if (this.verbose == '1')
                    showtime.trace('Processor debug cookies:');
                if (data.multiheaders['Set-Cookie']) {
                    for (var hdr in data.multiheaders['Set-Cookie']) {
                        var header = data.multiheaders['Set-Cookie'][hdr].toString();
                        header = header.slice(0, header.toString().indexOf(';'));

                        if (header > '') {
                            var params = header.split('=');
                            var key = params[0];
                            var value = params[1];
                            this.NIPL.vars['cookies'][key] = value;

                            if (this.verbose)
                                showtime.print(key + ': ' + value);
                        }
                    }
                }

                if (this.NIPL.vars['regex'] != '') {
                    if (this.verbose)
                        showtime.trace('Processor scrape:');

                    this.match('match htmRaw');

                    if (this.NIPL.vars['nomatch'] && this.NIPL.vars['nomatch'] == '1' && this.verbose)
                        showtime.print('no match');
                }
            }
            else if (this.NIPL.vars['s_method'] == 'geturl' && this.NIPL.vars['s_action'] != 'headers') {
                if (data.headers['Location'] && data.headers['Location'] != '') {
                    this.NIPL.vars['geturl'] = data.headers['Location'];
                    this.NIPL.vars['v1'] = data.headers['Location'];
                }
                else {
                    this.NIPL.vars['geturl'] = this.NIPL.vars['s_url'];
                    this.NIPL.vars['v1'] = this.NIPL.vars['s_url'];
                }
            }
            else if (this.NIPL.vars['s_action'] == 'headers') {
                for (var hdr in data.headers) {
                    if (this.verbose)
                        showtime.print(hdr + ': ' + data.headers[hdr]);

                    this.NIPL.vars.headers[hdr] = data.headers[hdr];
                }

                if (this.verbose)
                    showtime.trace('Processor debug cookies:');
                if (data.multiheaders['Set-Cookie']) {
                    for (var hdr in data.multiheaders['Set-Cookie']) {
                        var header = data.multiheaders['Set-Cookie'][hdr].toString();
                        header = header.slice(0, header.toString().indexOf(';'));

                        if (header > '') {
                            var params = header.split('=');
                            var key = params[0];
                            var value = params[1];
                            this.NIPL.vars['cookies'][key] = value;

                            if (this.verbose)
                                showtime.print(key + ': ' + value);
                        }
                    }
                }
            }

            for (var v in this.NIPL.vars) {
                if (v && typeof v == 'string' && v[0] === 'v' && parseInt(v.slice(1)) != NaN) {
                    this.report_val("report_val " + v + "='" + this.NIPL.vars[v]);
                }
            }

            this.NIPL.vars['s_referer'] = '';
            this.NIPL.vars['s_cookie'] = '';
            //this.NIPL.vars['s_headers'] = {};
            this.NIPL.vars['s_postdata'] = '';
            this.NIPL.vars['s_method'] = 'get';
            this.NIPL.vars['s_action'] = 'read';
        }
    
        this.unescape = function(line) { 
            var params = line.split(' ');

            if (this.verbose) {
                showtime.trace('Proc debug unescape:');
                showtime.print('old: ' + this.NIPL.vars[params[1]]);
            }

            this.NIPL.vars[params[1]] = unescape(this.NIPL.vars[params[1]]);

            if (this.verbose)
                showtime.print('new: ' + this.NIPL.vars[params[1]]);
        }
    
        this.setVerbose = function(line) { 
            var params = line.split(' ');

            this.verbose = parseInt(params[1]);
        }

        this.ifResult = function(line) { 
            // condition parser
            var ifparse=new RegExp(/^([^<>=!]+)\s*([!<>=]+)\s*(.+)$/);
            var params = ifparse.exec(line);

            if (params && params[2] && params[2] != '!') {
                var key = params[1].slice(params[1].indexOf(' ') + 1);
                var keys = '';
                var value = params[3];
                var result = false;

                if (value[0] == "'")
                    value = value.slice(1);
                else
                    value = this.NIPL.vars[value];

                var oper = params[2];
                if (oper === '=')
                    oper = '==';

                if (oper === '<>')
                    oper = '!=';

                try {
                    this.NIPL.vars[key]
                }
                catch (ex) { e(ex); this.NIPL.vars[key] = ""; }

                try {
                    result = eval("this.NIPL.vars[key]" + oper + "value");
                }
                catch (ex) { e(ex); result = false; }

                if (this.verbose) {
                    showtime.trace('Proc debug if => ' + result + ':');
                    showtime.print('test: ' + key + ' ' + oper + ' ' + params[3]);
                    if (this.NIPL.vars[key]) {
                        showtime.print('left: ' + this.NIPL.vars[key]);
                        showtime.print('right: ' + value);
                    }
                }
            }
            else {
                var params = line.split(' ');
                var exist = false;
                if (this.NIPL.vars[params[1]])
                    exist = true;

                result = exist;

                if (this.verbose) {
                    showtime.trace('Proc debug if => ' + result + ':');
                    if (this.NIPL.vars[params[1]])
                        showtime.print(params[1] + " > '': " + this.NIPL.vars[params[1]]);
                    else
                        showtime.print(params[1] + " = ''");
                }
            }

            // TODO: Multiple variable test
            // if v1 && test != 'null || foo == 'bar

            return result;
        }

        this.getVariableValue = function(key) {
            try {
                var keys = "['" + key + "']";
                if (key.indexOf('.') != -1) {
                    keys = '';
                    for  (var i in key.split('.')) {
                        var k = key.split('.')[i];
                        keys +="['" + k + "']";
                    }
                }

                var value = eval('this.NIPL.vars' + keys);
                return value;
            }
            catch(ex) { e(ex); return ''; }
        };

        this.setVariableValue = function(line) { 
            var regex = new RegExp('^([^=]+)([=])(.+)');
            var params = regex.exec(line);

            var key = params[1];
            var value = params[3];

            if (value[0] == "'") {
                value = value.slice(1);

                if (this.verbose) {
                    showtime.trace('Proc debug variable: ' + key + ' set to string literal');
                    showtime.print(value);
                }
            }
            else {
                if (this.verbose == '1')
                    showtime.trace('Proc debug variable: ' + key +' set to ' + value);

                if (!this.NIPL.vars[value])
                    this.NIPL.vars[value] = '';

                if (this.verbose)
                    showtime.print(this.NIPL.vars[value]);

                value = this.NIPL.vars[value];
            }

            this.NIPL.setValue(key, value);
        }

        this.cacheProcessor = function() {
            if (service.cachingProcessors && !this.cached && this.NIPL.vars["cacheable"] && this.NIPL.vars["cacheable"] == "1") {
                var cachefile = "processors/" + encodeString(mediaitem.processor);
                t("Caching processor to " + cachefile);
                var store_processor = plugin.createStore(cachefile, true);
                store_processor.source = this.data;
                store_processor.expires = new Date(new Date().valueOf() + 1000 * 60 * 60 * 24).toString();
            }
        }

        this.getUrl = function(page, mediaitem, args, local) {
            var message = '';
            var data = {};

            var if_stack = [];
            var if_stacklen = 0;

            this.cached = false;
            if (!local) {
                var cachefile = "processors/" + encodeString(mediaitem.processor);
                t("Getting cache processor from " + cachefile);
                var store_processor_tmp = plugin.createStore(cachefile, true);
                if (service.cachingProcessors == '1' && store_processor_tmp && store_processor_tmp.source && store_processor_tmp.expires) {
                    if (new Date() > new Date(store_processor_tmp.expires)) {
                        store_processor_tmp = {};
                    }
                    else {
                        data.response = store_processor_tmp.source;
                        this.cached = true;
                    }
                }

                var proc = mediaitem.processor;
                var match_proc = proc.match(/(.+?)\?(.*)/);
                if (match_proc) {
                    this.NIPL.vars.s_proc = match_proc[1];
                    if (match_proc[2]) {
                        showtime.print(match_proc[2]);
                        var args_tmp = match_proc[2].split("&");
                        for (var i in args_tmp) {
                            var arg = args_tmp[i].split("=");
                            this.NIPL.setValue(arg[0], arg[1]);
                            if (this.verbose)
                                showtime.trace("Adding argument " + arg[0] + ": " + arg[1]);
                        }
                    }
                }
                else {
                    this.NIPL.vars.s_proc = proc;
                }

                if (!this.cached) {
                var link = this.NIPL.vars.s_proc + '?';

                var postdata = 'url=' + escape(mediaitem.URL);

                if (args) {
                    for (var el in args) {
                        if (el == 'phase') postdata += '&' + el + '=' + this.phase;
                        else postdata += '&' + el + '=' + escape(args[el]);
                    }
                }

                link += postdata;
                showtime.print(link);
                this.NIPL.vars['s_postdata'] = postdata;

                if (this.phase > 1)
                    this.NIPL.vars['s_method'] = 'post';

                this.NIPL.vars['s_cookie'] = 'version=' + version + '; platform=Showtime';

                t("Downloading " + link);
                data = this.downloader.getRemote(link, args);

                if (data.error || data.response == '') {
                    if (data.error) {
                        message = data.error;
                    }
                    if (data.response == '') {
                        message = 'There was a problem while trying to obtain processor.';
                    }

                    var result = {
                        error: true,
                        message: message
                    };
                    return result;
                }
            }

                data = data.response;
            }
            else {
                data = local;
            }

            this.data = data;

            if (this.phase == 1) {
                var version = data.split("\n")[0].trim();
                //var version = data.slice(0, 2);
                showtime.print("Version: " + version);
                showtime.trace('Processor: phase 1 - query');
                showtime.print('URL: ' + mediaitem.URL);
                showtime.print('Processor: ' + mediaitem.processor);
            }

            showtime.print(version + " - " + (version == "v2"));
            if (this.phase > 1 || version == "v2") {
                var lines = data.split('\n');
                var if_bypass = 0;

                var eof = lines.length;
                showtime.trace("Number of lines of processor: " + eof);
                if (eof < 1)
                    this.error("error 'nothing returned from phase " + this.phase);

                var linenum = -1;
                while (linenum < eof - 1) {
                    linenum += 1;
                    var i = linenum;
                    //Note: while loop will need to set linenum to linenum-1 since it is incremented at start of block
                    page.metadata.title = 'Processing... Phase: ' + this.phase + '; Line: ' + (i + 1);
                    if (this.verbose)
                        showtime.trace("Processing line #" + (i + 1));
                    if (this.haveVideoUrl && !this.error) {
                        break;
                    }
                    else if (this.error && this.message != '') {
                        break;
                    }

                    // Remove unnecessary spaces in line
                    var line = lines[i].replace(/^\s*/, '').replace(/\s\s*$/, '');

                    // Bypass empty or comment lines
                    if (line.slice(0, 1) == '#' || line.slice(0, 2) == '//' || line == '')
                        continue;

                    if (this.verbose) {
                        showtime.trace('Processor Line #' + (i + 1) + ': ' + line);

                        if (if_stacklen > 0 && (if_stack[if_stack.length - 1]["if_next"] || if_stack[if_stack.length - 1]["if_satisfied"] || if_stack[if_stack.length - 1]["if_end"])) {
                            var str_report = str_report + "\n (IF: satisfied=" + if_stack[if_stack.length - 1]["if_satisfied"] + ", skip to next=" + if_stack[if_stack.length - 1]["if_next"] + ", skip to end=" + if_stack[if_stack.length - 1]["if_end"] + ")";
                            showtime.trace(str_report);
                        }
                    }

                    if (if_stacklen > 0 && line.slice(0, 3) != 'if ' && line != 'endif' && line != 'endwhile') {
                        if (if_stack[if_stack.length - 1]["if_end"] && line != 'endif' && line != 'endwhile') {
                            if (this.verbose > 1)
                                showtime.trace("    ^^^ skipped");
                            continue;
                        }

                        if (if_stack[if_stack.length - 1]["if_next"] && line.slice(0, 6) != 'elseif' && line != 'else' && line != 'endif') {
                            if (this.verbose > 1)
                                showtime.trace("    ^^^ skipped");
                            continue;
                        }
                    }

                    if (line == 'else' && if_stacklen > 0) {
                        if (if_stack[if_stack.length - 1]["if_satisfied"])
                            if_stack[if_stack.length - 1]["if_end"] = true;
                        else
                            if_stack[if_stack.length - 1]["if_next"] = false;
                        continue;
                    }
                    else if (line == 'endif' && if_stacklen > 0) {   // reset if params
                        if_stack.pop();
                        if_stacklen = if_stack.length;
                        continue;
                    }
                    else if (line == 'endwhile' && if_stacklen > 0) {
                        // process next loop iteration
                        var wresult = this.while_eval(if_stack[if_stack.length - 1]);
                        if (wresult["error"])
                            return this.error("error '" + wresult["message"]);
                        if (this.verbose > 1)
                            showtime.trace(wresult["message"]);
                        if (wresult["match"])
                            linenum = if_stack[if_stack.length - 1]["loopstart"];
                        else {
                            if_stack.pop();
                            if_stacklen = if_stack.length;
                            continue;
                        }
                    }


                    var lparse = new RegExp('^([^ =]+)([ =])(.+)');
                    // Initial check for the function in processor
                    var match = lparse.exec(line);

                    if (match && match[2] === "=") {
                        this.setVariableValue(line);
                    }
                    else if (match && match[2] === " ") {
                        var subj = match[1];
                        var arg = match[3];
                        if (subj == 'concat') {
                            this.concat(line);
                        }
                        else if (subj == 'debug') {
                            this.debug(line);
                        }
                        else if (subj == 'countdown') {
                            this.countdown(page, line);
                        }
                        else if (subj == 'error') {
                            this.error(line);
                        }
                        else if (subj == 'escape') {
                            this.escape(line);
                        }
                        else if (subj == 'debug') {
                            this.debug(line);
                        }
                        else if (subj == 'match') {
                            this.match(line);
                        }
                        else if (subj == 'print') {
                            this.print(line);
                        }
                        else if (subj == 'report_val') {
                            this.report_val(line);
                        }
                        else if (subj == 'replace') {
                            this.replace(line);
                        }
                        else if (subj == 'unescape') {
                            this.unescape(line);
                        }
                        else if (subj == 'verbose') {
                            this.setVerbose(line);
                        }
                        else if (subj === 'if' || subj === 'elseif') {
                            if (if_stacklen > 0 && match[1] == 'elseif' && if_stack[if_stack.length -1]["if_satisfied"])
                                if_stack[if_stack.length - 1]["if_end"] = true;
                            else {
                                if (match[1] == 'if') {
                                    var if_skip = false;
                                    if (if_stacklen > 0 && (if_stack[if_stack.length - 1]["if_satisfied"] == false || if_stack[if_stack.length - 1]["if_end"] == true))
                                        if_skip = true;
                                    if_stack.push({
                                        "if_next": false,
                                        "if_satisfied": false,
                                        "if_end": if_skip
                                    });
                                    if_stacklen = if_stack.length;
                                }
                                var boolObj = this.if_eval(match[3]);
                                if (boolObj["error"] == true)
                                    this.error("error '" + boolObj["data"] + "\n" + line);
                            }

                            if (boolObj["data"] == true) {
                                if_stack[if_stack.length - 1]["if_satisfied"] = true;
                                if_stack[if_stack.length - 1]["if_next"] = false;
                            }
                            else
                                if_stack[if_stack.length - 1]["if_next"] = true;

                            if (this.verbose > 0)
                                showtime.trace("Proc debug " + match[1] + " => " + boolObj["data"]);

                            continue;
                        }
                        else if (subj === 'while') {
                            var regex = this.getVariableValue("regex");
                            var switches = 'm';
                            var value = this.getVariableValue(warg);

                            if (regex.search(/^\(\?([gmsi]+)\)/) == 0) {
                                switches = RegExp.$1;
                                regex = regex.replace(/^\(\?[gmsi]+\)/, '');
                            }
                            if (switches.match(/s/)) {
                                switches = switches.replace(/s/, '');
                                regex = regex.replace(/\\n/g, '\\s');
                                value = value.replace(/\n/g, " ");
                            }

                            regex = new RegExp(regex, switches);

                            if_stack.push({
                                "if_next": false,
                                "if_satisfied": false,
                                "if_end": false,
                                "type": "while",
                                "regex": regex,
                                "loopstart": 0,
                                "execcount": 0
                            })
                            if_stacklen = if_stack.length;
                           
                            var wmatch = arg.match(lparse);
                            if (!wmatch)
                                this.error("error 'syntax error: " + line);

                            var wsubj = wmatch[1];
                            var warg = wmatch[3];
                            if (wsubj == 'match') {
                                if_stack[if_stack.length - 1]["subtype"] = 're';
                                if_stack[if_stack.length - 1]["regex"] = regex;
                                if_stack[if_stack.length - 1]["haystack"] = this.getVariableValue(warg);
                                if_stack[if_stack.length - 1]["searchstart"] = 0;
                                if_stack[if_stack.length - 1]["loopstart"] = linenum; // code block start -1
                            }
                            else
                                this.error("error 'unrecognized while condition '" + wsubj + "'");
                           
                            // evaluate while
                            var wresult = this.while_eval(if_stack[if_stack.length - 1]);
                            if (wresult["error"])
                                this.error("error '" + wresult["message"]);
                            if (this.verbose == '1')
                                this.print("line " + wresult["message"]);

                            continue;
                        }
                        else {
                            if (this.verbose == '1')
                                showtime.trace('Processor: Unknown function');
                        }
                    }
                    else if (line.indexOf(' ') == -1) {
                        var command = line;
                        if (command == 'report') {
                            return this.report(page);
                        }
                        else if (command == 'play') {
                            return this.play();
                        }
                        else if (command == 'render') {
                            return this.render();
                        }
                        else if (command == 'scrape') {
                            this.scrape();
                        }
                        else if (command == "item_new") {
                            // Create a new item
                            this.NIPL.setValue("item", {}, false);
                        }
                        else if (command == "item_add") {
                            // Adds new item to playlist
                            if (this.verbose)
                                showtime.trace("Adding item to playlist:");
                            var item = {};
                            for (var i in this.NIPL.vars) {
                                if (i.slice(0, 5) == "item.") {
                                    if (this.verbose)
                                        showtime.print(i + ": " + this.NIPL.vars[i]);
                                    item[i] = this.NIPL.vars[i];
                                    delete this.NIPL.vars[i];
                                }
                            }
                            this.NIPL.vars.playlist.items.push(item);
                        }
                    }
                }
            }
            else {
                // proc v1

                var result = {
                    error: false,
                    message: ''
                };

                var arr = data.split('\n');
                if (arr.length < 1) {
                    result.error = true;
                    result.message = "Processor error: nothing returned from learning phase";
                    return result;
                }
                var URL = arr[0];
                if (URL.indexOf('error') != -1) {
                    result.error = true;
                    result.message = "Processor: " + URL;
                    return result;
                }
                report = "Processor: phase 2 - instruct\n URL: " + URL;
                if (arr.length < 2) {
                    this.NIPL.vars['videoUrl'] = URL;
                    result.error = false;
                    result.message = "Processor: single-line processor stage 1 result\n playing " + URL;
                    result.video = this.NIPL.vars['videoUrl'];

                    return result;
                }
                var filt = arr[1];
                report = report + "\n filter: " + filt;
                if (arr.length > 2) {
                    var ref = arr[2];
                    var report = report + "\n referer: " + ref;
                }
                else
                    ref = '';
                if (arr.length > 3) {
                    var cookie = arr[3];
                    report = report + "\n cookie: " + cookie;
                }
                else
                    cookie='';

                if (this.verbose == '1')
                    showtime.trace(report);

                this.NIPL.vars['s_cookie'] = cookie;
                this.NIPL.vars['s_referer'] = ref;
                var htm = this.downloader.getRemote(URL).response;
                if (htm == '') {
                    result.error = true;
                    result.message = "Processor error: nothing returned from scrape";
                    return result;
                }

                var p = new RegExp(filt);
                var match = p.exec(htm);
                if (match) {
                    var tgt = mediaitem.processor;
                    var sep = '?';
                    report = 'Processor: phase 3 - scrape and report';

                    for (i in match) {
                        var val = escape(match[i]);

                        tgt = tgt + sep + 'v' + i + '=' + val;
                        sep = '&';
                        report = report + "\n v" + i + ": " + val;
                    }

                    if (this.verbose == '1')
                        showtime.trace(report);
                    var htmRaw2 = this.downloader.getRemote(tgt).response;
                    if (htmRaw2<='') {
                        result.error = true;
                        result.message = "Processor error: could not retrieve data from process phase";
                        return result;
                    }
                    arr = htmRaw2.split('\n');
                    mediaitem.URL = arr[0];

                    if (arr[0].indexOf('error') != -1) {
                        result.error = true;
                        result.message = "Processor: " + arr[0];
                        return result;
                    }
                    if (arr.length > 1) {
                        mediaitem.URL = mediaitem.URL + ' tcUrl=' + arr[0] + ' swfUrl=' + arr[1];
                        if (arr.lenght > 2)
                            mediaitem.URL = mediaitem.URL + ' playpath=' + arr[2];
                        if (arr.length > 3)
                            mediaitem.URL = mediaitem.URL + ' pageUrl=' + arr[3];
                    }
                    mediaitem.processor = '';
                }
                else {
                    result.error = true;
                    result.message = "Processor error: pattern not found in scraped data";
                    return result;
                }
            }

            var end = new Date();
            var time = end - init;

            if (!this.NIPL.vars['videoUrl'] && this.message == '') {
                this.error = true;
                message = 'Finished processing but there are no results...' + ' (' + time + 'ms)';
            }
            else if (this.message != '') {
                this.error = true;
                message = this.message;
            }
            else
                message = 'Video succesfully processed' + ' (' + time + 'ms)';

            var result = {
                error: this.error,
                message: message,
                video: this.NIPL.vars['videoUrl']
            };

            return result;
        }

        this.while_eval = function(if_obj) {
            if_obj["execcount"] = if_obj["execcount"] + 1;
            if (if_obj["execcount"] > 500) {
                return {
                    "error": true,
                    "match": false,
                    "message": "While loop exceeded maximum iteration count"
                }
            }
            for (var i = 1; i < 11; i++) {
                var ke = 'v' + i;
                this.NIPL.setValue(ke, "");
            }

            var haystack = if_obj['haystack'].slice(if_obj['searchstart']);
            var match = haystack.match(if_obj['regex']);
            var rerep = 'Processor while iteration:';
            if (this.verbose)
                showtime.print("match: " + match);
            if (!match) {
                rerep = rerep + ' no match';
                if_obj["if_end"] = true;
                return {
                    "error": false,
                    "match": false,
                    "message": rerep
                };
            }

            if_obj["searchstart"] += match[0].length; // Set start to next position so current match will be bypassed next time
            //if_obj["searchstart"]=if_obj["searchstart"]+match.end() //TODO
            for (var i = 1; i < match.length; i++) {
                var val = match[i];
                if (!val)
                    val='';
                var key = 'v' + i;
                rerep = rerep + "\n " + key + '=' + val;
                this.NIPL.setValue(key, val);
            }

            return {
                "error": false,
                "match": true,
                "message": rerep
            };
        }

        this.if_eval = function(str_in) {
            var match=this.multiIfTest.exec(str_in);
            if (!match) {
                // single condition request
                return this.condition_eval(str_in);
            }
            else {
                // multiple condition request
                mflag = true;
                while (mflag == true) {
                    match = this.conditionExtract.exec(str_in);
                    if (match) {
                        cond = match[1];
                        boolObj = this.condition_eval(cond);
                        if (boolObj["error"] == true)
                            return this.error("error '" + boolObj["data"]);

                        if (boolObj["data"] == true)
                            rep = '';
                        else
                            rep = '';
                        str_in = str_in.replace(cond, rep);
                    }
                    else
                        mflag = false;
                }
                str_in = str_in.replace('', 'true');
                str_in = str_in.replace('', 'false');
                try {
                    bool = eval(str_in);
                }
                catch (ex) {
                    e(ex);
                    return {
                        "error": true,
                        "data": ex
                    }
                }
                return {
                    "error": false,
                    "data": bool
                }
            }
        }

        this.condition_eval = function (cond) {
            var bool = false;
            var rside = '';

            var match = this.ifparse.exec(cond);
            if (match) {
                // process with operators
                var lkey = match[1];
                var oper = match[2];
                var rraw = match[3];
                if (oper == '=')
                    oper = '==';
                if (rraw.slice(0, 1) == "'")
                    rside = rraw.slice(1);
                else
                    rside = this.NIPL.vars[rraw];

                try {
                    this.NIPL.vars[lkey]
                }
                catch (ex) { e(ex); this.NIPL.vars[lkey] = ""; }

                try {
                    bool = eval("this.NIPL.vars[lkey]" + oper + "rside")
                }
                catch (ex) {
                    e(ex);
                    return {
                        "error": true,
                        "data": ex
                    }
                }
            }
            else {
                // process single if argument for >''
                try {
                    this.NIPL.vars[cond];
                }
                catch (ex) { e(ex); this.NIPL.vars[cond] = '' }

                try { bool = this.NIPL.vars[cond] > ''; }
                catch (ex) {
                    e(ex);
                    return {
                        "error": true,
                        "data": ex
                    }
                }
            }

            return {
                "error": false,
                "data": bool
            }
        }
    }

    function Downloader(processor) {
        this.controls = {
            'noFollow': false,
            'debug': false,
            'headRequest': false
        };

        this.getRemote = function (filename, args) {
            var argsVar = {};
            if (args)
                argsVar = args;
            var headers = {};

            var url = filename;

            if (processor) {
                if (processor.NIPL.vars['s_agent']) {
                    headers['User-Agent'] = processor.NIPL.vars['s_agent'];
                }
                if (processor.NIPL.vars['s_referer'] && processor.NIPL.vars['s_referer'] != '') {
                    headers['Referer'] = processor.NIPL.vars['s_referer'];
                }
                if (processor.NIPL.vars['s_cookie'] && processor.NIPL.vars['s_cookie'] != '') {
                    headers['Cookie'] = processor.NIPL.vars['s_cookie'];
                }
                if (processor.NIPL.vars['s_headers'].length > 0) {
                    for (var hdr in processor.NIPL.vars['s_headers'])
                        headers[hdr] = processor.NIPL.vars['s_headers'][hdr];
                }
            }

            if (url.indexOf(nxserver_URL) != -1 && server) {
                headers['Cookie'] = headers['Cookie'] + '; nxid=' + server.user_id;
            }

            var data = '';

            if (processor) {
                if (this.verbose == '1') {
                    showtime.trace('Processor ' + processor.NIPL.vars['s_method'].toString().toUpperCase() + '.' + processor.NIPL.vars['s_action'] + ': ' + url);
                    showtime.trace('Proc debug remote args:');
                    showtime.trace("{'postdata': \'" + processor.NIPL.vars['s_postdata'] + "\', 'agent': '" + headers['User-Agent'] + "', 'headers': {}, 'cookie': '" + headers['Cookie'] + "', 'action': '" +
                processor.NIPL.vars['s_action'] + "', 'referer': '" + headers['Referer'] + "', 'method': '" + processor.NIPL.vars['s_method'] + "'}");
                }
            }

            try {
                showtime.trace("URL: " + url);
                showtime.trace("Args: " + showtime.JSONEncode(argsVar));
                if (processor && processor.NIPL.vars['s_method'] === 'get') {
                    data = showtime.httpGet(url, argsVar, headers, this.controls);
                }
                else if (processor && processor.NIPL.vars['s_method'] === 'post' && processor.NIPL.vars['s_postdata']) {
                    var arguments = {};
                    var params = processor.NIPL.vars['s_postdata'].split('&');
                    for (var i in params) {
                        var el = params[i];
                        var params_sub = el.split('=');

                        if (!params_sub[1])
                            params_sub[1] = '';

                        if (this.verbose)
                            showtime.print(params_sub[0] + ': ' + unescape(params_sub[1]));
                        arguments[params_sub[0]] = unescape(params_sub[1]);
                    }

                    data = showtime.httpPost(url, arguments, null, headers, this.controls);
                }
                else if (processor && processor.NIPL.vars['s_method'] === 'post' && !processor.NIPL.vars['s_postdata']) {
                    data = showtime.httpPost(url, argsVar, headers, this.controls);
                }
                else
                    data = showtime.httpGet(url, argsVar, headers, this.controls);

                var response = data.toString();
                var headersResponse = data.headers;

                return {
                    'response': response,
                    'headers': headersResponse,
                    'multiheaders': data.multiheaders
                };
            }
            catch (ex) {
                t('Downloader: ' +ex);
                e(ex);
                return {
                    'response': '',
                    'headers': {},
                    'multiheaders': {},
                    'error': ex
                };
            }
        }
    }

    function MediaItem() 
    {
        this.type='unknown'; //(required) type (playlist, image, video, audio, text)
        this.version=8; //(optional) playlist version
        this.name=''; //(required) name as displayed in list view
        this.description=''; //(optional) description of this item
        this.date=''; //(optional) release date of this item (yyyy-mm-dd)
        this.thumb = null; //(optional) URL to thumb image or 'default'
        this.icon='default'; //(optional) URL to icon image or 'default'
        this.URL=''; //(required) URL to playlist entry
        //this.DLloc=''; //(optional) Download location
        this.processor=''; //(optional) URL to mediaitem processing server
        this.playpath=''; //(optional) 
        this.swfplayer=''; //(optional)
        this.pageurl=''; //(optional)
        this.background='default'; //(optional) background image
        this.rating=''; //(optional) rating value
        this.infotag='';
        this.view='default'; //(optional) List view option (list, panel)
    }

    function GetType(mediaitem, field) {
        var index = mediaitem.type.indexOf(':');
        var value = '';
        if (index != -1) {
            if (field == 0)
                value = mediaitem.type.slice(0, index);
            else if (field == 1)
                value = mediaitem.type.slice(index + 1, mediaitem.type.length);
        }
        else {
            if (field == 0)
                value = mediaitem.type;
            else if (field == 1)
                value = '';
        }
        return value;
    }

    function NIPL(mediaitem) {
        this.vars = {};

        this.setValue = function(key, value, append) {
            if (!append || !this.vars[key])
                this.vars[key] = value;
            else
                this.vars[key] += value;
        };

        this.newVars = function(mediaitem) {
            this.vars = {
                // Scraping parameters (remote site data retrieval)
                's_url': mediaitem.URL,
                's_method': 'get', // get or post
                's_action': 'read', // read or headers
                's_agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.0.4) Gecko/2008102920 Firefox/3.0.4', // User Agent of a web browser (e.g. Firefox)
                's_referer': '',
                's_cookie': '',
                's_postdata': '', //only if s_method == 'post'
                's_headers': {},
                's_args': {},

                // Scrape return data (auto-defined from calling the scrape function)
                'htmRaw': '', // only if s_action == 'read'
                'geturl': '', 
                'headers': {},
                'cookies': {},

                // Video Playback
                'url': '',
                'swfplayer': '',
                'playpath': '',
                'pageurl': '',
                'app': '',
                'swfVfy': '',
                'live': '',
                'agent': '', //?
                'referer': '',

                //'cacheable': '',
                'countdown_caption': '',
                'countdown_title': '',
                'nookies': {}, // NIPL cookies
                //'nookie_expires': '', // Not supported in Showtime
                'regex': '',
                'nomatch': 0,
                //v1,v2,...,vn

                // Playlist
                "playlist": {
                    items: []
                },
                "item": {}
            };

            this.vars.reports = {};
        }

        this.newVars(mediaitem);
    }

    function Server() {
        this.credentials = {};
        this.user_id = '';
        this.username = '';

        this.init = function () {
            if (user_settings) {
                if (user_settings['nxid'] && user_settings['nxid'] != '') {
                    this.user_id = user_settings['nxid'];
                    showtime.trace('Found user ID');
                }
                if (user_settings['username'] && user_settings['username'] != '') {
                    this.username = user_settings['username'];
                    showtime.trace('Authenticated as: ' + this.username);
                }
            }
        }

        this.authenticated = function() {
            if (this.user_id != '')
                return true;
            return false;
        };

        this.login = function () {
            if(this.authenticated())      
                return true;
                
            var reason = "Login to http://navixtreme.com";    
            var do_query = false;    
            while(1) { 
                this.credentials = plugin.getAuthCredentials("Navi-X", reason, do_query);

                if(!this.credentials) {	
                    if(!do_query) {	  
                        do_query = true;	  
                        continue;
                    }	
                    return false;
                }      

                if (this.credentials.rejected) {
                    return false;
                }

                if (this.credentials.username == "" || this.credentials.password == "") {
                    if (!do_query) {
                        do_query = true;
                        continue;
                    }
                    return false;
                }

                try {
                    var v = showtime.httpPost("http://www.navixtreme.com/login/", {
                        'username':this.credentials.username,
                        'password':this.credentials.password
                    }, {}, {
                        'User-Agent': 'Showtime Navi-X ' + version 
                    });

                    var lines = v.toString().split("\n");
                    this.user_id = lines[0];
                    
                    if (this.user_id != '') {
                        showtime.trace('Logged in to Navi-X as user: ' + this.credentials.username);

                        user_settings['nxid'] = this.user_id;
                        user_settings['username'] = this.credentials.username;

                        return true;
                    }
                    else {
                        reason = "Wrong username/password.";
                        continue;
                    }
                }
                catch (ex) { e(ex); showtime.trace('Navixtreme: Error while authenticating user.'); return false; }
            }
        };

        this.adultContent = function () {
            if (!this.authenticated()) return false;

            if (!user_settings['adult'] || (user_settings['adult'] != value)) {
                var value = (service.adult) ? '1' : '0';
                var data = showtime.httpGet("http://www.navixtreme.com/cgi-bin/adult_prefs.cgi", { 'value': value }, {
                    'cookie': 'nxid=' + this.user_id,
                    'User-Agent': 'Showtime Navi-X ' + version 
                });
                showtime.trace("NAVI-X: " + data);
                user_settings['adult'] = value;
                return true;
            }
            return false;
        };

        this.existInPlaylist = function(item, playlist_name) {
            var playlist_id = this.getPlaylistId(playlist_name);
            var playlist_url = 'http://www.navixtreme.com/playlist/' + playlist_id + '/' + playlist_name + '.plx';

            var playlist = new Playlist(null, playlist_url, new MediaItem());
            playlist.render = false;
            playlist.loadPlaylist(playlist_url);

            showtime.trace('Navixtreme: Looking for item #' + item.id + ' in playlist ' + playlist_name + '.');
        
            if (item.processor === '')
                item.processor = 'undefined';

            if (item.type == 'plx' || item.type == 'unknown')
                item.type = 'playlist';

            var exist = false;
            for (var i in playlist.list) {
                var it = playlist.list[i];
                if (item.type == 'video') {
                    if (it.URL === item.URL && it.processor === item.processor) {
                        exist = true;
                    }
                }
                else {
                    if (it.type === item.type && it.URL === item.URL) {
                        exist = true;
                    }
                }

                if (exist) {
                    showtime.trace('NAVI-X: Found the entry in the playlist ' + playlist_name + '.');
                    return exist;
                }
            }

            showtime.trace('NAVI-X: This entry was not found in the playlist ' + playlist_name + '.');
            return false;
        };

        this.removeFromPlaylist = function(playlist_name, item) {
            var playlist_id = this.getPlaylistId(playlist_name);
            var playlist_url = 'http://www.navixtreme.com/playlist/' + playlist_id + '/' + playlist_name + '.plx';

            var playlist = new Playlist(null, playlist_url, new MediaItem());
            playlist.render = false;
            playlist.loadPlaylist(playlist_url);

            var id = this.getIndexOfIteminPlaylist(playlist, item);

            if (id == -1)
                return false;

            var result = showtime.httpPost('http://www.navixtreme.com/mylists/',{
                'action': 'item_delete',
                'id': playlist.list[id].id,
                'rndval':parseInt(new Date().getTime())
            }, null, {
                'cookie' : this.cookie
            }).toString();
                
            if (result.split("\n")[0] == 'ok') {
                showtime.trace('Navixtreme: Item was succesfully removed from playlist ' + playlist_name + '.');
                return true;
            }
            else {
                showtime.trace('Navixtreme: ERROR - ' + result);
                return false;
            }
        };

        this.getIndexOfIteminPlaylist = function(playlist, item) {
            if (item.type == 'plx' || item.type == 'unknown')
                item.type = 'playlist';

            for (var id in playlist.list) {
                var it = playlist.list[id];
                if (item.type == 'video') {
                    if (it.URL === item.URL && it.processor === item.processor)
                        return id;
                }
                else {
                    if (it.type === item.type && it.URL === item.URL)
                        return id;
                }
            }
            return -1;
        }

        this.addToPlaylist = function(playlist_name, item) {
            var playlist_id = this.getPlaylistId(playlist_name, true);

            if (playlist_id == '')
                return false;

            //save item
            if (item.type == 'playlist' || item.type == 'unknown')
                item.type = 'plx';

            if (playlist.list.length > 1) {
                for (var i = 0; i < playlist.list.length; i++) {
                    var it = playlist.list[i];
            
                    if (it.processor === '')
                        it.processor = 'undefined';
                    if (it.URL === item.URL && it.processor === item.processor && it.thumb === item.thumb && it.description === item.description) {
                        this.removeFromPlaylist(playlist_name, it);
                    }
                }
            }
                
            var result = showtime.httpPost('http://www.navixtreme.com/mylists/',{
                'URL': item.URL,
                'action':'item_save',
                'background': item.background,
                'description': item.description,
                'list_id': playlist_id,
                'list_pos':'top',
                'name': item.name,
                'playpath': item.playpath,
                'plugin_type':'music',
                'processor': item.processor,
                'text_local':0,
                'this_list_id':'',
                'thumb': item.thumb,
                'txt':'',
                'type': item.type,
                'rndval':parseInt(new Date().getTime())
            }, null, {
                'cookie' : this.cookie
            }).toString();
                
            if (result.split("\n")[0] == 'ok') {
                showtime.trace('Navixtreme: Item was succesfully added to playlist ' + playlist_name + '.');
                return true;
            }
            else {
                showtime.trace('Navixtreme: ERROR - ' + result);
                return false;
            }
        };

        this.getPlaylistId = function(title, quiet, use_old) {
            var name = title.toLowerCase().replace(' ', '_');
            var playlist_id = '';

            if (!use_old) {
                var data = showtime.httpGet('http://www.navixtreme.com/playlist/mine.plx', null, {
                    'cookie': 'nxid=' + this.user_id
                });
            }
            else {
                var data = this.playlists_data;
            }

            try {
                //get playlist plx
                playlist_id = data.toString().match('playlist/(.*?)/' + name + '.plx')[1];
                showtime.trace('NAVI-X: ' + title + ' plx id: ' + playlist_id);
            }
            catch (err) {
                e(err);
                showtime.trace('Navixtreme: ' + err);

                if (!quiet) {
                    //playlist plx doesn't exist
                    if (showtime.notify("You don't have any playlist with that name, do you want to create one?", 3))
                        playlist_id = this.createPlaylist(title);
                }
                else playlist_id = this.createPlaylist(title);
            }
            this[name + '_id'] = playlist_id;
            store.add_settings_playlist(name, playlist_id);
            return playlist_id;
        }

        this.createPlaylist = function(title/*, description, background, logo, icon, adult*/) {
            var name = title.toLowerCase().replace(' ', '_') + '_id';
            this[name] = playlist_id;

            var playlist_id = showtime.httpPost('http://www.navixtreme.com/mylists/', {
                'action':'list_save','background':'','description':'','icon_playlist':'','id':'','is_adult':0,'is_home':0,
                'is_private': 1,'logo':'','player':'','title': title,'rndval':parseInt(new Date())
            }, null, {
                'cookie':this.cookie
            }).toString();

            showtime.trace('NAVI-X: ' + title + ' plx id: ' + playlist_id);
            return playlist_id;
        }
    }

    function Store() {
        this.add_report_processor = function(url, processor, error){
            if(this.exist_report_processor(url, processor))
                return;

            if(!report_processors[url])
                report_processors[url] = '';
		
            report_processors[url] = processor + ' : ' + error;
            showtime.trace('Entry succesfully reported in local store.');
        }

        this.exist_report_processor = function(url, processor){
            if(report_processors[url] && report_processors[url] == processor){
                return true;
            }else{ return false; }
        }

        this.add_settings_playlist = function (name, id) {
            if (this.exist_user_playlist(name))
                return;

            user_playlists[name] = id;
            showtime.trace('Playlist #' + id + ' saved locally.');
        }

        this.exist_user_playlist = function (name) {
            if (user_playlists[name] && user_playlists[name] != "") {
                return true;
            } else { return false; }
        }

        this.add_to_playlist = function (playlist, item) {
            if (!item)
                return false;

            // Attempt to remove the item from playlist, if it doesn't exist the function called will return
            this.remove_from_playlist(playlist, item);

            var item1 = {};
            if (item.type == 'playlist' || item.type == 'plx') {
                item1 = {
                    'type': "playlist",
                    'version': item.version,
                    'background': item.background,
                    'name': item.name,
                    'thumb': item.thumb,
                    'URL': item.URL
                }
            }
            else item1 = item;

            var array1 = [item1];
            try {
                var list = eval(eval(this[playlist]).list);
                var array = array1.concat(list);
                this[playlist].list = showtime.JSONEncode(array);

                return true;
            }
            catch (ex) { showtime.trace("Error while adding item to playlist: " + ex); return false; }
        }

        this.exist_in_playlist = function (playlist, item) {
            var result = {
                found: false,
                id: -1,
                supported: true
            };

            if (eval(this[playlist]).list == "[]")
                return result;

            try {
                var list = eval(eval(this[playlist]).list);
                for (var i in list) {
                    if (item.name == list[i].name && item.URL == list[i].URL && item.processor == list[i].processor) {
                        result.found = true;
                        result.id = i;
                        result.supported = i;
                        return result;
                    }
                }
            }
            catch (ex) {
                result.supported = false;
                return result;
            }
            return result;
        }

        this.remove_from_playlist = function (playlist, item) {
            t("Removing item from playlist: " + playlist);
            if (eval(this[playlist]).list == "[]")
                return false;

            var exist = this.exist_in_playlist(playlist, item);
            if (exist.found) {
                var i = exist.id;
                var list_str = eval(this[playlist]).list;
                var list = eval(list_str);
                list.splice(i, 1);
                this[playlist].list = showtime.JSONEncode(list);
                return true;
            }
            else return false;
        }
    }

    function IMDB() {
        this.getList = function (link) {
            var result = {};

            try {
                var data = showtime.httpGet(link).toString().replace(/\r?\n/, '');
                
                var title = data.match("<title>(.+?)</title>")[1];
                playlist.title = title;

                //page.metadata.background = "";

                var split = data.split('<div class="list_item');
                for (var i in split) {
                    var item = split[i];
                    var title = item.match('alt="Image of (.+?)"');
                    var id = item.match('href="\/title\/(.+?)\/"');
                    var cover = item.match('loadlate="(.+?)"');
                    var year = item.match('<span class="year_type">(.+?)<\/span>');
                    //var description = item.match('<div class="item_description">(.+?)<span>');
                    //var rating = item.match('title="Users rated this (.+?)\/10');

                    if (!title)
                        continue;

                    title = title[1];
                    id = id[1];
                    //description = description[1];
                    //rating = parseFloat(rating[1]) / 2;

                    if (cover)
                        cover = cover[1];
                    else {
                        cover = item.match('<img src="(.*?)"');
                        if (!cover)
                            cover = "";
                        else {
                            cover = cover[1];
                        }
                    }

                    var t = title;
                    if (year) t += " " + year[1];

                    playlist.list.push({
                        name: t,
                        thumb: cover,
                        type: "imdb",
                        ID: id,
                        version: 8
                    });
                }

                result.error = false;
                return result;
            }
            catch (ex) {
                showtime.trace(ex);
                result.error = true;
                result.errorMsg = ex;
                return result;
            }
        }
    }

    function trim(s) {
        return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ").replace(/\t/, '');
    }

    function convert(c) {
        c = trim(c).replace('=', '');
        switch (c) {
            case 'brown':
                return 'A52A2A';
            case 'bisque':
                return 'FFE4C4';
            case 'aqua':
                return '00FFFF';
            case 'red':
                return 'FF0000';
            case 'green':
                return '00FF00';
            case 'blue':
                return '0000FF';
            case 'white':
            case '000000':
                return 'FFFFFF';
            default:
                if (c.length > 8) c = c.substr(0, 8);
                if (c.length == 8) return c.substr(2, 6);
                return c;
        }
    }

    function parse_string_color(text, size) {
        var lastPos = 0, textOut = '', lastColor = '';
        while (lastPos < text.length) {
            var openTagStartPos = text.indexOf('[COLOR', lastPos);
            if (openTagStartPos > -1) {
                textOut += text.substring(lastPos, openTagStartPos);
                var openTagEndPos = text.indexOf(']', openTagStartPos);
                lastColor = text.substring(openTagStartPos, openTagEndPos + 1);
                var closeTagStartPos = text.indexOf('[/COLOR]', openTagEndPos);
                var orphanTagStartPos = text.substring(openTagEndPos, closeTagStartPos).indexOf('[COLOR');
                if (orphanTagStartPos > -1) {
                    textOut += lastColor + text.substring(openTagEndPos + 1, openTagEndPos + orphanTagStartPos) + '[/COLOR]'; //p.3.1
                    textOut += text.substring(openTagEndPos + orphanTagStartPos, closeTagStartPos) + '[/COLOR]' + lastColor;
                    lastPos = closeTagStartPos+7;
                } else {
                    textOut += text.substring(openTagStartPos, closeTagStartPos+8);
                    lastPos = closeTagStartPos + 7;
                }
            } else {
               textOut += text.substr(lastPos);
               break;
            }
            lastPos++;
        }
        var text_final = textOut.replace(/\[COLOR([^\]]+)\]/g, function (match, color) {
            return '<font color="#' + convert(color) + '" size="'+size+'>';
        });
        return '<font color="#ffffff" size="' + size + '>' + text_final.replace(/\[\/COLOR\]/g, '<\/font>').replace(/\s{2,}/g, ' ') + '<\/font>';
    }

    function ProcessorLocalFilename(url) {
        var re_procname=new RegExp('([^/]+)$');
        var match=re_procname.exec(url);
        if (!match)
            return ''

        var proc = '';
        for (var i = 1; i < match.length; i++) {
            proc += match[i];
        }

        return escape(proc);
    }

    function uniqid(prefix, more_entropy) {
        // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +    revised by: Kankrelune (http://www.webfaktory.info/)
        // %        note 1: Uses an internal counter (in php_js global) to avoid collision
        // *     example 1: uniqid();
        // *     returns 1: 'a30285b160c14'
        // *     example 2: uniqid('foo');
        // *     returns 2: 'fooa30285b1cd361'
        // *     example 3: uniqid('bar', true);
        // *     returns 3: 'bara20285b23dfd1.31879087'
        if (typeof prefix == 'undefined') {
            prefix = "";
        }

        var retId;
        var formatSeed = function (seed, reqWidth) {
            seed = parseInt(seed, 10).toString(16); // to hex str
            if (reqWidth < seed.length) { // so long we split
                return seed.slice(seed.length - reqWidth);
            }
            if (reqWidth > seed.length) { // so short we pad
                return Array(1 + (reqWidth - seed.length)).join('0') + seed;
            }
            return seed;
        };

        // BEGIN REDUNDANT
        if (!this.php_js) {
            this.php_js = {};
        }
        // END REDUNDANT
        if (!this.php_js.uniqidSeed) { // init seed with big random int
            this.php_js.uniqidSeed = Math.floor(Math.random() * 0x75bcd15);
        }
        this.php_js.uniqidSeed++;

        retId = prefix; // start with prefix, add current milliseconds hex string
        retId += formatSeed(parseInt(new Date().getTime() / 1000, 10), 8);
        retId += formatSeed(this.php_js.uniqidSeed, 5); // add seed hex string
        if (more_entropy) {
            // for more entropy we add a float lower to 10
            retId += (Math.random() * 10).toFixed(8).toString();
        }

        return retId;
    }

    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g,'');
    };

    function insertionSort(array, field) {
        for (var i = 0, j, tmp; i < array.length; ++i) {
            tmp = array[i];

            for (j = i - 1; j >= 0 && array[j][field] > tmp[field]; --j)
                array[j + 1] = array[j];
            array[j + 1] = tmp;
        }

        return array;
    }

    function addPageOptions(page) {
        page.options.createInt('childTilesX', 'Number of X Child Tiles', 6, 1, 10, 1, '', function (v) {
            page.metadata.childTilesX = v;
        }, true);

        page.options.createInt('childTilesY', 'Number of Y Child Tiles', 3, 1, 4, 1, '', function (v) {
            page.metadata.childTilesY = v;
        }, true);

        page.options.createBool('informationBar', 'Information Bar', true, function (v) {
            page.metadata.informationBar = v;
        }, true);
    }

    function encodeString(decoded) {
        var array = [];
        for (var i = 0; i < decoded.length; i++) {
            array.push(decoded.charCodeAt(i));
        }
        var encoded = array.join("|");
        t("Decoded: " + decoded + "\nEncoded: " + encoded);
        return encoded;
    }

    function decodeString(encoded) {
        var decoded = "";
        var split = encoded.split("|");
        for (var i in split) {
            var ch = split[i];
            decoded += String.fromCharCode(ch);
        }
        t("Encoded: " + encoded + "\nDecoded: " + decoded);
        return decoded;
    }

    function e(ex) {
        t(ex);
        t("Line #" + ex.lineNumber);
    }
    
    function t(message) {
        showtime.trace(message, plugin.getDescriptor().id);
    }
    
    function p(message) {
        showtime.print(message);
    }
	
    plugin.addURI(PREFIX + ":start", function(page) {
        if (service.enableLogin) {
            try {
                // Try to parse some possible previous authentications and check if adult content value changed
                server.init();
                server.adultContent();
            } catch (ex) {
                e(ex); showtime.notify('Error while authenticating and parsing default playlists', 2);
            }
        }

        page.type = "directory";
        page.contents = "list";
        page.metadata.background = plugin.path + "views/img/background.png";

        if (service.customViews) {
            addPageOptions(page);
            page.metadata.glwview = plugin.path + "views/array.view";
        };

        playlist = new Playlist(page, "store://homeitems", new MediaItem());
        result = playlist.loadPlaylist("store://homeitems", false);

        playlist = new Playlist(page, home_URL, new MediaItem());
        var result = playlist.loadPlaylist(home_URL);

        page.loading = false;
    });
})(this);