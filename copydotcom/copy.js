/**
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
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function(plugin) {
    var CONSUMER_KEY='I8lxlFw7HtTjiCe8oKhHQlQPy9PsM527';
    var CONSUMER_SECRET='dfET0lUInz48z1sGLVkWPlOWJUaeMDkTNtYxipqhV6SCJnYV';
    var logo = plugin.path + 'logo.png';
    var doc; API = 'https://api.copy.com';

    var blue = '6699CC', orange = 'FFA500', red = 'EE0000', green = '008B45';

    function colorStr(str, color) {
        return '<font color="' + color + '"> (' + str + ')</font>';
    }

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    plugin.createService(plugin.getDescriptor().title, 'copy:browse:/', 'other', true, logo);
  
    var store = plugin.createStore('authinfo', true);

    var settings = plugin.createSettings(plugin.getDescriptor().id, logo, plugin.getDescriptor().synopsis);
    settings.createAction('clearAuth', 'Unlink from ' + plugin.getDescriptor().title + '...', function() {
        store.access_token = '';
        showtime.notify('Showtime is unlinked from ' + plugin.getDescriptor().title, 3, '');
    });

    function bytesToSize(bytes) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return '0 Byte';
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    };

    function login(page) {
        page.loading = true;
        var tokens = showtime.httpReq(API + '/oauth/request', {
            headers: {
                Authorization: 'OAuth oauth_version="1.0", ' +
                    'oauth_signature_method="PLAINTEXT", ' +
                    'oauth_consumer_key="' + CONSUMER_KEY + '", ' +
                    'oauth_signature="' + CONSUMER_SECRET + '&", ' +
                    'oauth_nonce="' + showtime.md5digest(new Date().getTime()) + '", ' +
                    'oauth_timestamp="' + new Date().getTime() + '", ' +
                    'oauth_callback="oob"'
            }
        }).toString();

        var requestTokenSecret = tokens.match(/oauth_token_secret=([\s\S]*?)&/)[1];

        doc = showtime.httpReq('https://www.copy.com/applications/authorize?oauth_token=' + tokens.match(/oauth_token=([\s\S]*?)&/)[1]);

        doc = showtime.httpReq('https://www.copy.com/auth/login', {
            headers: {
                'Host': 'www.copy.com',
                'Origin': 'https://www.copy.com',
                'Referer': 'https://www.copy.com/applications/authorize?oauth_token=' + tokens.match(/oauth_token=([\s\S]*?)&/)[1]
            },
            postdata: {
                redirect: '/applications/authorize_allow?oauth_token=' + tokens.match(/oauth_token=([\s\S]*?)&/)[1],
                source: '',
                user_count: '',
                username: '',
                password: ''
            },
            noFollow: true
        });

        doc = showtime.httpReq(doc.headers.location, {
            noFollow: true
        });

        tokens = doc.headers.location.match(/oauth_token=([\s\S]*?)&oauth_verifier=([\s\S]*?)$/);

        tokens = showtime.httpReq(API + '/oauth/access', {
            headers: {
                Authorization: 'OAuth oauth_verifier="' + tokens[2] + '", ' +
                    'oauth_consumer_key="' + CONSUMER_KEY + '", ' +
                    'oauth_signature_method="PLAINTEXT", ' +
                    'oauth_nonce="' + showtime.md5digest(new Date().getTime()) + '", ' +
                    'oauth_timestamp="' + new Date().getTime() + '", ' +
                    'oauth_version="1.0", ' +
                    'oauth_token="' + tokens[1] + '", ' +
                    'oauth_signature="' + CONSUMER_SECRET + '&' + requestTokenSecret + '"'
            },
            postdata: {}
        }).toString();

        store.access_token = tokens.match(/oauth_token=([\s\S]*?)&/)[1];
        store.access_secret = tokens.match(/oauth_token_secret=([\s\S]*?)$/)[1];
        page.loading = false;
    }

    function getData(page, path) {
        try {
            page.loading = true;
            doc = showtime.JSONDecode(showtime.httpReq(API + path, {
                headers: {
                    'X-Api-Version': 1,
                    Authorization: 'OAuth oauth_consumer_key="' + CONSUMER_KEY + '", ' +
                        'oauth_signature_method="PLAINTEXT", ' +
                        'oauth_nonce="' + showtime.md5digest(new Date().getTime()) + '", ' +
                        'oauth_timestamp="' + new Date().getTime() + '", ' +
                        'oauth_version="1.0", ' +
                        'oauth_token="' + store.access_token + '", ' +
                        'oauth_signature="' + CONSUMER_SECRET + '&' + store.access_secret + '"'
                }
            }));
            page.loading = false;
        } catch(err) {
            login();
        }
    }

    plugin.addURI("copy:browse:(.*)", function(page, path) {
        page.type = "directory";
        page.content = "items";
        page.loading = true;
        if (!store.access_token)
            login(page);

        getData(page, '/rest/meta');
        showtime.print(showtime.JSONEncode(doc));

        var title = doc.path.split('/');
        if (doc.path == '/') {
            page.metadata.title = plugin.getDescriptor().title + ' Root';
            getData(page, '/rest/user');
            showtime.print(showtime.JSONEncode(doc));
            page.appendPassiveItem('video', '', {
                title: new showtime.RichText(coloredStr('Account info', orange)),
                icon: 'https:' + showtime.entityDecode(doc.avatar_url),
                description: new showtime.RichText(
                    coloredStr('\nFirst name: ', orange) + doc.first_name +
                    coloredStr('\nLast name: ', orange) + doc.last_name +
                    coloredStr('\nEmail: ', orange) + doc.email +
                    coloredStr('\nUsed: ', orange) + bytesToSize(doc.storage.used) +
                    coloredStr('\nQuota: ', orange) + bytesToSize(doc.storage.quota) +
                    coloredStr('\nSaved: ', orange) + bytesToSize(doc.storage.saved) +
                    coloredStr('\nID: ', orange) + doc.id +
                    coloredStr('\nCreated time: ', orange) + new Date(doc.created_time * 1000)
                )
            });
        } else
            page.metadata.title = title[title.length-1];
        ls(page, doc.contents);
    });

    function ls(page, json) {
        // folders first
        for (var i in json) {
            if (json[i].is_dir) {
                var title = json[i].path.split('/');
                title = title[title.length-1]
                page.appendItem("copy:browse:" + showtime.pathEscape(json[i].path), "directory", {
                    title: new showtime.RichText(title + colorStr(json[i].modified.replace(/ \+0000/, ''), orange))
	        });
                page.entries++;
            }

        }

        // then files
        for (var i in json) {
            if (!json[i].is_dir) {
                var title = json[i].path.split('/');
                title = title[title.length-1]
                var url = 'https://api-content.dropbox.com/1/files/dropbox' + showtime.pathEscape(json[i].path) + '?access_token=' + store.access_token;
                if (json[i].path.split('.').pop().toUpperCase() == 'PLX')
                    url = 'navi-x:playlist:playlist:' + escape(url)
                var type = json[i].mime_type.split('/')[0];

	        page.appendItem(url, type, {
	            title: new showtime.RichText(title + colorStr(json[i].size, blue) + ' ' + json[i].modified.replace( /\+0000/, ''))
	        });
                page.entries++;
            }
        }
    }

    plugin.addSearcher(plugin.getDescriptor().title, logo, function(page, query) {
        page.entries = 0;
        page.loading = true;
        var json = showtime.JSONDecode(showtime.httpReq(API + 'search/auto/', {
            args: {
                access_token: store.access_token,
                query: query
            }
        }));
        page.loading = false;
        ls(page, json);
    });
})(this);