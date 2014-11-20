/**
 *  Copyright (C) 2014 lprot, w00fer
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
    var doc, API = 'https://api.copy.com', setHeader = false;

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

        if (!store.access_token) {
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

            while (1) {
                page.loading = false;
                var credentials = plugin.getAuthCredentials(plugin.getDescriptor().synopsis, 'Please enter email and password to authorize Showtime', true, false, true);
                if (credentials.rejected)
                     return 0;
                if (credentials.username && credentials.password) {
                    page.loading = true;
                    try {
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
                                username: credentials.username,
                                password: credentials.password
                            },
                            noFollow: true
                        });
	                var err = doc.toString().match(/<div class="flash-message error">([\s\S]*?)<\/div>/);
                        if (err) {
                            page.loading = false;
                            showtime.message(err[1].trim(), true, false);
                            continue;
                        } else
                            break;
                    } catch(err) {
                        page.loading = false;
                        continue;
                    }
                } else
                    continue;
            }

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
            setHeader = false;
        }
        page.loading = false;
        return 1;
    }

    function getData(page, path) {
        if (!store.access_token) {
            if (!login(page))
                return 0;
        }

        if (!setHeader) {
            showtime.trace('Adding HTTP auth handlers');
            plugin.addHTTPAuth('https:\/\/.*.copy.com.*', function(req) {
                showtime.trace('1');
                req.setHeader('X-Api-Version', 1);
                req.setHeader('Authorization', 'OAuth oauth_consumer_key="' + CONSUMER_KEY + '", ' +
                        'oauth_signature_method="PLAINTEXT", ' +
                        'oauth_nonce="' + showtime.md5digest(new Date().getTime()) + '", ' +
                        'oauth_timestamp="' + new Date().getTime() + '", ' +
                        'oauth_version="1.0", ' +
                        'oauth_token="' + store.access_token + '", ' +
                        'oauth_signature="' + CONSUMER_SECRET + '&' + store.access_secret + '"');
            });
            plugin.addHTTPAuth('[\\s\\S]*?copy\.com.*', function(req) {
                showtime.trace('2');
                req.setHeader('X-Api-Version', 1);
                req.setHeader('Authorization', 'OAuth oauth_consumer_key="' + CONSUMER_KEY + '", ' +
                        'oauth_signature_method="PLAINTEXT", ' +
                        'oauth_nonce="' + showtime.md5digest(new Date().getTime()) + '", ' +
                        'oauth_timestamp="' + new Date().getTime() + '", ' +
                        'oauth_version="1.0", ' +
                        'oauth_token="' + store.access_token + '", ' +
                        'oauth_signature="' + CONSUMER_SECRET + '&' + store.access_secret + '"');
            });

            plugin.addHTTPAuth(API + '.*', function(req) {
                showtime.trace('3');
                req.setHeader('X-Api-Version', 1);
                req.setHeader('Authorization', 'OAuth oauth_consumer_key="' + CONSUMER_KEY + '", ' +
                        'oauth_signature_method="PLAINTEXT", ' +
                        'oauth_nonce="' + showtime.md5digest(new Date().getTime()) + '", ' +
                        'oauth_timestamp="' + new Date().getTime() + '", ' +
                        'oauth_version="1.0", ' +
                        'oauth_token="' + store.access_token + '", ' +
                        'oauth_signature="' + CONSUMER_SECRET + '&' + store.access_secret + '"');
            });

            setHeader = true;
        }

        try {
            page.loading = true;
            doc = showtime.JSONDecode(showtime.httpReq(API + path));
            page.loading = false;
        } catch(err) {
            store.access_token = '';
            return setHeader = false;
        }
        return 1;
    }

    plugin.addURI("copy:browse:(.*)", function(page, path) {
        page.type = "directory";
        page.content = "items";
        page.loading = true;

        if (getData(page, '/rest/meta' + unescape(path))) {
            var json = doc;
            var title = doc.path.split('/');
            if (doc.id == '/') {
                page.metadata.title = plugin.getDescriptor().title + ' Root';
                getData(page, '/rest/user');
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
                page.metadata.title = doc.name;
            ls(page, json.children);
        } else
            page.error('Cannot login to ' + plugin.getDescriptor().title);
    });

    function ls(page, json) {
        //showtime.print(showtime.JSONEncode(json));
        // folders first
        for (var i in json) {
            if (json[i].type != 'file') {
                var title = json[i].path.split('/');
                title = json[i].name;
                page.appendItem("copy:browse:" + escape(json[i].id), "directory", {
                    title: new showtime.RichText(title)
	        });
                page.entries++;
            }

        }

        // then files
        for (var i in json) {
            if (json[i].type == 'file') {
                var title = json[i].path.split('/');
                title = title[title.length-1]
                var url = json.url;
                if (json[i].path.split('.').pop().toUpperCase() == 'PLX')
                    url = 'navi-x:playlist:playlist:' + escape(url)
                var type = json[i].mime_type.split('/')[0];
	        page.appendItem(API + '/rest/files' + encodeURI(json[i].path), type, {
	            title: new showtime.RichText(title + colorStr(bytesToSize(json[i].size), blue) + ' ' + new Date(json[i].modified_time * 1000))
	        });
                page.entries++;
            }
        }
    }
})(this);