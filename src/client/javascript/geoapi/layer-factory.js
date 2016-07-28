/*jshint browser: true, -W024 */
window._ = lodash;
window.OL3LayerFactory = (function (_, ol) {
    "use strict";

    // https://en.wikipedia.org/wiki/Builder_pattern
    var builders = {}, undefined, factory;

    // Director accepts data received from the GeoAPI and assembles them
    // with either the live or the template builders.
    function director(builder, addProperty, url, metadata) {
        var sourceOptions = new builder.ObjectLiteral(),
            sourceObj = new builder.OlObjectInstance(
                "source." + metadata.sourceType,
                sourceOptions
            ),
            layerOptions = new builder.ObjectLiteral({source: sourceObj}),
            layerObj = new builder.OlObjectInstance(
                "layer." + metadata.layerType,
                layerOptions
            );

        // honour settings from the API
        if (metadata.hasOwnProperty("format")) {
            addProperty(sourceOptions, "format", new builder.OlObjectInstance(
                "format." + metadata.format
            ));
        }

        function makeScalar(v) {
            return new builder.ScalarLiteral(v);
        }

        function makeAttribution(attribution) {
            return new builder.OlObjectInstance(
                "Attribution",
                new builder.ObjectLiteral({html: makeScalar(attribution)})
            );
        }

        if (metadata.hasOwnProperty("attributions")) {
            addProperty(sourceOptions, "attributions", new builder.ArrayLiteral(
                _.map(metadata.attributions, makeAttribution)
            ));
        }

        _.each(
            _.pick(metadata, "logo", "minZoom", "maxZoom"),
            function (v, k) {
                addProperty(sourceOptions, k, makeScalar(v));
            }
        );

        if (_.isArray(url)) {
            addProperty(sourceOptions, "urls", new builder.ArrayLiteral(
                _.map(url, makeScalar)
            ));
        } else {
            addProperty(sourceOptions, "url", makeScalar(url));
        }

        if (metadata.hasOwnProperty("title")) {
            addProperty(layerOptions, "title", makeScalar(metadata.title));
        }

        // honour style settings from the layerswitcher UI
        function makeStyle(color) {
            // circles outlined in color

            var fillOptions = new builder.ObjectLiteral(
                {color: makeScalar("rgba(255,255,255,0.4)")}
                ),
                fill = new builder.OlObjectInstance("style.Fill", fillOptions),
                strokeOptions = new builder.ObjectLiteral({
                    width: makeScalar(1.25),
                    color: makeScalar(color)
                }),
                stroke = new builder.OlObjectInstance(
                    "style.Stroke",
                    strokeOptions
                ),
                circle = new builder.OlObjectInstance(
                    "style.Circle",
                    new builder.ObjectLiteral({
                        fill: fill,
                        stroke: stroke,
                        radius: makeScalar(5)
                    })
                );
            return new builder.ArrayLiteral([
                new builder.OlObjectInstance(
                    "style.Style",
                    new builder.ObjectLiteral({image: circle})
                )
            ]);
        }

        if (metadata.hasOwnProperty("color")) {
            addProperty(layerOptions, "style", makeStyle(metadata.color));
        }
        if (metadata.hasOwnProperty("opacity")) {
            addProperty(layerOptions, "opacity", makeScalar(metadata.opacity));
        }

        // experimental code (turned off)
        if (false && "Vector" == metadata.layerType) {
            addProperty(layerOptions, "style", new builder.FunctionLiteral(
                function (feature, resolution) {
                    var color = ol.color.toString([5, 5, 200, 0.8]),
                        stroke = new ol.style.Stroke({
                            color: color,
                            width: 1.2
                        }),
                        fill = new ol.style.Fill({color: color});
                    return new ol.style.Style({
                        image: new ol.style.Circle({
                            stroke: stroke,
                            fill: fill,
                            radius: 5
                        }),
                        fill: fill,
                        stroke: stroke
                    });
                }
            ));
        }

        return layerObj.getResult();
    }

    // Two sets of builders, "live" and "template"
    // each set supplies a standard repertoire of builders:
    // "ScalarLiteral", "ArrayLiteral", "ObjectLiteral", "OlObjectInstance"

    builders.live = {};
    // "live" builders' getResult()s return running instance of object requested
    // In the case of the Literal builders,
    // getResult() simply returns the first argument passed to the constructor.
    // OlObjectInstance is tricky: a constructor cannot be "apply"ed directly.
    function getResult(indent, linedepth) {
        return 0 < arguments.length ? function (builder) {
            return builder.getResult(indent, linedepth);
        } : function (builder) {
            return builder.getResult();
        };
    }

    function liveLiteral(default_value, mapFn) {
        function LiveLiteral(data) {
            this.data = 0 < arguments.length ? data : _.clone(default_value);
        }

        LiveLiteral.prototype.getResult = mapFn ?
            function () {
                return mapFn(this.data, getResult());
            } :
            function () {
                return this.data;
            };
        return LiveLiteral;
    }

    builders.live.ScalarLiteral = liveLiteral(undefined);
    builders.live.FunctionLiteral = liveLiteral(_.noop);
    builders.live.ArrayLiteral = liveLiteral([], _.map);
    builders.live.ObjectLiteral = liveLiteral({}, _.mapValues);
    builders.live.OlObjectInstance = function (typeStr) {
        var Type = _.at(ol, typeStr)[0];
        this.Creator = function (args) {
            return Type.apply(this, args);
        };
        this.Creator.prototype = Type.prototype;
        this.data = Array.prototype.slice.call(arguments, 1);
    };
    builders.live.OlObjectInstance.prototype.getResult = function () {
        return new this.Creator(
            _.map(this.data, getResult())
        );
    };

    builders.template = {};
    // "template" builders' "getResult()"s accept an optional indent argument,
    // and return a string invocation of the object requested
    // in simple, declarative pretty-printed javascript.
    function listOfExpressions(indent, linedepth) {
        /* jshint validthis: true */
        // invoked as a method in a builder object.
        // a pretty-printed, comma-separated list of this.data,
        // enclosed by open and close properties

        var datalength = _.size(this.data);

        if (0 === datalength) {
            return this.open + this.close;
        }

        if (!indent) {
            indent = "\n";
        }
        linedepth = linedepth || 0;
        /*console.log([
         (indent.length-1) / 2,
         this.open + this.close,
         datalength
         ].join(" "));*/
        if (1 === datalength && 2 > linedepth) {
            // Just enclose the datum, without applying or raising indent level
            // Still use map so it works with non-array objects
            return this.open + _.map(
                    this.data,
                    this.eachExpression(indent, linedepth + 1)
                ) + this.close;
        }

        // render each element of this.data, with a raised indentation level
        return this.open + indent + "  " +

            _.map(this.data, this.eachExpression(indent + "  "))
                .join("," + indent + "  ") +

            indent + this.close;
    }

    function templateLiteral(default_value, open, close, eachExpression) {
        var Type = function templateConstructor(data) {
            this.data = 0 < arguments.length ? data : _.clone(default_value);
        };
        if (4 > arguments.length) {
            Type.prototype.getResult = function () {
                return JSON.stringify(this.data);
            };
        } else {
            Type.prototype.getResult = listOfExpressions;
            Type.prototype.open = open;
            Type.prototype.close = close;
            Type.prototype.eachExpression = eachExpression;
        }
        return Type;
    }

    builders.template.ScalarLiteral = templateLiteral(undefined);

    builders.template.FunctionLiteral = templateLiteral(_.noop);
    builders.template.FunctionLiteral.prototype.getResult =
        function (indent) {
            return indent ?
                this.data.toString().replace("\n", indent) :
                this.data.toString();
        };

    builders.template.ArrayLiteral = templateLiteral([], "[", "]", getResult);

    builders.template.ObjectLiteral =
        templateLiteral({}, "{", "}", function (indent, linedepth) {
            return function (builder, key) {
                return key + ": " + builder.getResult(indent, linedepth);
            };
        });
    builders.template.OlObjectInstance = function (typeStr) {
        this.data = Array.prototype.slice.call(arguments, 1);
        this.open = "new ol." + typeStr + "(";
    };
    builders.template.OlObjectInstance.prototype.close = ")";
    builders.template.OlObjectInstance.prototype.eachExpression = getResult;
    builders.template.OlObjectInstance.prototype.getResult = listOfExpressions;

    var logMsgStr = "Object key collision: <%= key %>. " +
        "<%= gerund %> new value '<%= value %>'.";
    factory = function (builder, flag_ignore) {
        // director progressively assigns entries in ObjectLiteral.
        // In case of collision, overwrite or ignore according to flag:
        var logMsg = _.template(logMsgStr, {
            gerund: flag_ignore ? "Ignoring" : "Accepting"
        });
        return _.partial(
            director,
            _.isString(builder) ? builders[builder] : builder,
            function addProperty(builder, key, property) {
                if (builder.data.hasOwnProperty(key)) {
                    console.log(
                        logMsg({key: key, value: property})
                    );
                    if (flag_ignore) {
                        return;
                    }
                }
                builder.data[key] = property;
            }
        );
    };

    factory.builders = builders;
    return factory;
}(window._, window.ol));
