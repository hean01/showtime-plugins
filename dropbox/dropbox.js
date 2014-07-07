/**
 *  Copyright (C) 2011-2014 Andreas Öman, lprot
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
    var OAUTH_CONSUMER_KEY='wuqod6evftbfe5k';
    var OAUTH_CONSUMER_SECRET='mg4qqagy2ingdue';
    var logo = plugin.path + 'logo.png';
    var doc, slogan = 'Your stuff, anywhere';

    var blue = '6699CC', orange = 'FFA500', red = 'EE0000', green = '008B45';

    function colorStr(str, color) {
        return '<font color="' + color + '"> (' + str + ')</font>';
    }

    plugin.createService('Dropbox', 'dropbox:browse:/', 'other', true, logo);
  
    var store = plugin.createStore('authinfo', true);

    var settings = plugin.createSettings("Dropbox", logo, slogan);
    settings.createAction('clearAuth', 'Unlink from Dropbox...', function() {
        store.access_token = '';
        showtime.notify('Showtime is unlinked from Dropbox', 3, '');
    });

    plugin.addURI("dropbox:auth:(.*)", function(page, code) {
        page.loading = false;
        try {
            page.loading = true;
            doc = showtime.httpReq("https://api.dropbox.com/1/oauth2/token", {
                postdata: {
                    'grant_type': 'authorization_code',
                    'code': code,
                    'client_id': OAUTH_CONSUMER_KEY,
                    'client_secret': OAUTH_CONSUMER_SECRET
                }
            });
            page.loading = false;
        } catch (err) {
            page.error('Wrong code. Please try again.');
            return;
        }
        var json = showtime.JSONDecode(doc);
        if (json.access_token)
            store.access_token = json.access_token;
        else {
            page.error('Unknown error!');
            return;
        }
        page.redirect('dropbox:browse:/');
    });

    plugin.addURI("dropbox:browse:(.*)", function(page, path) {
        page.type = "directory";
        page.content = "items";
        page.loading = false;

        if (!store.access_token) {
            var msg =  'To link Dropbox to Showtime, on any PC with internet browser open\n\n' +
                       'http://dropbox.com/1/oauth2/authorize?response_type=code&client_id=' + OAUTH_CONSUMER_KEY +
                       '\n\nSign in to Dropbox and allow Showtime to access your folders and files.'+
                       '\nAfter allowing the access - Dropbox will show you the code that you should enter to the textbox below:\n'+
                       '(alternatively you can enter the code via http://showtimeIP:42000/ as dropbox:auth:CodeFromDropbox'

            while (1) {
                var result = showtime.textDialog(msg, true, true);
                if (result.rejected) {
                    page.error('You need to link Dropbox to Showtime to continue');
                    return;
                }
                try {
                    page.loading = true;
                    doc = showtime.httpReq("https://api.dropbox.com/1/oauth2/token", {
                        postdata: {
                            'grant_type': 'authorization_code',
                            'code': result.input,
                            'client_id': OAUTH_CONSUMER_KEY,
                            'client_secret': OAUTH_CONSUMER_SECRET
                        }
                    });
                    page.loading = false;
                } catch (err) {
                    showtime.notify("Wrong code, please try again...", 5, '');
                    continue;
                }
                var json = showtime.JSONDecode(doc);
                if (json.access_token) {
                    store.access_token = json.access_token;
                    break;
                }
            }
        }

        page.loading = true;
        var doc = showtime.JSONDecode(showtime.httpReq("https://api.dropbox.com/1/metadata/dropbox" + path + '?access_token='+store.access_token));
        page.loading = false;

        if (!doc.is_dir) {
            page.error("Browsing non directory item");
            return;
        }
        var title = doc.path.split('/')
        page.metadata.title = doc.path != '/' ? title[title.length-1] : "Dropbox Root";

        for (var i = 0; i < doc.contents.length; i++) {
            var item = doc.contents[i];
            var title = item.path.split('/');
            title = title[title.length-1];
            if (item.is_dir) {
                page.appendItem("dropbox:browse:" + showtime.pathEscape(item.path), "directory", {
                    title: new showtime.RichText(title + colorStr(item.modified.replace(/ \+0000/, ''), orange))
	        });
            } else {
                var url = "https://api-content.dropbox.com/1/files/dropbox" + showtime.pathEscape(item.path) + '?access_token='+store.access_token;
                var type = item.mime_type.split('/')[0];
	        page.appendItem(url, type, {
	            title: new showtime.RichText(title + colorStr(item.size, blue) + ' ' + item.modified.replace( /\+0000/, ''))
	        });
            }
        }
    });
})(this);