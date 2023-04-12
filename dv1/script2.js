function init(){

    // SVG size
    const w = 1100, h = 700;

    // setting up d3 projection, used to tranform coordinates into x and y values
    const projection = d3.geoMercator()
    .center([0,40]) // earth is 3d so this three methods help scale the image into 2d version
    .translate([1000/2, h/2])
    .scale(150);

    // color scale
    const colorScale = d3.scaleDiverging(d3.interpolateRdYlGn);

    // is a method that produce path's data for attribute d
    const path = d3.geoPath()
    .projection(projection);

    // svg base creation
    const svg = d3.select(".chart").append("svg").attr("width", w).attr("height", h).style("border","1px solid black");

    // function for choroplast legend
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

    // function to get centroid area of each sub region
    function getBoundingBoxCenter (selection) {
        var element = selection.node();
            // use the native SVG interface to get the bounding box
        var bbox = element.getBBox();
        if (selection.attr("id") == "EasternEurope"){
            // return the center of the bounding box
            return [bbox.x + bbox.width/ 1.3, bbox.y + bbox.height/1.5];
        }
        else if (selection.attr("id") == "WesternEurope"){
            return [bbox.x + bbox.width/ 1.2, bbox.y + bbox.height/6];
        }
        else if (selection.attr("id") == "NorthernEurope"){
            return [bbox.x + bbox.width/ 1.5, bbox.y + bbox.height/1.5];
        }
        else if (selection.attr("id") == "Melanesia"){
            return [bbox.x + bbox.width/ 1.1, bbox.y + bbox.height/4];
        }
        else{
            return [bbox.x + bbox.width/ 2, bbox.y + bbox.height/2];
        }
      }

    
    // geojson calling
    d3.json("customgeotopo.json").then(function(json){
        // unpackage topojson
        let geojson = topojson.feature(json, json.objects.customgeo);
        // netmigration per subregion data
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
        }).then(function(csv1){
            // migration flow per subregion
            d3.csv("subregionMigration.csv", (data) => {
                return {
                    origin: data.origin,
                    destination: data.destination,
                    1990: +data["1990"],
                    1995: +data["1995"],
                    2000: +data["2000"],
                    2005: +data["2005"],
                    2010: +data["2010"],
                    2015: +data["2015"],
                    2020: +data["2020"]
                }
            }).then(function(csv2){
                for(const d of csv1){
                    const subRegion = d.subregion;
                    for (const j of geojson.features){
                        if (subRegion == j.properties.subregion ){
                            j.properties.netMigration = d;
                        }
                    }
                }

                // Functions for mouse interactions
                function mouseOver (e, obj){
                    svg.selectAll(".subregion")
                    .transition()
                    .duration(100)
                    .style("filter", "saturate(0.4)")
                    .style("opacity", "0.3");

                    svg.select(`#${d3.select(e).attr("id")}`)
                    .transition()
                    .duration(100)
                    .style("filter", "saturate(1)")
                    .style("opacity", "1");
        
                    let textgroup = svg.append("g").attr("id", "text-group");

                    let text = textgroup.append("text")
                    .attr("id", "info-box")
                    .attr("x", d3.pointer(event)[0])
                    .attr("y", d3.pointer(event)[1])
                    
                    text.append("tspan")
                    .text(obj.subregion)
                    .style("font-family", "'Signika', sans-serif" )
                    .attr("fill", "white");

                    text.append("tspan")
                    .attr("id", "line2")
                    .text(`${obj.netMigration[selectedYear].toLocaleString()} `)
                    .attr("x", d3.pointer(event)[0])
                    .style("font-family", "'Signika', sans-serif" )
                    .style("font-weight", "800")
                    .style("font-size", "1.5rem")
                    .attr("dx", "0.5rem")
                    .attr("dy", "1.4rem")
                    .attr("fill", "white");

                    text.append("tspan")
                    .text("NET")
                    .style("font-family", "'Signika', sans-serif" )
                    .attr("dy", "-0.5rem")
                    .style("font-size", "0.7rem")
                    .attr("fill", "white");
                    
                    text.append("tspan")
                    .text("MIGRATION")
                    .style("font-family", "'Signika', sans-serif" )
                    .style("font-size", "0.7rem")
                    .attr("dx", "-1.3rem")
                    .attr("dy", "0.6rem")
                    .attr("fill", "white");

                    text.attr("transform", `translate(20, -${text.node().getBBox().height})`)
                    textgroup.insert("rect", ":first-child")
                    .attr("x", d3.pointer(event)[0])
                    .attr("y", d3.pointer(event)[1])
                    .attr("rx", 5)
                    .attr("ry", 5)
                    .attr("height", text.node().getBBox().height)
                    .attr("width", text.node().getBBox().width)
                    .attr("transform", `translate(20, -${text.node().getBBox().height + 15})`)
                    .style("fill", "#515152");

                    
                    svg.selectAll(".subregion").on("mousemove", function(event){
                        svg.selectAll("rect")
                        .attr("x", d3.pointer(event)[0])
                        .attr("y", d3.pointer(event)[1])
                        .attr("width", text.node().getBBox().width + 20)
                        .attr("height", text.node().getBBox().height + 10)
        
                        svg.select("#info-box")
                        .attr("x", d3.pointer(event)[0] + 10)
                        .attr("y", d3.pointer(event)[1] + 5);

                        svg.select("#line2")
                        .attr("x", d3.pointer(event)[0]);
                    })
                }   
        
                function mouseOut(){
                    svg.selectAll(".subregion")
                    .transition()
                    .duration(100)
                    .style("filter", "saturate(1)")
                    .style("opacity", "1");
        
                    svg.selectAll("rect").remove();
                    svg.selectAll("#info-box").remove();
                    svg.selectAll("#text-group").remove();
                }
    

                function mouseClick(e, obj){

                    svg.selectAll(".link").remove();

                    let migrationflows = [];
                    links = [];
                    let circleRadius = 15;


                    for (const flow1 of csv2){
                        for (const flow2 of csv2){
                            if (flow1.origin.trim() == flow2.destination.trim() && flow1.destination.trim() == flow2.origin.trim()){
                                let flow = {
                                    from: flow2.origin.trim(),
                                    to: flow2.destination.trim(),
                                    netmigration: flow2[selectedYear] - flow1[selectedYear]  
                                };
                                migrationflows.push(flow);
                            }
                        }            
                    }

                    if (obj.subregion == selectedsubregion){
                        selectedsubregion = "";
                    }
                    else{
                        selectedsubregion = obj.subregion;
                    }

                    svg.selectAll("path")
                    .transition()
                    .duration(100)
                    .style("filter", "saturate(1)")
                    .style("opacity", "1");
        
                    svg.selectAll("rect").remove();
                    svg.selectAll("#info-box").remove();
                    svg.selectAll("#text-group").remove();

                    migrationflows.forEach(function(row){
                        // due to a condition in the dataset
                        if (row.from == "NORTHERN AMERICA"){
                            row.from = "Northern America";
                        }
                        if (row.to  == "NORTHERN AMERICA"){
                            row.to = "Northern America";
                        }

                        if (row.to == obj.subregion){
                            let from = row.from.replace(/ /g, '');
                            let to = row.to.replace(/ /g, '');
                            let start = getBoundingBoxCenter(svg.select(`#${to}`));
                            let target = getBoundingBoxCenter(svg.select(`#${from}`));
                            
                            let angle = Math.atan2(target[1] - start[1], target[0] - start[0]) * 180 / Math.PI ;

                            // Calculate the starting point on the perimeter of the invisible circle
                            let startPoint = [start[0] + circleRadius * Math.cos(angle * Math.PI / 180),
                                                start[1] + circleRadius * Math.sin(angle * Math.PI / 180)];

                            let topush = [startPoint, target, row.from, row.to, row.netmigration];
                            links.push(topush);
                        }
                    });

                    svg.selectAll(".link")
                    .data(links)
                    .join("path")
                    .attr("d", function(d){ 
                        const fromP = { x: d[0][0], y: d[0][1] };
                        const toP = {x: d[1][0], y: d[1][1]};
                      
                        let dx = toP.x - fromP.x;
                        let dy = toP.y - fromP.y;
                        let cx = (fromP.x + toP.x) / 2 + dy / 4;
                        let cy = (fromP.y + toP.y) / 2 - dx / 4;

                        const path = d3.path();
                        path.moveTo(fromP.x, fromP.y);
                        path.quadraticCurveTo(cx, cy, toP.x, toP.y);
                        return path;
                    })
                    .attr("class","link")
                    .style("fill", "none")
                    .style("stroke", function(d){
                        if (d[4] < 0){
                            return "red";
                        }
                        else{
                            return "blue";
                        }
                    })
                    .style("stroke-width", 3)
                    .attr("stroke-linecap", "round")
                    .attr("stroke-dasharray", function() {
                        return this.getTotalLength();
                    })
                    .attr("stroke-dashoffset", function() {
                        return this.getTotalLength();
                    })
                    .on("mouseover", function(event, d){
                        svg.selectAll(".link")
                        .style("opacity", "0.2");
    
                        d3.select(this)
                        .style("filter", "saturate(1)")
                        .style("opacity", "1");

                        let textgroup = svg.append("g").attr("id", "text-group");

                        let text = textgroup.append("text")
                        .attr("id", "info-box")
                        .attr("x", d3.pointer(event)[0])
                        .attr("y", d3.pointer(event)[1])
                        
                        text.append("tspan")
                        .text(`${d[4].toLocaleString()} `)
                        .style("font-family", "'Signika', sans-serif" )
                        .attr("fill", "white")
                        .attr("dy", "0.5rem")
                        .style("font-weight", "800")
                        .style("font-size", "1.5rem");

                        text.append("tspan")
                        .text("NET")
                        .style("font-family", "'Signika', sans-serif" )
                        .attr("dy", "-0.5rem")
                        .style("font-size", "0.7rem")
                        .attr("fill", "white");
                        
                        text.append("tspan")
                        .text("MOVES")
                        .style("font-family", "'Signika', sans-serif" )
                        .style("font-size", "0.7rem")
                        .attr("dx", "-1.3rem")
                        .attr("dy", "0.6rem")
                        .attr("fill", "white");

                        text.append("tspan")
                        .text("FROM")
                        .attr("id", "line2")
                        .style("font-family", "'Signika', sans-serif" )
                        .style("font-size", "0.7rem")
                        .attr("x", d3.pointer(event)[0])
                        .attr("dx", "0.5rem")
                        .attr("dy", "1.2rem")
                        .attr("fill", "white");

                        let from = d[2];
                        let to = d[3];
                        if(d[4] < 0){
                            from = d[3];
                            to = d[2];
                        }

                        text.append("tspan")
                        .text(` ${from}`)
                        .style("font-family", "'Signika', sans-serif" )
                        .style("font-size", "1rem")
                        .attr("fill", "white");

                        text.append("tspan")
                        .text("TO")
                        .attr("id", "line3")
                        .style("font-family", "'Signika', sans-serif" )
                        .style("font-size", "0.7rem")
                        .attr("x", d3.pointer(event)[0])
                        .attr("dx", "0.5rem")
                        .attr("dy", "1.2rem")
                        .attr("fill", "white");

                        text.append("tspan")
                        .text(` ${to}`)
                        .style("font-family", "'Signika', sans-serif" )
                        .style("font-size", "1rem")
                        .attr("fill", "white");

                        text.attr("transform", `translate(20, -${text.node().getBBox().height})`)

                        textgroup.insert("rect", ":first-child")
                        .attr("x", d3.pointer(event)[0])
                        .attr("y", d3.pointer(event)[1])
                        .attr("rx", 5)
                        .attr("ry", 5)
                        .attr("height", text.node().getBBox().height)
                        .attr("width", text.node().getBBox().width)
                        .attr("transform", `translate(20, -${text.node().getBBox().height + 15})`)
                        .style("fill", "#515152");

                        svg.selectAll(".link").on("mousemove", function(event){
                            svg.selectAll("rect")
                            .attr("x", d3.pointer(event)[0])
                            .attr("y", d3.pointer(event)[1])
                            .attr("width", text.node().getBBox().width + 20)
                            .attr("height", text.node().getBBox().height + 10)
            
                            svg.select("#info-box")
                            .attr("x", d3.pointer(event)[0] + 10)
                            .attr("y", d3.pointer(event)[1] + 5);

                            svg.select("#line2")
                            .attr("x", d3.pointer(event)[0]);

                            svg.select("#line3")
                            .attr("x", d3.pointer(event)[0]);
                        })

                    
                    })
                    .on("mouseout", function(){
                        svg.selectAll(".link")
                        .style("opacity", "1");
                        svg.selectAll("rect").remove();
                        svg.selectAll("#info-box").remove();
                        svg.selectAll("#text-group").remove();
                    });
                    
                    svg.selectAll(".link")
                    .transition()
                    .duration(700)
                    .ease(d3.easeLinear)
                    .attr("stroke-dashoffset", 0);
            
                }
    
                // selected sub region and year
                let selectedsubregion = "";
                let selectedYear = "1990";

                // Preserve links
                let links = [];
    
                colorScale.domain([
                    d3.min(csv1, function(d){
                        return Math.min(d["1990"], d["1995"], d["2000"], d["2005"], d["2010"], d["2015"], d["2020"]);
                    }),0,
                    d3.max(csv1, function(d){
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
                .attr("class","subregion")
                .attr("d", path)
                .on("mouseover",function(event, d){
                    return mouseOver(this, d.properties)
                })
                .on("mouseout",mouseOut)
                .on("click", function(event,d) {
                    return mouseClick(this, d.properties);
                });

                legend({
                    color: colorScale,
                    title: "Population Growth by Migration (in Millions)",
                    tickFormat: ".2s",
                    tickValues: [
                        d3.min(csv1, function(d){
                            return Math.min(d["1990"], d["1995"], d["2000"], d["2005"], d["2010"], d["2015"], d["2020"]);
                        }) * 0.9,
                        d3.min(csv1, function(d){
                            return Math.min(d["1990"], d["1995"], d["2000"], d["2005"], d["2010"], d["2015"], d["2020"]);
                        }) * 0.45,
                        0,
                        d3.max(csv1, function(d){
                            return Math.max(d["1990"], d["1995"], d["2000"], d["2005"], d["2010"], d["2015"], d["2020"]);
                        }) * 0.45,
                        d3.max(csv1, function(d){
                            return Math.max(d["1990"], d["1995"], d["2000"], d["2005"], d["2010"], d["2015"], d["2020"]);
                        }) * 0.9] 
                });


    
                // Year slider
                let rangeInput = document.querySelector(".range-input input");
                let rangeValue = document.querySelector(".range-input .value div");
                let start = parseFloat(rangeInput.min);
                let end = parseFloat(rangeInput.max);
                let step = parseFloat(rangeInput.step);
    
                for(let i=start;i<=end;i+=step){
                    rangeValue.innerHTML += '<div>'+i+'</div>';
                }

                // event lisner on slider change the selected year dynamically
                rangeInput.addEventListener("input",function(){
                    let top = parseFloat(rangeInput.value - 1990)/step * -40;
                    rangeValue.style.marginTop = top+"px";
    
                    selectedYear = rangeInput.value;

                    svg.selectAll(".subregion").remove();
                    svg.selectAll(".link").remove();
                    svg.selectAll(".path")
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
                    .attr("class","subregion")
                    .on("mouseover",function(event, d){
                        return mouseOver(this, d.properties)
                    })
                    .on("mouseout",mouseOut)
                    .on("click", function(event,d) {
                        return mouseClick(this, d.properties);
                    });
    
                });
            })
        })
    })
    
} 
window.onload = init();