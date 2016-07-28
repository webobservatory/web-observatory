/**
 * encapsulate template in a widget
 * depends on jquery, jquery.widget (jquery-ui), ol3, ol3-layerswitcher, and _ (lodash),
 **/

(function iife() {

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
            api: 'http://db.worldpop.org.uk:6050', //http://152.78.128.204:6050
            codeTemplateSelector: '#template'
        },
        _create: function createPreview() {
            // instantiate map, other data structures
            if (!("OL3LayerFactory" in window)) {
                console.log("OL3LayerFactory not loaded");
                return;
            }

            var id = this.element.get(0).id,
                inUpdateView = false,
                fitExtent = function fitExtentFlagged(extent) {
                    inUpdateView = true;
                    this.map.getView().fit(extent, this.map.getSize());
                    inUpdateView = false;
                },
                updateViewDefault,
                map;
            if (!id) {
                id = this.element.get(0).id = "geo-web-obervatory-preview-map";
            }
            map = this.map = new ol.Map({
                target: id,
                view: new ol.View({center: [0, 0], zoom: 2}),
                layers: [
                    this._baseLayerFactory(window.OL3LayerFactory.builders.live)
                ],
                controls: ol.control.defaults().extend([
                    new ol.control.LayerSwitcherCustom({widget: this})
                ])
            });
            map.getLayers().item(0).set('type', 'base');

            this.dynamicLayers = {};
            this.dynamicLayersData = {};

            updateViewDefault = _.bind(function updateView(layer, zoomOutOnly) {
                // zoom to accommodate all layers to give users a sporting
                // chance to notice their own changes
                var extent = ol.extent.createEmpty();
                map.getLayers().forEach(function growExtentByLayer(layer) {
                    var src = layer.getSource(),
                        lyrExtent = src && src.getExtent && src.getExtent();
                    if (lyrExtent) {
                        ol.extent.extend(extent, lyrExtent);
                    }
                });
                if (ol.extent.isEmpty(extent)) return;

                if (!!zoomOutOnly) {
                    ol.extent.extend(extent, map.getView().calculateExtent(
                        map.getSize()
                    ));
                }

                fitExtent.call(this, extent);
            }, this);

            function updateViewRespectUser(layer) {
                // once user has set a bbox, don't zoom after remove layer,
                // only zoom out to accommodate an added layer
                if (layer) {
                    updateViewDefault(layer, true);
                }
            }

            // .once([many events], ...) fires once for each type of a event
            // use _.once to ensure only fires once overall
            map.getView().once(
                ["change:resolution", "change:center"],
                _.once(function detectFirstUserMapMove(e) {
                    if (!inUpdateView) {
                        this.updateView = updateViewRespectUser;
                        fitExtent = function fitExtent(extent) {
                            map.getView().fit(extent, map.getSize());
                        };
                    }
                }),
                this
            );
            this.updateView = updateViewDefault;

            function bbox() {
                return map.getView().calculateExtent(map.getSize());
            }

            var prev = bbox();
            this.map.on('moveend', function onMoveEnd() {
                if (this.options.onChange) {
                    this.options.onChange.call(this);
                }
                this._trigger("change", null, {
                    prevExtent: prev,
                    extent: (prev = bbox())
                });
            }, this);
        },

        _geoApiResource: function _geoApiResource(id) {
            return this.options.api + "/datasources/" + id;
        },
        _baseLayerFactory: function _baseLayerFactory(builders) {
            return (new builders.OlObjectInstance(
                "layer.Tile",
                new builders.ObjectLiteral(
                    {source: new builders.OlObjectInstance("source.OSM")}
                )
            )).getResult();
        },

        // public methods
        addLayerById: function requestLayerById(id, nonspatialMetadata) {
            // nonspatialMetadata: things like attributions, logos (thumbnail?),
            // title, default styling? -- these things not returned by the API!

            if (this.dynamicLayers[id]) {
                console.log("layer " + id + " already added: skipping");
                return;
            }

            $.get(
                this._geoApiResource(id),
                this.receiveLayerById(id, nonspatialMetadata)
            );
        },
        _ol3_source_formats: {
            geojson: "GeoJSON"
        },
        receiveLayerById: function (id, metadata) {
            if (!("OL3LayerFactory" in window)) {
                console.log("OL3LayerFactory not loaded");
                return _.noop;
            }

            // build live ol3 layer, add to this.map, this.dynamicLayers etc.
            return _.bind(function receiveLayerById(data, status, xhr) {

                var factory = window.OL3LayerFactory("live"),
                    layer, href;

                switch (data.type.toLowerCase()) {
                    case "vector":
                        _.defaults(metadata, {
                            format: this._ol3_source_formats[data.format],
                            layerType: "Vector",
                            sourceType: "Vector"
                        });
                        href = data.href;

                        break;

                    case "raster":
                        _.defaults(metadata, {
                            urltemplate: "/{z}/{x}/{y}.png",
                            layerType: "Tile",
                            sourceType: "XYZ"
                        });
                        href = data.href + metadata.urltemplate;
                        break;

                    default:
                        console.log("failed to create layer");
                        console.log(data);
                        return;
                }

                _.defaults(metadata, {
                    logo: this._geoApiResource(id) + "/thumbnail.png" +
                    "?height=50&width=100"
                });

                layer = factory(href, metadata);
                this.map.addLayer(layer);
                this.dynamicLayers[id] = layer;
                this.dynamicLayersData[id] = {
                    metadata: metadata,
                    url: href
                };
                this.updateView(layer);

                if (this.options.onChange) {
                    this.options.onChange.call(this);
                }
                this._trigger("change", null, {
                    added: id,
                    data: this.dynamicLayersData[id]
                });
            }, this);
        },
        removeLayerById: function removeLayerById(id) {
            var data, lyr;
            if (this.dynamicLayers[id]) {
                lyr = this.map.removeLayer(this.dynamicLayers[id]);
                if (!lyr) {
                    console.log("failed to remove " + id + ".");
                    return;
                }
                delete this.dynamicLayers[id];
                data = this.dynamicLayersData[id];
                delete this.dynamicLayersData[id];
                this.updateView();

                if (this.options.onChange) {
                    this.options.onChange.call(this);
                }
                this._trigger("change", null, {removed: id, data: data});
            }
        },
        getExtentArray: function getExtentArray() {
            var bbox = this.map.getView().calculateExtent(this.map.getSize());
            return JSON.stringify(_.map(
                ["getBottomLeft", "getTopRight"],
                function (method) {
                    return _.map(
                        _.invokeMap(ol.extent[method](bbox), 'toPrecision', 5),
                        parseFloat
                    );
                }
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
        setLayerProperty: function setLayerProperty(lyr, property, value) {
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
            if (this.dynamicLayersData[id].metadata.hasOwnProperty(property)) {
                eventHash.prev = this.dynamicLayersData[id].metadata[property];
            }
            this.dynamicLayersData[id].metadata[property] = value;

            if (this.options.onChange) {
                this.options.onChange.call(this);
            }
            this._trigger("change", null, eventHash);
        },
        generateCode: function generateCode() {
            var codeTemplate = _.template(
                $(this.options.codeTemplateSelector).html()
            );

            return codeTemplate({
                layers: this.getLayers(),
                extent: this.getExtentArray(),
                baseLayer: this._baseLayerFactory(
                    window.OL3LayerFactory.builders.template
                )
            });
        },
        postToJSFiddle: function postToJSFiddle() {
            post("http://jsfiddle.net/api/post/library/pure/", [
                newTextArea(
                    "css",
                    "html, body, .fullscreen " +
                    "{ height: 100%; width: 100%; margin: 0; padding: 0; }"
                ),
                newTextArea("html", '<div class="full-screen" id="map"></div>'),
                newTextArea("js", this.generateCode()),
                newInput("panel_css", "0"),
                newInput("panel_html", "0"),
                newInput("panel_js", "0"),

                newInput("resources", [
                    "https://cdnjs.cloudflare.com/ajax/libs/ol3/3.7.0/ol.js",
                    "https://cdnjs.cloudflare.com/ajax/libs/ol3/3.7.0/ol.css",
                    //"https://cdn.jsdelivr.net/openlayers.layerswitcher/1.1.0/ol3-layerswitcher.js", //jsfiddle doesn't do external resources in order, so handle loading this in codeTemplate
                    "https://cdn.jsdelivr.net/openlayers.layerswitcher/" +
                    "1.1.0/ol3-layerswitcher.css"
                ].join(",")),

                newInput("title", "Auto generated geo web observatory mash-up"),
                newInput("description", "Comprises of " + linguistic_list(
                        _.map(this.getLayers(), _.head)
                    )),
                newInput("dtd", "html 5"),
                newInput("wrap", "d")
            ]);
        }
    });

    var BaseLayerSwitcher = ol.control.LayerSwitcher,

        CustomLayerSwitcher = ol.control.LayerSwitcherCustom =
            function (options) {
                if (options.hasOwnProperty("widget")) {
                    this.widget = options.widget;
                }
                BaseLayerSwitcher.call(this, options);

                this.hiddenClassName += " custom";
                this.shownClassName += " custom";
                this.element.className = this.hiddenClassName;
            };
    ol.inherits(CustomLayerSwitcher, BaseLayerSwitcher);

    CustomLayerSwitcher.prototype.renderLayer_ = function renderLayer(lyr, idx) {
        // append style controls to ordinary layer label
        var item = BaseLayerSwitcher.prototype.renderLayer_.call(this, lyr, idx),
            controls = document.createElement("div");
        controls.className = "controls";
        if (lyr instanceof ol.layer.Vector) {
            vectorControls(controls, lyr, this.widget, this);
        } else {
            rasterControls(controls, lyr, this.widget);
        }
        item.appendChild(controls);
        //if ($) { $.data(item, "layer", lyr); }
        return item;
    };

    CustomLayerSwitcher.prototype.renderPanel = function customRenderPanel() {
        // make ordinary layer list sortable, add empty message
        var self = this,
            pending = null,
            $list, $items, layers, offset, sourceIndex,
            p, heading, L,

            isSortableAvailable = $.fn.hasOwnProperty("sortable"),

            fiddlebutton,
            widget;

        if (isSortableAvailable) {
            $list = $(this.panel).children("ul").eq(0);
            if ($list && $list.data("sortable")) {
                $list.sortable("destroy");
            }
        }

        BaseLayerSwitcher.prototype.renderPanel.call(this);

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
            fiddlebutton.onclick =
                _.bind(this.widget.postToJSFiddle, this.widget);
            this.panel.appendChild(fiddlebutton);
            widget = this.widget;
        }

        if (!isSortableAvailable) {
            return;
        }

        // Notify to user that drag/drop sorting is available
        heading = document.createElement("h5");
        heading.innerHTML = "Drag layers to change order";
        this.panel.insertBefore(heading, this.panel.firstChild);

        // implement sorting
        function startFn($item) {
            // record the source index before the DOM is updated
            sourceIndex = $list.children("li").index($item);
            console.log("source " + sourceIndex);
        }

        function updateFn($item) {
            var destinationIndex = $list.children("li").index($item),
                lyr = layers.removeAt(offset + sourceIndex);
            layers.insertAt(offset + destinationIndex, lyr);
            console.log("destination " + destinationIndex);
            if (widget) {
                if (widget.options.onChange) {
                    widget.options.onChange.call(widget);
                }
                widget._trigger("change", null, {
                    sortLayer: _.findKey(widget.dynamicLayers, lyr),
                    index: destinationIndex,
                    prev: sourceIndex
                });
            }

        }

        $list = $(this.panel).children("ul").eq(0);
        $items = $list.children("li");
        if (0 < $items.length) {
            layers = this.getMap().getLayers();
            // console.log(layers.getArray().length + " " + $items.length);

            // assume dynamic layers are on top of static layers
            offset = layers.getArray().length - $items.length;
            $list.sortable({
                start: function (e, ui) {
                    startFn(ui.item);
                },
                update: function (e, ui) {
                    updateFn(ui.item);
                }
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
                                updateFn($this);
                            })
                            .slideDown();
                    }
                }
            })
                .focus(function () {
                    $(this).addClass("ui-selecting");
                })
                .focusout(function () {
                    $(this).removeClass("ui-selecting");
                });

            // give every item a tabindex
            $items.prop("tabindex", _.identity);
            if (fiddlebutton) {
                fiddlebutton.tabindex = $items.length;
            }
        }
    };

    var re_color = /^rgba\(([\d]+),([\d]+),([\d]+),([\d\.]+).*$/,
        offscreen = document.createElement("div");
    offscreen.style.cssText = "position: absolute; top: 0; left: -100px; " +
        "width: 50px; overflow: hidden;";
    document.body.appendChild(offscreen);
    function vectorControls(wrapper, lyr, widget, layerSwitcher) {
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
            picker.value =
                color.replace(re_color, function colourChannelsDecToHex() {
                    var channels = Array.prototype.slice.call(arguments, 1, 4);
                    return "#" + _.map(channels, function decToHex(n) {
                            var hex = parseInt(n, 10).toString(16);
                            return 1 == hex.length ? "0" + hex : hex;
                        }).join("");
                });
        }

        picker.onclick = function movePickerOffscreen(click_event) {
            // move picker out of panel so it still exists if panel disappears
            var parent = picker.parentNode,
                nextSibling = picker.nextSibling;
            offscreen.appendChild(click_event.target);

            click_event.target.onchange = function movePickerBack(change_event) {
                if (nextSibling) {
                    parent.insertBefore(click_event.target, nextSibling);
                } else {
                    parent.appendChild(click_event.target);
                }

                click_event.target.onchange = picker_onchange;
                return picker_onchange(change_event);
            };
        };

        function picker_onchange(e) {
            var color = "rgba(" + ol.color.asArray(e.target.value).join(",") + ")",
                newstroke = new ol.style.Stroke(
                    {color: color, width: stroke.getWidth()}
                ),
                newstyle = new ol.style.Style({
                    stroke: newstroke, // for color-picker to read new color
                    image: new ol.style.Circle({ // for actual layer render
                        radius: 5,
                        //fill: new ol.style.Fill({ color: color }),
                        stroke: newstroke
                    })
                });

            lyr.getSource().forEachFeature(function (feature) {
                feature.setStyle(newstyle);
            });

            if (widget) {
                widget.setLayerProperty(lyr, "color", e.target.value);
            }
        }

        label.innerHTML = "&nbsp;Color picker";
        label.insertBefore(picker, label.firstChild);
        wrapper.appendChild(label);

        function getStyle() {
            var fn = lyr.getStyle(), style, features;
            if (fn.getFill) {
                return fn;
            }
            if (fn[0] && fn[0].getFill) {
                return fn[0];
            }

            features = lyr.getSource().getFeatures();
            if (0 < features.length) {
                style = features[0].getStyle() || fn(features[0]);
                if (style.getFill) {
                    return style;
                }
                if (style[0].getFill) {
                    return style[0];
                }
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
        slider.onchange = widget ? function setLayerOpacityWithWidget(e) {
            lyr.setOpacity(e.target.value);
            widget.setLayerProperty(lyr, "opacity", e.target.value);
        } : function setLayerOpacity(e) {
            lyr.setOpacity(e.target.value);
        };
        label.innerHTML = "&nbsp;Transparency";
        label.insertBefore(slider, label.firstChild);
        wrapper.appendChild(label);
    }

    function roundToNearestTwentieth(n) {
        return Math.round(n * 20) / 20;
    }

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
        while (i--) {
            form.appendChild(els[i]);
        }

        // TODO: do this in some child iframe or something?
        offscreen.appendChild(form);
        form.submit();

        // to debug the submission, just display the form without submiting it.
        //var submit = document.createElement("input"); submit.type = "submit"; submit.value = "Submit"; submit.name = "submit"; form.insertBefore(submit, form.firstChild); $("#map").css("top", "30em"); form.setAttribute("class", "debug");
    }

}());
