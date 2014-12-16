/**
 * TED Talks plugin for Showtime Media Center
 *
 *  Copyright (C) 2012-2014 NP, lprot
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
    var TED = 'http://www.ted.com';
    var logo = plugin.path + "logo.png";

    var service = plugin.createService(plugin.getDescriptor().title, plugin.getDescriptor().id + ":start", "video", true, logo);

    plugin.addURI(plugin.getDescriptor().id + "list:(.*):(.*):(.*)", function(page, title, link, page_nbr) {
        page.type = "directory";
        page.contents = "video";
        page.metadata.logo = logo;
        page.metadata.title = "TED Talks: " + title;

        if (page_nbr > 1) {
            page.metadata.title = "TED Talks: " + title + " " + page_nbr;
            var linkp = link + "&page=" + page_nbr;
        } else
            var linkp = link;

        var content = showtime.httpGet(TED + "/talks/list" + linkp).toString();

        content = content.slice(content.indexOf('<div class="col clearfix">'),
            content.indexOf('<!-- sidebar -->')).split('<div class="col clearfix">');

        var name = null;
        var img = null;
        var pubDate = null;
        var year = null;
        var descrip = null;
        var duration = null;

        for (var i in content) {
            var talk = content[i];
            if (talk.indexOf('<a title="') != -1) {
                name = talk.slice(talk.indexOf('<a title="') + 10, talk.indexOf('" href="')).replace(/&quot;/g, '"');
                descrip = name;

                if (name.indexOf(":") != "-1");
                name = name.slice(0, name.indexOf(":"));

                img = talk.slice(talk.lastIndexOf('http://', talk.indexOf('" /></a>')), talk.indexOf('" /></a>'));
                if (showtime.probe(img.replace('132x99.jpg', '615x461.jpg')).result == 0)
                    img = img.replace('132x99.jpg', '615x461.jpg');

                pubDate = talk.slice(talk.indexOf('Posted:') + 8, talk.indexOf('</span', talk.indexOf('Posted:'))).replace('<span class="notranslate">', '');

                duration = talk.slice(talk.indexOf('<span class="notranslate">') + 26, talk.indexOf('</span', talk.indexOf('<span class="notranslate">')));

                var metadata = {
                    title: name,
                    description: descrip,
                    year: pubDate,
                    duration: duration,
                    icon: img
                };

                var url = talk.slice(talk.indexOf('href="') + 6, talk.indexOf('"', talk.indexOf('href="') + 6));
                if (talk.indexOf('/images/play_botw_icon.gif') == -1)
                    page.appendItem(plugin.getDescriptor().id + "videos:" + url.replace('http://', ''), "video", metadata);
                else
                if (service.youtube == "1")
                    page.appendItem('youtube:video:simple:' + escape(metadata.title) + ':' + getYoutubeId(url), "video", metadata);
            }
        }
        if (content[content.length - 1].indexOf('">Next') != -1) {
            page_nbr++;
            page.appendItem('ted:list:' + title + ':' + link + ':' + page_nbr, "directory", {
                title: "Next"
            });
        }
        page.loading = false;

    });

    plugin.addURI(plugin.getDescriptor().id + "videos:(.*)", function(page, url) {
        url = getUrl(url);

        page.source = "videoparams:" + showtime.JSONEncode({
            sources: [{
                url: url
            }]
        });
        page.type = "video";
    });

    function getUrl(link) {
        var content = showtime.httpGet(TED + link).toString();

        if (service.hd == 1)
            content = content.slice(content.lastIndexOf('http://', content.indexOf('.mp4')), content.indexOf('.mp4') + 4).replace('.mp4', '-480p.mp4');
        else
            content = content.slice(content.lastIndexOf('http://', content.indexOf('.mp4')), content.indexOf('.mp4') + 4);

        return content;
    }

    function getYoutubeId(link) {
        var content = showtime.httpGet(TED + link).toString();
        return content.slice(content.indexOf('/v/') + 3, content.indexOf('&', content.indexOf('/v/') + 3));
    }

    plugin.addURI(plugin.getDescriptor().id + ":start", function(page) {
        page.type = "directory";
        page.metadata.logo = logo;
        page.metadata.title = "TED Talks: " + "Order By";

        var list = {
            indice: [{
                    name: "Newest releases",
                    link: "?"
                }, {
                    name: "Date filmed",
                    link: "?orderedby=FILMED"
                }, {
                    name: "Most viewed",
                    link: "?orderedby=MOSTVIEWED"
                }, {
                    name: "Most emailed this week",
                    link: "?orderedby=MOSTEMAILED"
                }, {
                    name: "Most comments this week",
                    link: "?orderedby=MOSTDISCUSSED"
                }, {
                    name: "Rated jaw-dropping",
                    link: "?orderedby=JAW-DROPPING"
                }, {
                    name: "Rated persuasive",
                    link: "?orderedby=PERSUASIVE"
                }, {
                    name: "Rated courageous",
                    link: "?orderedby=COURAGEOUS"
                }, {
                    name: "Rated ingenious",
                    link: "?orderedby=INGENIOUS"
                }, {
                    name: "Rated fascinating",
                    link: "?orderedby=FASCINATING"
                }, {
                    name: "Rated inspiring",
                    link: "?orderedby=INSPIRING"
                }, {
                    name: "Rated beautiful",
                    link: "?orderedby=BEAUTIFUL"
                }, {
                    name: "Rated funny",
                    link: "?orderedby=FUNNY"
                }
            ]
        }

        for (var i in list.indice) {
            var indice = list.indice[i];
            page.appendItem(plugin.getDescriptor().id + 'list:' + indice.name + ':' + indice.link + ':' + "1", "directory", {
                title: indice.name
            });
        }
        page.loading = false;
    });
})(this);