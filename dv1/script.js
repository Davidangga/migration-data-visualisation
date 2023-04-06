function init(){

    // contant value
    const w = 1000, h = 700;

    // setting up d3 projection, used to tranform coordinates into x and y values for path svg
    const projection = d3.geoMercator()
    .center([0,40]) // earth is 3d so this three methods help scale the image into 2d version
    .translate([w/2, h/2])
    .scale(150);

    // color scale
    const colorScale = d3.scaleDiverging(d3.interpolateRdYlGn);

    // is a method that produce canvas's data for attribute d
    const path = d3.geoPath()
    .projection(projection);

    // note remove the border
    const svg = d3.select(".chart").append("svg").attr("width", w).attr("height", h).style("border","1px solid black");

    // function for legend
    function legend({
        color,
        title,
        tickSize = 6,
        width = 320,
        height = 44 + tickSize,
        marginTop = 18,
        marginRight = 0,
        marginBottom = 16 + tickSize,
        marginLeft = 0,
        ticks = width / 64,
        tickFormat,
        tickValues
      } = {}) {
        svg.append("g").attr("class","legend")
        const svg2 = d3.select("svg").select(".legend")
          .attr("width", width)
          .attr("height", height)
          .attr("viewBox", [0, 0, width, height])
          .attr("transform", `translate( ${marginLeft + 10}, ${h - height - marginBottom + tickSize})`)
          .style("overflow", "visible")
          .style("display", "block");
      
        let tickAdjust = g => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
        let x;

        // Sequential
        if (color.interpolator) {
          x = Object.assign(color.copy()
            .interpolator(d3.interpolateRound(marginLeft, width - marginRight)), {
              range() {
                return [marginLeft, width - marginRight];
              }
            });
      
          svg2.append("image")
            .attr("x", marginLeft)
            .attr("y", marginTop)
            .attr("width", width - marginLeft - marginRight)
            .attr("height", height - marginTop - marginBottom)
            .attr("preserveAspectRatio", "none")
            .attr("xlink:href", ramp(color.interpolator()).toDataURL());
        }

        svg2.append("g")
          .attr("transform", `translate(0,${height - marginBottom})`)
          .call(d3.axisBottom(x)
            .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
            .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
            .tickSize(tickSize)
            .tickValues(tickValues))
          .call(tickAdjust)
          .call(g => g.select(".domain").remove())
          .call(g => g.append("text")
            .attr("x", marginLeft)
            .attr("y", marginTop + marginBottom - height - 6)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text(title));
      
        return svg2.node();
      }
      
      function ramp(color, n = 256) {
        var canvas = document.createElement('canvas');
        canvas.width = n;
        canvas.height = 1;
        const context = canvas.getContext("2d");
        for (let i = 0; i < n; ++i) {
          context.fillStyle = color(i / (n - 1));
          context.fillRect(i, 0, 1, 1);
        }
        return canvas;
      }
      
    
    // geojson calling
    d3.json("customgeo.json").then(function(json){

        d3.csv("netmigration.csv", function(data){
            return { 
                1990: +data["1990"],
                1995: +data["1995"],
                2000: +data["2000"],
                2005: +data["2005"],
                2010: +data["2010"],
                2015: +data["2015"],
                2020: +data["2020"],
                subregion: data.SubRegion
            }
        }).then(function(data){

            let selectedYear = "2020";
            let domain = [
                d3.min(data, function(d){
                    return d[selectedYear];
                }),0,
                d3.max(data, function(d){
                    return d[selectedYear];
                })]
            colorScale.domain(domain);

            for(const d of data){
                const subRegion = d.subregion;
                for (const j of json.features){
                    if (subRegion == j.properties.subregion ){
                        j.properties.netMigration = d;
                    }
                }
            }

            let mouseOver = function(e, obj){
                let boxh = 60, boxw = 150;
                svg.selectAll("path")
                .transition()
                .duration(100)
                .style("opacity", "0.5");

                svg.selectAll(`.${d3.select(e).attr("class")}`)
                .transition()
                .duration(100)
                .style("opacity", "1");
    
                svg.append("rect")
                .attr("x", d3.pointer(event)[0])
                .attr("y", d3.pointer(event)[1])
                .attr("height", boxh)
                .attr("width", boxw)
                .attr("transform", `translate(20, -${boxh + 20})`)
                .style("background-color", "black");
                
                svg.append("text")
                .attr("class", "info-box")
                .text(obj.subregion)
                .attr("x", d3.pointer(event)[0] )
                .attr("y", d3.pointer(event)[1])
                .attr("transform", `translate(20, -${boxh})`)
                .attr("fill", "white");

                svg.append("text")
                .attr("class", "info-box")
                .text(`Net ${obj.netMigration[selectedYear].toLocaleString()}`)
                .attr("x", d3.pointer(event)[0] )
                .attr("y", d3.pointer(event)[1])
                .attr("transform", `translate(20, -${boxh - 20})`)
                .attr("fill", "white");


                svg.on("mousemove", function(event){
                    svg.selectAll("rect")
                    .attr("x", d3.pointer(event)[0])
                    .attr("y", d3.pointer(event)[1])
    
                    svg.selectAll(".info-box")
                    .attr("x", d3.pointer(event)[0])
                    .attr("y", d3.pointer(event)[1])
                })
            }
    
            let mouseOut = function(){
                svg.selectAll("path")
                .transition()
                .duration(100)
                .style("opacity", "1");
    
                svg.selectAll("rect").remove();
                svg.selectAll(".info-box").remove();
            }

            svg.selectAll("path")
            .data(json.features) // important data from geojson is under features key
            .join("path")
            .attr("class", function(d){
                return d.properties.subregion.replace(/ /g, '');
            })
            .style("fill", function(d){
                return colorScale(d.properties.netMigration[selectedYear])
            })
            .style("stroke", "white")
            .style("stroke-width", "1px")
            .attr("d", path)
            .on("mouseover",function(event, d){
                return mouseOver(this, d.properties)
            })
            .on("mouseout",mouseOut);

            legend({
                color: colorScale,
                title: "Population Growth (Millions)",
                tickFormat: ".2s",
                tickValues: [
                    d3.min(data, function(d){return d[selectedYear];}) * 0.9,
                    d3.min(data, function(d){return d[selectedYear];}) * 0.45,
                    0,
                    d3.max(data, function(d){return d[selectedYear];}) * 0.45,
                    d3.max(data, function(d){return d[selectedYear];}) * 0.9] 
            });

            $(function() {
                $( "#slider-1" ).slider();
             });


            
        })
    })
    
} 
window.onload = init();