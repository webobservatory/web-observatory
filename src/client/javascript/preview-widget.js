/**
 * encapsulate template in a widget
 * depends on jquery, jquery.widget (jquery-ui), ol3, ol3-layerswitcher, and _ (lodash), 
 **/

(function () {

    "use strict";

    // ensure deps are loaded
    if (!("ol" in window)) {
        console.log("openlayers not loaded");
        return;
    }

    if (!("_" in window)) {
        console.log("lodash not loaded");
        return;
    }
    if (!("jQuery" in window)) {
        console.log("jQuery not loaded");
        return;
    }
    if (!("widget" in window.jQuery)) {
        console.log("jqueryui not loaded");
        return;
    }
    var $ = window.jQuery;

    // console.log("defining geoWebObservatory");

    $.widget("geoWebObservatory.mapPreview", {
        // defaults
        options: {
            api: 'http://dallas.geodata.soton.ac.uk:6050',
            codeTemplateSelector: '#template'
        },
        _create: function createPreview() {
            // instantiate map, other data structures
            var id = this.element.get(0).id,
                inUpdateView = false,
                fitExtent = function (extent) {
                    inUpdateView = true;
                    this.map.getView().fit(extent, this.map.getSize());
                    inUpdateView = false;
                };
            if (!id) {
                id = "geo-web-obervatory-preview-map";
                this.element.get(0).id = id;
            }
            this.map = new ol.Map({
                target: id,
                view: new ol.View({ center: [0, 0], zoom: 2 }),
                layers: [ new ol.layer.Tile({ source: new ol.source.OSM() }) ],
                controls: [
                    new ol.control.LayerSwitcherCustom({ widget: this })
                ]
            });

            this.dynamicLayers = {};
            this.dynamicLayersData = {};

            this.updateView = updateViewDefault;

            function updateViewDefault(layer, zoomOutOnly) {
                // zoom to accommodate all layers to give users a sporting
                // chance to notice their own changes
                var extent = ol.extent.createEmpty();
                this.map.getLayers().forEach(function (layer) {
                    var src = layer.getSource(),
                        lyrExtent;
                    if (src && src.getExtent && (lyrExtent = src.getExtent())) {
                        ol.extent.extend(extent, lyrExtent);
                    }
                });
                if (!ol.extent.isEmpty(extent) &&
                    (!zoomOutOnly || ol.extent.containsExtent(
                        this.map.getView().calculateExtent(this.map.getSize()),
                        extent
                ))) {
                    fitExtent();
                }
            }
            function updateViewRespectUser(layer) {
                // once user has set a bbox, don't zoom after remove layer,
                // only zoom out to accommodate an added layer
                if (layer) { updateViewDefault(layer, true); }
            }
            // .once([many events], ...) fires once for each type of a event
            // use _.once to ensure only fires once overall
            this.map.getView().once(
                ["change:resolution", "change:center"],
                _.once(function (e) {
                    if (!inUpdateView) {
                        this.updateView = updateViewRespectUser;
                        fitExtent = function (extent) {
                            this.map.getView().fit(extent, this.map.getSize());
                        };
                    }
                }),
                this
            );
        },

        // public methods
        addLayerById: function requestLayerById(id) {
            $.get(this.options.api + "/datasources/" + id, this.receiveLayerById(id));
        },
        receiveLayerById: function (id) {
            if (!("OL3LayerFactory" in window)) {
                console.log("OL3LayerFactory not loaded");
                return _.noop;
            }
            // build live ol3 layer, add to this.map, this.dynamicLayers etc.
            return _.bind(function receiveLayerById(data, status, xhr) {
            
                var factory = window.OL3LayerFactory("live");
                var layer = factory(data.layertype, data.sourcetype, data.url, data);
                if (!layer) {
                    console.log("failed to retrieve metadata for layer " + id);
                    return;
                }

                this.map.addLayer(layer);
                this.dynamicLayers[id] = layer;
                this.dynamicLayersData[id] = {
                    data: data,
                    sourcetype: data.sourcetype,
                    layertype: data.layertype,
                    url: data.url
                };
                this.updateView(layer);

                if (this.options.onChange) {
                    this.options.onChange.call(this);
                }
                this._trigger("change", null, { added: id, data: this.dynamicLayersData[id] });
            }, this);
        },
        removeLayerById: function removeLayerById(id) {
            var data;
            if (this.dynamicLayers[id]) {
                map.removeLayer(this.dynamicLayers[id]);
                delete this.dynamicLayers[id];
                data = this.dynamicLayersData[id];
                delete this.dynamicLayersData[id];
                this.updateView();

                if (this.options.onChange) {
                    this.options.onChange.call(this);
                }
                this._trigger("change", null, { removed: id, data: data });
            }
        },
        getExtentArray: function getExtentArray() {
            var extent = this.map.getView().calculateExtent(this.map.getSize());
            return JSON.stringify(_.map(
                ["getBottomLeft", "getTopRight"],
                function (method) { return _.map(
                    _.invokeMap(ol.extent[method](extent), 'toPrecision', 5),
                    parseFloat
                ); }
            ));
        },
        getLayers: function getLayers() {
            // dynamic layers, in map order
            return _.filter(_.map(
                this.map.getLayers().getArray(),
                _.bind(function getLayerData(layer) {
                    var id = _.findKey(this.dynamicLayers, layer);
                    return id ? [id, this.dynamicLayersData[id]] : null;
                }, this)
            ));
        },
        // keep track of dynamic style changes
        setLayerProperty: function (lyr, property, value) {
            var id = _.findKey(this.dynamicLayers, lyr),
                eventHash;
            if (!id) {
                console.log("could not find layer for setLayerProperty");
                return;
            }
            eventHash = {
                changeLayer: id,
                prop: property,
                value: value
            };
            if (this.dynamicLayersData[id].data.hasOwnProperty(property)) {
                eventHash.previous = this.dynamicLayersData[id].data[property];
            }
            this.dynamicLayersData[id].data[property] = value;

            if (this.options.onChange) {
                this.options.onChange.call(this);
            }
            this._trigger("change", null, eventHash);
        },
        generateCode: function () {
            var codeTemplate = _.template(
                $(this.options.codeTemplateSelector).html()
            );

            return codeTemplate({
                layers: _.fromPairs(this.getLayers()),
                extent: this.getExtentArray()
            });
        },
        postToJSFiddle: function() {
            post("http://jsfiddle.net/api/post/library/pure/", [
                newTextArea("css", "html, body, .fullscreen { height: 100%; width: 100%; margin: 0; padding: 0; }"),
                newTextArea("html", '<div class="full-screen" id="map"></div>'),
                //+ '<script src="http://www.geodata.soton.ac.uk/webobservatory/ol3-layerswitcher.js"></script>'),
                newTextArea("js", this.generateCode()),
                newInput("panel_css", "0"),
                newInput("panel_html", "0"),
                newInput("panel_js", "0"),

                newInput("resources", [
                    "https://cdnjs.cloudflare.com/ajax/libs/ol3/3.7.0/ol.js",
                    "https://cdnjs.cloudflare.com/ajax/libs/ol3/3.7.0/ol.css",
                    //"https://cdn.jsdelivr.net/openlayers.layerswitcher/1.1.0/ol3-layerswitcher.js", //jsfiddle doesn't do external resources in order, so handle loading this in codeTemplate
                    "https://cdn.jsdelivr.net/openlayers.layerswitcher/1.1.0/ol3-layerswitcher.css"
                ].join(",")),

                newInput("title", "Auto generated geo web observatory mash-up"),
                newInput("description", "Comprises of " + linguistic_list(_.map(window.getLayers(), _.head))),
                newInput("dtd", "html 5"),
                newInput("wrap", "d")
            ]);
        }
    });

    ol.control.LayerSwitcherCustom = function(options) {
        if (options.hasOwnProperty("widget")) {
            this.widget = options.widget;
        }
        ol.control.LayerSwitcher.call(this, options);
    };
    ol.inherits(ol.control.LayerSwitcherCustom, ol.control.LayerSwitcher);

    ol.control.LayerSwitcherCustom.prototype.renderLayer_ = function (lyr, idx) {
        var item = ol.control.LayerSwitcher.protocol.renderLayer_.call(this, lyr, idx),
            controls = document.createElement("div");
        controls.className = "controls";
        if (lyr instanceof ol.layer.Vector) {
            vectorControls(controls, lyr, this.widget);
        } else {
            rasterControls(controls, lyr, this.widget);
        }
        item.appendChild(controls);
        //if ($) { $.data(item, "layer", lyr); }
        return item;
    };

    ol.control.LayerSwitcherCustom.prototype.renderPanel = function () {
        var self = this,
            pending = null,
            $list, $items, layers, offset, sourceIndex,
            p, heading, L,

            isSortableAvailable = $.fn.hasOwnProperty("sortable"),

            fiddlebutton,
            widget;
        
        if (isSortableAvailable) {
            $list = $(this.panel).children("ul").eq(0);
            if ($list && $list.data("sortable")) { $list.sortable("destroy"); }
        }

        ol.control.LayerSwitcher.prototype.renderPanel.call(this);

        L = this.panel.getElementsByTagName("li").length;
        if (0 === L) {
            // Notify user that no layers are available
            // empty panel
            while (this.panel.firstChild) {
                this.panel.removeChild(this.panel.firstChild);
            }
            p = document.createElement("p");
            p.innerHTML = 'No data sources';
            this.panel.appendChild(p);
            return;
        }

        // This is a good spot for the export to jsFiddle button!
        if (this.widget) {
            fiddlebutton = document.createElement("a");
            fiddlebutton.innerHTML =
                "Generate interactive fiddle with selected sources";
            fiddlebutton.href = "#";
            fiddlebutton.onclick = this.widget.postToJSFiddle();
            widget = this.widget;
        }

        if (!isSortableAvailable) { return; }

        // Notify to user that drag/drop sorting is available
        heading = document.createElement("h5");
        heading.innerHTML = "Drag layers to change order";
        this.panel.insertBefore(heading, this.panel.firstChild);

        // implement sorting
        function startFn($item) {
            // record the source index before the DOM is updated
            sourceIndex = $item.index("li");
            console.log("source " + sourceIndex);
        }
        function updateFn($item) {
            var destinationIndex = $item.index("li"),
                lyr = layers.removeAt(offset + sourceIndex);
            layers.insertAt(offset + destinationIndex, lyr);
            console.log("destination " + destinationIndex);
            if (widget) {
                if (widget.options.onChange) {
                    widget.options.onChange.call(widget);
                }
                widget._trigger("change", null, {
                    sortLayer: _.findKey(widget.dynamicLayersData, lyr),
                    index: destinationIndex,
                    prev: sourceIndex
                });
            }
            
        }

        $list = $(this.panel).children("ul").eq(0);
        $items = $list.children("li");
        if (0 < $items.length) {
            layers = this.getMap().getLayers();
            console.log(layers.getArray().length + " " + $items.length);

            // assume dynamic layers are on top of static layers
            offset = layers.getArray().length - $items.length;
            $list.sortable({
                start: function (e, ui) { startFn(ui.item); },
                update: function (e, ui) { updateFn(ui.item); }
            });

            // keyboard access to the layer selector
            // (focusin to keep showing panel when focus in on descendant)
            // (pending to prevent flicker)
            $(this.element).focusin(function () {
                if (pending) {
                    window.clearTimeout(pending);
                    pending = null;
                }
                else self.showPanel();
            }).focusout(function () {
                pending = window.setTimeout(function () {
                    self.hidePanel();
                    pending = null;
                }, 200);
            });

            // keyboard access to the sortable layers
            $items.keydown(function (e) {
                var $this = $(this), $neighbour,
                    isUp = 38 == e.which,
                    isDown = 40 == e.which,
                    place, dir;

                if (isUp || isDown) {
                    place = "insert" + (isUp ? "Before" : "After");
                    dir = isUp ? "prev" : "next";
                    e.stopPropagation();
                    $neighbour = $this[dir](".ui-sortable-handle");
                    if ($neighbour) {
                        startFn($this);
                        $this
                            .slideUp()
                            .queue(function () {
                                $this[place]($neighbour).dequeue();
                            })
                            .slideDown();
                    }
                }
            })
                .focus(function () { $(this).addClass("ui-selecting"); })
                .focusout(function () { $(this).removeClass("ui-selecting"); });

            // give every item a tabindex
            $items.prop("tabindex", _.identity);
        }
    };

    var re_color = /^rgba\(([\d]+),([\d]+),([\d]+).*$/;
    function vectorControls(wrapper, lyr, widgets) {
        var style = getStyle(),
            fill = style && style.getFill(),
            stroke = style && style.getStroke(),
            color = stroke ? stroke.getColor() : (
                fill ? fill.getColor() : null
            ),
            picker = document.createElement("input"),
            label = document.createElement("label");
        //console.log(stroke);
        picker.type = "color";
        if (color) {
            picker.value = color.replace(re_color, function () {
                return "#" + _.map(
                    Array.prototype.slice.call(arguments, 1),
                    function (n) {
                        var hex = parseInt(n, 10).toString(16);
                        return 1 == hex.length ? "0" + hex : hex;
                    }
                ).join("");
            });
        }
        picker.onchange = function (e) {
            //console.log(stroke.getWidth());
            //var image = style.getImage(), newstyle,
            //newfill = new ol.style.Fill({ color: color }),
            var color = ol.color.toString(ol.color.fromString(e.target.value)),
                newstroke = new ol.style.Stroke({
                color: color, width: stroke.getWidth() }),
                newstyle = new ol.style.Style({
                    //stroke: newstroke,
                    //fill: newfill,
                    image: new ol.style.Circle({
                        radius: 5,
                        //fill: new ol.style.Fill({ color: color }),
                        stroke: newstroke
                    })
                });

            //image.fill_ = newfill;
            //image.stroke_ = newstroke;

            //style.image = image;

            /*
            newstyle = new ol.style.Style({
                image: image
            });
            */
            //lyr.setStyle(function () { return [style]; });
            //console.log(style.getFill());
            //console.log(newfill);
            //lyr.redraw();

            lyr.getSource().forEachFeature(function (feature) {
                feature.setStyle(newstyle);
            });

            if (widget) {
                widget.setLayerProperty(lyr, "color", value);
            }
        };
        label.innerHTML = "&nbsp;Color picker";
        label.insertBefore(picker, label.firstChild);
        wrapper.appendChild(label);

        function getStyle() {
            var fn = lyr.getStyle(), style, features;
            if (fn.getFill) { return fn; }
            if (fn[0] && fn[0].getFill) { return fn[0]; }

            features = lyr.getSource().getFeatures();
            if (0 < features.length) {
                style = fn(features[0]);
                if (style.getFill) { return style; }
                if (style[0].getFill) { return style[0]; }
            }
            return null;
        }
    }
    function rasterControls(wrapper, lyr, widget) {
        var slider = document.createElement("input"),
            label = document.createElement("label");
        slider.type = "range";
        slider.min = 0;
        slider.max = 1;
        slider.step = 0.05;
        slider.value = roundToNearestTwentieth(lyr.getOpacity());
        slider.onchange = function (e) {
            lyr.setOpacity(e.target.value);
            if (widget) {
                widget.setLayerProperty(lyr, "opacity", e.target.value);
            }
        };
        label.innerHTML = "&nbsp;Transparency";
        label.insertBefore(slider, label.firstChild);
        wrapper.appendChild(label);
    }
    function roundToNearestTwentieth(n) { return Math.round(n * 20) / 20; }

    function newInput(name, value) {
        var el = document.createElement("input");
        el.name = name;
        el.value = value;
        return el;
    }
    function newTextArea(name, value) {
        var el = document.createElement("textarea");
        el.name = name;
        el.value = value;
        return el;
    }
    function linguistic_list(A) {
        var last = A.pop();
        return (0 < A.length ? A.join(', ') + ' and ' : '') + last;
    }

    function post(url, els) {
        var form = document.createElement("form");
        form.setAttribute("method", "post");
        form.setAttribute("action", url);

        var i = els.length;
        while (i--) { form.appendChild(els[i]); }

        // TODO: do this in some child iframe or something?
        document.body.appendChild(form);
        form.submit();

        // to debug the submission, just display the form without submiting it.
        //var submit = document.createElement("input"); submit.type = "submit"; submit.value = "Submit"; submit.name = "submit"; form.insertBefore(submit, form.firstChild); $("#map").css("top", "30em"); form.setAttribute("class", "debug");
    }

}());
