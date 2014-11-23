barCharWithBoxPlot = function(containerId, width, height, data)
{
    // TODO : revoir width & height

    // function() : private
    // barCharWithBoxPlot = function() : public
    var _chart = new Object();
    var displayedVariables = [];
    displayedVariables = $.map(data[0], function(element,index) {return index});
    var _regions = [];
    var _useRightYAxis = false;
    var barCharMargin = {top: 10, right: 0, bottom: 75, left: 35};
    var regionBarChartObject = new Object();
    var displayUncertainty = true;
    var colorArray=["#555555", "#009900", "#723E64", "#ff8c00", "#ff0000", "#a52a2a", "#cb6868", "#FFDF00", "#efe28a", "#66cdaa", "#77B5FE", "#4682b4", "#006400", "#32cd32"]
    var color = d3.scale.ordinal().domain( displayedVariables ).range(colorArray);
    var fluxColName = "Name";


    _chart.setUseRightYAxis = function( useRightYAxis )
    {
        _useRightYAxis = useRightYAxis;
    };


    _chart.setRegions = function( data )
    {
        _regions = data;
    };
//    _chart.elasticY = function (_) {
//        if (!arguments.length) return _yElasticity;
//        _yElasticity = _;
//        return _chart;
//    };

    _chart.changeDisplayUncertainty = function()
    {
        displayUncertainty = !displayUncertainty;
    };

    /**
     * This method create the svg container for the bar chart
     */
    _chart.create = function()
    {
        var regionBarChartx0 = d3.scale.ordinal().rangeRoundBands( [0, width], 0.1 ).domain( _regions );
        var regionBarChartx1 = d3.scale.ordinal();
        var regionBarCharty = d3.scale.linear().range( [height, 0] );

        // Axes
        var regionBarChartxAxis = d3.svg.axis().scale( regionBarChartx0 );
        var regionBarChartyAxis = d3.svg.axis()
            .scale( regionBarCharty )
            .orient( _useRightYAxis ? "right" : "left" )
            .tickFormat( d3.format( ".2s" ) )
            .tickSize( -width, 0 );

        $( containerId ).addClass( "barChartWitBoxPlot" );
        // BarChart
        var regionBarChartsvg = d3.select( containerId ).append( "svg" )
            .attr( "width", width + barCharMargin.left + barCharMargin.right )
            .attr( "height", height + barCharMargin.top + barCharMargin.bottom )
            .append( "g" )
            .attr( "transform", "translate(" + (_useRightYAxis ? 0 : barCharMargin.left) + "," + barCharMargin.top + ")" );

        var regionBarChartsvgG = regionBarChartsvg.append( "g" )
            .attr( "class", "y axis" );
        if( _useRightYAxis )
            regionBarChartsvgG.attr( "transform", "translate(" + width + ",0)" );

        regionBarChartsvgG.append( "text" )
            .attr( "transform", "rotate(-90)" )
            .attr( "y", 6 )
            .attr( "dy", ".7em" )
            .style( "text-anchor", "end" )
            .text( "" );

        regionBarChartsvg.append( "g" )
            .attr( "class", "x axis" )
            .attr( "transform", "translate(0," + height + ")" );

        // xAxis
        regionBarChartsvg.select( '.x.axis' ).call( regionBarChartxAxis );

        regionBarChartObject.width = width;
        regionBarChartObject.x0 = regionBarChartx0;
        regionBarChartObject.x1 = regionBarChartx1;
        regionBarChartObject.y = regionBarCharty;
        regionBarChartObject.xAxis = regionBarChartxAxis;
        regionBarChartObject.yAxis = regionBarChartyAxis;
        regionBarChartObject.svg = regionBarChartsvg;
        regionBarChartObject.useRightYAxis = _useRightYAxis;

        updateRegionBarChartAxes();
        updateDisplayedVariablesAndRegionBarCharts();
//        return regionBarChartObject;
    };

    _chart.update = function()
    {
        updateDisplayedVariablesAndRegionBarCharts();
    };

    function setColumnDetailsAndTotals()
    {
        data.forEach( function( d )
        {
            var index = 0;
            d.columnDetails = displayedVariables.map( function( element, i )
            {
                var result = {name: element, column: index.toString(), yBegin: (0 > d[element].value ? d[element].value : 0), yEnd: (0 < d[element].value ? d[element].value : 0), uncertainty: d[element].uncertainty, color:false, region:d.Name};
                index++;
                return result;
            } );

            d.columnDetails = d.columnDetails.filter( function( n )
            {
                return n != undefined
            } );

            d.negativeTotal = d3.min( d.columnDetails,function( d )
            {
                if( displayUncertainty && d.uncertainty && !isNaN( parseFloat( d.uncertainty ) ) )
                    return d ? parseFloat( d.yBegin ) + parseFloat( d.uncertainty ) : 0;
                else
                    return d ? parseFloat( d.yBegin ) : 0;
            } );

            d.positiveTotal = d3.max( d.columnDetails, function( d )
            {
                if( displayUncertainty && d.uncertainty && !isNaN( parseFloat( d.uncertainty ) ) )
                    return d ? parseFloat( d.yEnd ) + parseFloat( d.uncertainty ) : 0;
                else
                    return d ? parseFloat( d.yEnd ) : 0;
            } );
        } );
    }

    function updateDisplayedVariablesAndRegionBarCharts()
    {
        // Create details for each column
        setColumnDetailsAndTotals();
//        regionBarChartObject.transposedData = this.transposedDataForMainFlux;

        // Update region barcharts
        updateRegionBarChart();
    }

    function updateRegionBarChart()
    {
        updateRegionBarChartDomains();
        updateRegionBarChartAxes();
        updateRegionBarChartBar();
        updateRegionBarChartUncertainty();
//        updateRegionBarChartLegend();
    }

    function updateRegionBarChartDomains()
    {
        regionBarChartObject.y.domain( [d3.min( data, function( d )
        {
            return d.negativeTotal;
        } ), d3.max( data, function( d )
        {
            return d.positiveTotal;
        } )] );

        regionBarChartObject.x1.domain( d3.keys( displayedVariables ) ).rangeRoundBands( [0, regionBarChartObject.x0.rangeBand()] );
    }

    function updateRegionBarChartAxes()
    {
        // Update yAxis
        regionBarChartObject.svg
            .select( '.y.axis' )
            .call( regionBarChartObject.yAxis )
            .selectAll( 'line' )
            .filter( function( d )
            {
                return !d
            } )
            .classed( 'zero', true );

        // Rotate the x Axis labels
        regionBarChartObject.svg.selectAll( "g.x g text" )
            .style( "text-anchor", "end" )
            .attr( "transform", "translate(-10,0)rotate(315)" )
            .text( function( d, i )
            {
                return d;
            } );
    }

//    updateRegionBarChartLegend: function( regionBarChartObject )
//    {
//        var legend = regionBarChartObject.svg.selectAll( ".legend" )
//            .data( jQuery.proxy( function()
//        {
//            this.displayedVariables.slice();
//            var result = new Array();
//            $.each( this.displayedVariables, jQuery.proxy( function( i, d )
//            {
//                if( (regionBarChartObject.isForMainFlux && (-1 != this.mainFlux.indexOf( d.name ) ))
//                    || (!regionBarChartObject.isForMainFlux && (-1 != this.separatedFlux.indexOf( d.name ) )) )
//                    result.push( d );
//            }, this ) );
//            return result;
//        }, this ) );
//
//        var legendsEnter = legend.enter().append( "g" )
//            .attr( "class", "legend" );
//
//        legendsEnter.append( "rect" )
//            .attr( "id", function( d, i )
//            {
//                return "regionBarChartSvg_legendRect_" + i;
//            } )
//            .attr( "x", regionBarChartObject.width - 18 )
//            .attr( "width", 10 )
//            .attr( "height", 10 );
//
//        legendsEnter.append( "text" )
//            .attr( "x", regionBarChartObject.width - 24 )
//            .attr( "y", 9 )
//            .attr( "dy", 0 )
//            .style( "text-anchor", "end" );
//        legend.exit().remove();
//
//        // When remove bar
//        legend.select( "text" )
//            .text( jQuery.proxy( function( d )
//        {
//            var propertyName = this.getI18nPropertiesKeyFromValue( d.name );
//            return (0 != jQuery.i18n.prop( propertyName + "_shortForAxis" ).indexOf( "[" )
//                && -1 != jQuery.i18n.prop( "separatedFlux" ).indexOf( d.name )) ? jQuery.i18n.prop( propertyName + "_shortForAxis" ) : d.name;
//        }, this ) );
//
//        legend.select( "rect" )
//            .style( "fill", jQuery.proxy( function( d )
//        {
//            if( !d.color )
//                d.color = this.color( d.name );
//            return d.color;
//        }, this ) )
//            .style( "stroke", "#2C3537" )
//            .attr( "x", regionBarChartObject.width - 18 )
//            .on( "click", jQuery.proxy( function( d )
//        {
//            this.onClickRegionBarChart( d );
//        }, this ) );
//
//        legend.select( "text" ).transition().duration( 1000 ).ease( "linear" )
//            .attr( "x", regionBarChartObject.width - 24 );
//
//        legend.attr( "transform",
//            jQuery.proxy( function( d, i )
//            {
//                var zeroLineTranslateValue = d3.select( "#regionBarChartForSeparatedFlux g.y.axis g line.zero" )[0][0];
//                if( !regionBarChartObject.isForMainFlux && zeroLineTranslateValue && zeroLineTranslateValue.parentNode.attributes.transform.value && -1 != zeroLineTranslateValue.parentNode.attributes.transform.value.indexOf( "0,0" ) )
//                    return "translate(0," + (this.barChartHeight - this.barCharMargin.bottom - this.barCharMargin.top * 3 + i * 15) + ")";
//                else
//                    return "translate(0," + i * 15 + ")";
//            }, this ) );
//    },

    function updateRegionBarChartBar()
    {
        var regionBar = regionBarChartObject.svg.selectAll( ".groupedBar" )
            .data(data);

        var regionBarEnter = regionBar.enter().append( "g" )
            .attr( "class", "groupedBar" )
            .attr( "transform", function( d )
            {
                return "translate(" + regionBarChartObject.x0( d[fluxColName] ) + ",0)";
            });

        var regionBarRect = regionBar.selectAll( "rect" )
            .data( function( d )
            {
                return d.columnDetails;
            });

        regionBarRect.enter().append( "rect" )
            .on( "click", function( d )
            {
//            onClickRegionBarChart( d );
            });

        regionBarRect.exit().remove();

        regionBar.transition()
            .duration( 500 )
            .ease( "linear" )
            .selectAll( "rect" )
            .attr( "width", regionBarChartObject.x1.rangeBand() )
            .attr( "x", function( d )
            {
                return regionBarChartObject.x1( d.column );
            })
            .attr( "y", function( d )
            {
                return regionBarChartObject.y( d.yEnd );
            })
            .attr( "height", function( d )
            {
                return regionBarChartObject.y( d.yBegin ) - regionBarChartObject.y( d.yEnd );
            } )
            .style( "fill", function( d )
            {
                if( !d.color )
                    d.color = color( d.name );
                return d.color;
            });
    }

    function updateRegionBarChartUncertainty()
    {
        var regionBar = regionBarChartObject.svg.selectAll( ".groupedBar" )
            .data( data );

        var regionBarPath = regionBar.selectAll( "path" )
            .data( function( d )
            {
                return d.columnDetails;
            });

        regionBarPath.enter().append( "path" );
        regionBarPath.exit().remove();

        regionBar.transition()
            .duration( 500 )
            .ease( "linear" )
            .selectAll( "path" )
            .attr( "d", function( d )
            {
                var xCenter = regionBarChartObject.x1( d.column ) + regionBarChartObject.x1.rangeBand() / 2;
                var lineWidth = regionBarChartObject.x1.rangeBand() / 5;
                var yTop = regionBarChartObject.y( parseFloat( d.yEnd ) + parseFloat( d.uncertainty ) );
                var yBottom = regionBarChartObject.y( parseFloat( d.yEnd ) - parseFloat( d.uncertainty ) );
                if( 0 > d.yBegin )
                {
                    yTop = regionBarChartObject.y( parseFloat( d.yBegin ) + parseFloat( d.uncertainty ) );
                    yBottom = regionBarChartObject.y( parseFloat( d.yBegin ) - parseFloat( d.uncertainty ) );
                }

                if( displayUncertainty && d.uncertainty )
                    return "M" + (xCenter - lineWidth) + "," + yBottom + "L" + (xCenter + lineWidth) + "," + yBottom + "M" + xCenter + "," + yBottom +
                        "L" + xCenter + "," + yTop + "M" + (xCenter - lineWidth) + "," + yTop + "L" + (xCenter + lineWidth) + "," + yTop;
                else
                    return false;
            })
            .attr( "stroke", function( d )
            {
                if( !d.color )
                    d.color = color( d.name );
                return ColorLuminance( d.color, -0.3 );
            } )
            .attr( "stroke-width", 2);
    }

//    onClickRegionBarChart: function( element )
//    {
//        var dynamicAreaDivId = this.getI18nPropertiesKeyFromValue( element.name );
//        $( "#" + dynamicAreaDivId ).removeClass( "selected" );
//        this.removeToRegionBarChart( element.name );
//        this.fluxBarChartForMainFlux.onClick( {key: element.name} );
//        this.fluxBarChartForSeparatedFlux.onClick( {key: element.name} );
//    },

//    removeToRegionBarChart: function( fluxName )
//    {
//        var index = getIndexInArray( this.displayedVariables, "name", fluxName );
//        if( 0 > index )
//            return;
//        this.displayedVariables.splice( index, 1 );
//        this.updateDisplayedVariablesAndRegionBarCharts( fluxName );
//    },


//    addOrRemoveToRegionBarChart: function( dynamicAreaDiv, fluxName )
//    {
//        this.displayedVariables = this.displayedVariables ? this.displayedVariables : [];
//        var isAlreadyAChart = (0 <= getIndexInArray( this.displayedVariables, "name", fluxName ));
//        isAlreadyAChart ? $( dynamicAreaDiv ).removeClass( "selected" ) : $( dynamicAreaDiv ).addClass( "selected" );
//        if( isAlreadyAChart )
//            this.removeToRegionBarChart( fluxName );
//        else
//            this.createOrAddToBarChart( fluxName );
//    },

//    createOrAddToBarChart: function( fluxValue )
//    {
//        if( 0 >= $( "#regionBarChart div svg" ).length )
//        {
//            var regionBarChartHeight = this.barChartHeight - this.barCharMargin.top - this.barCharMargin.bottom;
//
//            this.regionBarChartForMainFlux = this.createBarChart( "#regionBarChartForMainFlux", $( "#regionBarChartForMainFlux" ).width() - this.barCharMargin.left, regionBarChartHeight, false, true );
//            this.regionBarChartForSeparatedFlux = this.createBarChart( "#regionBarChartForSeparatedFlux", $( "#regionBarChartForSeparatedFlux" ).width() - this.barCharMargin.left, regionBarChartHeight, true, false );
//        }
//        this.displayedVariables.push( {name : fluxValue, color: false} );
//        this.updateDisplayedVariablesAndRegionBarCharts( fluxValue );
//        this.updateToolTipsForCharts();
//    },



    return _chart;
};


/**
 * http://www.sitepoint.com/javascript-generate-lighter-darker-color/
 * Warning : colors must be in hexadecimal, color's names are not working !
 */
function ColorLuminance( hex, lum )
{

    // validate hex string
    hex = String( hex ).replace( /[^0-9a-f]/gi, '' );
    if( hex.length < 6 )
    {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    lum = lum || 0;

    // convert to decimal and change luminosity
    var rgb = "#", c, i;
    for( i = 0; i < 3; i++ )
    {
        c = parseInt( hex.substr( i * 2, 2 ), 16 );
        c = Math.round( Math.min( Math.max( 0, c + (c * lum) ), 255 ) ).toString( 16 );
        rgb += ("00" + c).substr( c.length );
    }

    return rgb;
}
