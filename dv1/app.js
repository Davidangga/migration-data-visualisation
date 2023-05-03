const selectedYearEl = document.getElementById("selected");
const yearSliderEl = document.getElementById("slider");
const chartContainerEl = document.getElementById("chart-container");

const svgWidth = 900;
const svgHeight = 600;
const margin = { top: 50, right: 50, bottom: 50, left: 130 };
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

// Select the SVG element and set its dimensions
const svg = d3.select("#chart").attr("width", svgWidth).attr("height", svgHeight);

// Create a group element and translate it by the margin values
const g = svg
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Add the x-axis element
g.append("g")
  .attr("class", "x-axis")
  .attr("transform", `translate(0, ${height})`);

// Add the y-axis element
g.append("g").attr("class", "y-axis");

// START FUNCTION ~
const generateScatterPlot = (year) => {
  d3.csv("data.csv").then((data) => {
    // Convert numeric strings to numbers
    data.forEach((d) => {
      d["i" + year] = +d["i" + year];
      d["g" + year] = +d["g" + year];
    });

    // Set the x-scale and y-scale ranges and domain
    const xScale = d3
      .scaleLinear()
      .range([0, width])
      .domain([
        d3.min(data, (d) => d["i" + year]),
        d3.max(data, (d) => d["i" + year]),
      ]);

    const yScale = d3
      .scaleLinear()
      .range([height, 0])
      .domain([
        d3.min(data, (d) => d["g" + year]),
        d3.max(data, (d) => d["g" + year]),
      ]);

    // Add the x-axis to the SVG
    g.select(".x-axis")
      .transition()
      .duration(1000)
      .call(d3.axisBottom(xScale).tickFormat(d3.format(".2s")));

    // Add the y-axis to the SVG
    g.select(".y-axis").transition().duration(1000).call(d3.axisLeft(yScale));

  // Add a tooltip div. Here I define the general feature of the tooltip: stuff that do not depend on the data point.
  // Its opacity is set to 0: we don't see it by default.
  // const tooltip = d3.select("#chart")
  //   .append("rect");

  // A function that change this tooltip when the user hover a point.
  // Its opacity is set to 1: we can now see it. Plus it set the text and position of tooltip depending on the datapoint (d)
  const mouseover = function(event, d) {
    // d3.select("#chart")
    // .append("rect")
    // .attr("id","tooltip")
    // .attr("x", event.x + 20 )
    // .attr("y", event.y - 170)
    // .attr("width", "250px")
    // .attr("height", "100px")
    // .style("fill", "white")
    // .style("stroke", "black")
    // .attr("rx", 10) // set x-radius to 10
    // .attr("ry", 10);

    // d3.select("#chart")
    // .append("text")
    // .style("font-family", "'Signika', sans-serif" )
    // .style("font-weight", 800)
    // .attr("id", "tooltip-text")
    // .text(d.country)
    // .attr("x", event.x + 30 )
    // .attr("y", event.y - 150);
    // }
    let textgroup = d3.select("#chart").append("g").attr("id", "text-group");

    let text = textgroup.append("text")
    .attr("id", "info-box")
    .attr("x", event.x +10)
    .attr("y", event.y -70)
    
    text.append("tspan")
    .text(d.country)
    .style("font-family", "'Signika', sans-serif" )
    .attr("fill", "black");

    text.append("tspan")
    .attr("id", "line2")
    .text(function(){
      if (event.target.classList.item(0) == "circle1"){
        return d["i" + year]
      }
      else {
        return d["e" + year]
      }
    })

    .attr("x", event.x + 20 )
    .style("font-family", "'Signika', sans-serif" )
    .style("font-weight", "800")
    .style("font-size", "1.5rem")
    .attr("dx", "0.1rem")
    .attr("dy", "1.4rem")
    .attr("fill", "black");

    text.append("tspan")
    .text(function(){
      if (event.target.classList.item(0) == "circle1"){
        return "IMIGRATION"
      }
      else {
        return "EMIGRATION"
      }
    })
    .style("font-family", "'Signika', sans-serif" )
    .attr("dx", "0.1rem")
    .attr("dy", "-0.1rem")
    .style("font-size", "1rem")
    .attr("fill", "black");

    text.append("tspan")
    .attr("id", "line3")
    .text(d["g" + year].toFixed(2))
    .attr("x", event.x + 20 )
    .style("font-family", "'Signika', sans-serif" )
    .style("font-weight", "800")
    .style("font-size", "1.5rem")
    .attr("dx", "0.1rem")
    .attr("dy", "1.4rem")
    .attr("fill", "black");

    text.append("tspan")
    .text("GDP GROWTH")
    .style("font-family", "'Signika', sans-serif" )
    .attr("dx", "0.1rem")
    .attr("dy", "-0.1rem")
    .style("font-size", "1rem")
    .attr("fill", "black");

    text.attr("transform", `translate(25, -${text.node().getBBox().height})`)
    textgroup.insert("rect", ":first-child")
    .attr("x", event.x +10)
    .attr("y", event.y -70)
    .attr("rx", 5)
    .attr("ry", 5)
    .attr("height", text.node().getBBox().height + 10)
    .attr("width", text.node().getBBox().width + 12)
    .attr("transform", `translate(20, -${text.node().getBBox().height + 18})`)
    .style("fill", "white")
    .style("stroke", "black")
    .attr("rx", 10) // set x-radius to 10
    .attr("ry", 10);
  }

  const mousemove = function(event, d) {
    d3.select("#tooltip")
    .attr("x", event.x + 20 )
    .attr("y", event.y - 170);

    d3.select("#tooltip-text")
    .attr("x", event.x + 30 )
    .attr("y", event.y - 150);
    }

  // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
  const mouseleave = function(event,d) {
    d3.select("#tooltip").remove();
    d3.select("#text-group").remove();
  }
if (d3.select("#zoom").empty()){
  g.append("rect")
  .attr("id", "zoom")
  .attr("width", width)
  .attr("height", height)
  .style("fill", "none")
  .style("pointer-events", "all");
}
d3.select("#zoom").call(
  d3
    .zoom()
    .scaleExtent([1, 20])
    .on("zoom", (event) => {
      const transform = event.transform;
      const newXScale = transform.rescaleX(xScale);
      const newYScale = transform.rescaleY(yScale);
      scatter
        .attr("cx", (d) => newXScale(+d["i" + year]))
        .attr("cy", (d) => newYScale(+d["g" + year]));
      scatter2
        .attr("cx", (d) => newXScale(+d["e" + year]))
        .attr("cy", (d) => newYScale(+d["g" + year]));
      g.select(".x-axis").call(
        d3.axisBottom(newXScale).tickFormat(d3.format(".2s"))
      );
      g.select(".y-axis").call(d3.axisLeft(newYScale));
    })
);
   
    // Add the scatter plot points
    const scatter = g.selectAll(".circle1").data(data);
    scatter.exit().remove();
    scatter
      .enter()
      .append("circle")
      .attr('class', 'circle1')
      .attr("r", 4)
      .merge(scatter)
      .on("mouseover", mouseover )
      .on("mouseleave", mouseleave )
      .on("mousemove", mousemove )
      .transition()
      .duration(1000)
      .attr("cx", (d) => xScale(d["i" + year]))
      .attr("cy", (d) => yScale(d["g" + year]))
      .attr("fill", "steelblue")
      .style("opacity", 0.7)
      .attr("clip-path", "url(#clip)");
  
    
    const scatter2 = g.selectAll(".circle2").data(data);
    scatter2.exit().remove();
    scatter2
      .enter()
      .append("circle")
      .attr('class', 'circle2')
      .attr("r", 4)
      .merge(scatter2)
      .on("mousemove", mousemove )
      .on("mouseover", mouseover )
      .on("mouseleave", mouseleave )
      .transition()
      .duration(1000)
      .attr("cx", (d) => xScale(d["e" + year]))
      .attr("cy", (d) => yScale(d["g" + year]))
      .attr("fill", "orange")
      .style("opacity", 0.5)
      .attr("clip-path", "url(#clip)");

          // Define clip path
     g.append("defs")
     .append("svg:clipPath")
     .attr("id", "clip")
     .append("svg:rect")
     .attr("width", width)
     .attr("height", height)
       .style("fill", "none");
      // Add the x-axis label
g.append("text")
.attr("class", "x-axis-label")
.attr("text-anchor", "middle")
.attr("x", width / 2)
.attr("y", height + margin.bottom - 10)
.text("Migration in Millions");

// Add the y-axis label
g.append("text")
.attr("class", "y-axis-label")
.attr("text-anchor", "middle")
.attr("transform", `rotate(-90) translate(-${height / 2}, ${margin.left - 160})`)
.text("GDP Growth in %");

  });
};

yearSliderEl.addEventListener("input", () => {
  selectedYearEl.innerHTML = yearSliderEl.value;
});

yearSliderEl.addEventListener("change", () => {
  const selectedValue = yearSliderEl.value;
  
  generateScatterPlot(selectedValue);
});
generateScatterPlot();
generateScatterPlot("1990"); //default in 1990

const options = document.querySelectorAll('input[type="radio"]');

options.forEach(option => option.addEventListener('change', handleOptionChange));

function handleOptionChange() {
  const selectedOption = document.querySelector('input[type="radio"]:checked').value;

  d3.selectAll(".circle2").transition().duration(500).style("opacity", selectedOption === 'option1' ? 0 : selectedOption === 'option2' ? 0.7 : 0.5);
  d3.selectAll(".circle1").transition().duration(500).style("opacity", selectedOption === 'option1' ? 0.7 : selectedOption === 'option2' ? 0 : 0.7);
}

