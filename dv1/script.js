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
        svg.select(".legend").remove();
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
        if (document.getElementById("demo")){
            document.getElementById("demo").remove();
        }
        var canvas = document.createElement('canvas');
        canvas.id = "ramp"
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
    d3.json("customgeotopo.json").then(function(json){
        // unpackage topojson
        let geojson = topojson.feature(json, json.objects.customgeo);
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
            for(const d of data){
                const subRegion = d.subregion;
                for (const j of geojson.features){
                    if (subRegion == j.properties.subregion ){
                        j.properties.netMigration = d;
                    }
                }
            }

            function mouseOver (e, obj){
                let boxh = 60, boxw = 150;
                svg.selectAll("path")
                .transition()
                .duration(100)
                .style("filter", "saturate(0.4)")
                .style("opacity", "0.7");

                svg.select(`#${d3.select(e).attr("id")}`)
                .transition()
                .duration(100)
                .style("filter", "saturate(1)")
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
    
                function mouseOut(){
                    svg.selectAll("path")
                    .transition()
                    .duration(100)
                    .style("filter", "saturate(1)")
                    .style("opacity", "1");
        
                    svg.selectAll("rect").remove();
                    svg.selectAll(".info-box").remove();
                }

            // Year slider
            let rangeInput = document.querySelector(".range-input input");
            let rangeValue = document.querySelector(".range-input .value div");
            let start = parseFloat(rangeInput.min);
            let end = parseFloat(rangeInput.max);
            let step = parseFloat(rangeInput.step);
            let selectedYear = "1995";

            for(let i=start;i<=end;i+=step){
                rangeValue.innerHTML += '<div>'+i+'</div>';
            }

            // colorScale.domain([
            //     d3.min(data, function(d){
            //         return d[selectedYear];
            //     }),0,
            //     d3.max(data, function(d){
            //         return d[selectedYear];
            //     })]);

            // in case kalau mau dilihat semua dari 1990-2020
            colorScale.domain([
                d3.min(data, function(d){
                    return Math.min(d["1990"], d["1995"], d["2000"], d["2005"], d["2010"], d["2015"], d["2020"]);
                }),0,
                d3.max(data, function(d){
                    return Math.max(d["1990"], d["1995"], d["2000"], d["2005"], d["2010"], d["2015"], d["2020"]);
                })]);
            svg.selectAll("path")
            .data(geojson.features) // important data from geojson is under features key
            .join("path")
            .attr("id", function(d){
                return d.properties.subregion.replace(/ /g, '');
            })
            .style("fill", function(d){
                return colorScale(d.properties.netMigration[selectedYear])
            })
            .attr("stroke", "black")
            .attr("d", path)
            .on("mouseover",function(event, d){
                return mouseOver(this, d.properties)
            })
            .on("mouseout",mouseOut);

            // legend({
            //     color: colorScale,
            //     title: "Population Growth (Millions)",
            //     tickFormat: ".2s",
            //     tickValues: [
            //         d3.min(data, function(d){return d[selectedYear];}) * 0.9,
            //         d3.min(data, function(d){return d[selectedYear];}) * 0.45,
            //         0,
            //         d3.max(data, function(d){return d[selectedYear];}) * 0.45,
            //         d3.max(data, function(d){return d[selectedYear];}) * 0.9] 
            // });

            // in case kalau mau dilihat semua dari 1990-2020
            legend({
                color: colorScale,
                title: "Population Growth by Migration (in Millions)",
                tickFormat: ".2s",
                tickValues: [
                    d3.min(data, function(d){
                        return Math.min(d["1990"], d["1995"], d["2000"], d["2005"], d["2010"], d["2015"], d["2020"]);
                    }) * 0.9,
                    d3.min(data, function(d){
                        return Math.min(d["1990"], d["1995"], d["2000"], d["2005"], d["2010"], d["2015"], d["2020"]);
                    }) * 0.45,
                    0,
                    d3.max(data, function(d){
                        return Math.max(d["1990"], d["1995"], d["2000"], d["2005"], d["2010"], d["2015"], d["2020"]);
                    }) * 0.45,
                    d3.max(data, function(d){
                        return Math.max(d["1990"], d["1995"], d["2000"], d["2005"], d["2010"], d["2015"], d["2020"]);
                    }) * 0.9] 
            });

            // event lisner on slider change the selected year dynamically
            rangeInput.addEventListener("input",function(){
                let top = parseFloat(rangeInput.value - 1990)/step * -40;
                rangeValue.style.marginTop = top+"px";

                selectedYear = rangeInput.value;

                // in case kalau mau di lihat per year
                // colorScale.domain([
                //     d3.min(data, function(d){
                //         return d[selectedYear];
                //     }),0,
                //     d3.max(data, function(d){
                //         return d[selectedYear];
                //     })]);

                svg.selectAll("path")
                .data(geojson.features) // important data from geojson is under features key
                .join("path")
                .attr("id", function(d){
                    return d.properties.subregion.replace(/ /g, '');
                })
                .style("fill", function(d){
                    return colorScale(d.properties.netMigration[selectedYear])
                })
                .attr("stroke", "black")
                .attr("d", path)
                .on("mouseover",function(event, d){
                    return mouseOver(this, d.properties)
                })
                .on("mouseout",mouseOut);

                // in case kalau mau di lihat per year
                // legend({
                //     color: colorScale,
                //     title: "Population Growth by Migration (in Millions)",
                //     tickFormat: ".2s",
                //     tickValues: [
                //         d3.min(data, function(d){return d[selectedYear];}) * 0.9,
                //         d3.min(data, function(d){return d[selectedYear];}) * 0.45,
                //         0,
                //         d3.max(data, function(d){return d[selectedYear];}) * 0.45,
                //         d3.max(data, function(d){return d[selectedYear];}) * 0.9] 
                // });
            });

            // let na = svg.selectAll(".NorthernAmerica").node().getBBox();
            // console.log(na);
            
        })
    })
    
} 
window.onload = init();