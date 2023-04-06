// function for legend
function legend({
    color,
    title,
    tickSize = 6,
    width = 36 + tickSize, 
    height = 320,
    marginTop = 50,
    marginRight = 10 + tickSize,
    marginBottom = 20,
    marginLeft = 5,
    ticks = height / 50,
    tickFormat,
    tickValues
  } = {}) {
  
    svg.append("g").attr("class", "legend");
    svg2 = svg.select(".legend").attr("transform", `translate( ${marginLeft + 10}, ${h - height})`);
    let tickAdjust = g => g.selectAll(".tick line").attr("x1", marginLeft - width + marginRight);
    let x;
    
    if (color.interpolator) {
        x = Object.assign(color.copy()
            .interpolator(d3.interpolateRound(height - marginBottom, marginTop)),
            {range() { return [height - marginBottom, marginTop]; }});

    
        svg2.append("image")
            .attr("x", marginLeft)
            .attr("y", marginTop)
            .attr("width", width - marginLeft - marginRight)
            .attr("height", height - marginTop - marginBottom)
            .attr("preserveAspectRatio", "none")
            .attr("xlink:href", ramp(color.interpolator()).toDataURL());
    }
  
    svg2.append("g")
        .attr("transform", `translate(${width - marginRight},0)`)
        .call(d3.axisRight(x)
          .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
          .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
          .tickSize(tickSize)
          .tickValues(tickValues))
        .call(tickAdjust)
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
          .attr("x", marginLeft - width + marginRight)
          .attr("y", 30)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .attr("class", "title")
          .attr("font-size", "12")
          .text(title));
    return svg2.node();
  }

  function ramp(color, n = 256) {
    var canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = n;
    const context = canvas.getContext("2d");
    for (let i = 0; i < n; ++i) {
      context.fillStyle = color(i / (n - 1));
      context.fillRect(0, n-i, 1, 1);
    }
    return canvas;
  }