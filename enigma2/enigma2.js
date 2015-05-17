/*
 *  Enigma2 plugin for Movian Media Center
 *
 *  Copyright (C) 2015 lprot
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

var XML = require('showtime/xml');

(function(plugin) {
    var logo = plugin.path + "logo.png";

    function setPageHeader(page, title) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.logo = logo;
	page.metadata.title = title;
	page.loading = false;
    }

    var blue = '6699CC', orange = 'FFA500', red = 'EE0000', green = '008B45';

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    function colorStr(str, color) {
        return coloredStr(' (' + str + ')', color);
    }

    function trim(s) {
        if (!s) return '';
        return s.replace(/^\s+|\s+$/g, '');
    };

    var service = plugin.createService(plugin.getDescriptor().title, plugin.getDescriptor().id + ":start", "tv", true, logo);

    var settings = plugin.createSettings(plugin.getDescriptor().title, logo, plugin.getDescriptor().synopsis);
    settings.createDivider("Look & Feel");
    settings.createBool("showScreenshot", "Show Screenshot", true, function(v) {
        service.showScreenshot = v;
    });
    settings.createBool("showProviders", "Show Providers", true, function(v) {
        service.showProviders = v;
    });
    settings.createBool("showAllServices", "Show All services", true, function(v) {
        service.showAllServices = v;
    });
    settings.createBool("zap", "Zap before channelswitch", true, function(v) {
        service.zap = v;
    });

    var store = plugin.createStore('config', true);

    // Play current channel
    plugin.addURI(plugin.getDescriptor().id + ":streamFromCurrent:(.*)", function(page, url) {
        page.loading = true;
        var doc = showtime.httpReq(unescape(url) + '/web/getcurrent');
        doc = XML.parse(doc);
        page.loading = false;
        page.type = 'video';
        page.source = "videoparams:" + showtime.JSONEncode({
            title: doc.e2currentserviceinformation.e2service.e2servicename,
            no_fs_scan: true,
            canonicalUrl: plugin.getDescriptor().id + ':streamFromCurrent',
            sources: [{
                url: unescape(url).replace('https:', 'http:') + ':8001/' + doc.e2currentserviceinformation.e2service.e2servicereference,
                mimetype: 'video/mp2t'
            }],
            no_subtitle_scan: true
        });
    });

    plugin.addURI(plugin.getDescriptor().id + ":zapTo:(.*):(.*):(.*)", function(page, url, serviceName, serviceReference) {
        page.loading = true;
        if (service.zap)
            var doc = showtime.httpReq(unescape(url) + '/web/zap?sRef=' + serviceReference);

        page.type = 'video';
        page.loading = false;
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(serviceName),
            no_fs_scan: true,
            canonicalUrl: plugin.getDescriptor().id + ':zapTo:' + url + ':' + serviceName + ':' + serviceReference,
            sources: [{
                url: unescape(url).replace('https:', 'http:') + ':8001/' + serviceReference,
                mimetype: 'video/mp2t'
            }],
            no_subtitle_scan: true
        });
    });

    plugin.addURI(plugin.getDescriptor().id + ":getServices:(.*):(.*):(.*)", function(page, url, serviceName, serviceReference) {
        setPageHeader(page, unescape(url) + ' - ' + trim(unescape(serviceName)));
        page.loading = true;
        var doc = showtime.httpReq(unescape(url) + '/web/getservices?sRef=' + serviceReference);
        page.loading = false;
        doc = XML.parse(doc);
        try {
            var e2services = doc.e2servicelist.filterNodes('e2service');
            for (var i = 0; i < e2services.length; i++)
                 page.appendItem(plugin.getDescriptor().id + ":zapTo:" + url + ':' + escape(e2services[i].e2servicename) + ':' + encodeURIComponent(e2services[i].e2servicereference), "video", {
                     title: e2services[i].e2servicename
                 });
        } catch(err) {
            page.error('The list is empty');
        }
    });

    plugin.addURI(plugin.getDescriptor().id + ":bouquets:(.*)", function(page, url) {
        setPageHeader(page, unescape(url) + ' - Bouquets');
        page.loading = true;
        var doc = showtime.httpReq(unescape(url) + '/web/getservices');
        page.loading = false;
        doc = XML.parse(doc);
        var e2services = doc.e2servicelist.filterNodes('e2service');
        if (e2services.length)
            page.metadata.title += ' (' + e2services.length + ')';
        for (var i = 0; i < e2services.length; i++) {
             page.appendItem(plugin.getDescriptor().id + ":getServices:" + url + ':' + escape(e2services[i].e2servicename) + ':' + encodeURIComponent(e2services[i].e2servicereference), "directory", {
                 title: e2services[i].e2servicename
             });
        }
    });

    plugin.addURI(plugin.getDescriptor().id + ":providers:(.*)", function(page, url) {
        setPageHeader(page, unescape(url) + ' - Providers');
        page.loading = true;
        var doc = showtime.httpReq(unescape(url) + '/web/getservices?sRef=' +
            encodeURIComponent('1:7:1:0:0:0:0:0:0:0:(type == 1) || (type == 17) || (type == 195) || (type == 25) FROM PROVIDERS ORDER BY name'));
        page.loading = false;
        doc = XML.parse(doc);
        var e2services = doc.e2servicelist.filterNodes('e2service');
        if (e2services.length)
            page.metadata.title += ' (' + e2services.length + ')';
        for (var i = 0; i < e2services.length; i++) {
             page.appendItem(plugin.getDescriptor().id + ":getServices:" + url + ':' + escape(e2services[i].e2servicename) + ':' + encodeURIComponent(e2services[i].e2servicereference), "directory", {
                 title: trim(e2services[i].e2servicename)
             });
        }
    });

    plugin.addURI(plugin.getDescriptor().id + ":all:(.*)", function(page, url) {
        setPageHeader(page, unescape(url) + ' - All services');
        page.loading = true;
        var doc = showtime.httpReq(unescape(url) + '/web/getservices?sRef=' +
            encodeURIComponent('1:7:1:0:0:0:0:0:0:0:(type == 1) || (type == 17) || (type == 195) || (type == 25) ORDER BY name'));
        page.loading = false;
        doc = XML.parse(doc);
        var e2services = doc.e2servicelist.filterNodes('e2service');
        if (e2services.length)
            page.metadata.title += ' (' + e2services.length + ')';
        for (var i = 0; i < e2services.length; i++) {
             page.appendItem(plugin.getDescriptor().id + ":zapTo:" + url + ':' + escape(e2services[i].e2servicename) + ':' + encodeURIComponent(e2services[i].e2servicereference), "video", {
                 title: trim(e2services[i].e2servicename)
             });
        }
    });

    plugin.addURI(plugin.getDescriptor().id + ":processReceiver:(.*)", function(page, url) {
        setPageHeader(page, unescape(url));

        var description = '';
        try {
            page.loading = true;
            var doc = showtime.httpReq(unescape(url) + '/web/about');
            doc = XML.parse(doc);
            description = coloredStr('Current service: ', orange) + doc.e2abouts.e2about.e2servicename +
                coloredStr('\nService provider: ', orange) + doc.e2abouts.e2about.e2serviceprovider +
                coloredStr('\nReceiver model: ', orange) + doc.e2abouts.e2about.e2model +
                coloredStr('\nFirmware version: ', orange) + doc.e2abouts.e2about.e2imageversion +
                coloredStr('\nEnigma version: ', orange) + doc.e2abouts.e2about.e2enigmaversion +
                coloredStr('\nWebif version: ', orange) + doc.e2abouts.e2about.e2webifversion
        } catch(err) {
            page.error(err);
            return;
        }

        page.appendItem(plugin.getDescriptor().id + ":streamFromCurrent:" + url, "video", {
            title: 'Stream from the current service',
            icon: unescape(url) + '/grab?format=jpg&r=640',
            description: new showtime.RichText(description)
        });
        if (service.showScreenshot)
            page.appendItem(unescape(url) + '/grab?format=jpg&r=1080', "image", {
                title: 'Screenshot from the current service'
            });

        page.appendItem(plugin.getDescriptor().id + ":bouquets:" + url, "directory", {
            title: 'Bouquets'
        });
        if (service.showProviders)
            page.appendItem(plugin.getDescriptor().id + ":providers:" + url, "directory", {
                title: 'Providers'
            });

        if (service.showAllServices)
            page.appendItem(plugin.getDescriptor().id + ":all:" + url, "directory", {
                title: 'All services'
            });
        page.loading = false;
    });

    function showReceivers(page) {
        page.flush();
        if (!store.receivers) {
            page.appendPassiveItem("directory", '' , {
	        title: "Receiver's list is empty, you can add a receiver from the page menu"
            });
        } else {
            var receivers = store.receivers.split(',');
            for (var i in receivers) {
                var item = page.appendItem(plugin.getDescriptor().id + ":processReceiver:" + receivers[i], "directory", {
                    title: unescape(receivers[i])
                });
                item.id = +i;
                item.title = unescape(receivers[i]);
                item.onEvent("deleteReceiver", function(item) {
                    var arr = store.receivers.split(',');
                    arr.splice(this.id, 1);
                    store.receivers = arr.toString();
	            showtime.notify("'" + this.title + "' has been deleted from the list.", 2);
                    showReceivers(page);
	        }.bind(item));
                item.addOptAction("Delete receiver '" + unescape(receivers[i]) + "' from the list", "deleteReceiver");
            }
        }
    }

    // Start page
    plugin.addURI(plugin.getDescriptor().id + ":start", function(page) {
        setPageHeader(page, plugin.getDescriptor().synopsis);
        page.options.createAction('addReceiver', 'Add receiver', function() {
            var result = showtime.textDialog('Enter IP or DNS address of the receiver like:\n' +
                'http://192.168.0.1 or https://192.168.0.1 or http://nameOfTheReceiver or https://nameOfTheReceiver', true, true);
            if (!result.rejected && result.input) {
                var receivers = [];
                if (store.receivers)
                    receivers = store.receivers.split(',');
                receivers.push(escape(result.input));
                store.receivers = receivers.toString();
                showtime.notify("Receiver '" + result.input + "' has been added to the list.", 2);
                showReceivers(page);
            }
        });
        showReceivers(page);
    });
})(this);