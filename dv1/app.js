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

    // Add the scatter plot points
    const scatter = g.selectAll(".circle1").data(data);
    scatter.exit().remove();
    scatter
      .enter()
      .append("circle")
      .attr('class', 'circle1')
      .attr("r", 4)
      .merge(scatter)
      .transition()
      .duration(1000)
      .attr("cx", (d) => xScale(d["i" + year]))
      .attr("cy", (d) => yScale(d["g" + year]))
      .attr("fill", "steelblue")
      .style("opacity", 0.8)
      .attr("clip-path", "url(#clip)");
    
    const scatter2 = g.selectAll(".circle2").data(data);
    scatter2.exit().remove();
    scatter2
      .enter()
      .append("circle")
      .attr('class', 'circle2')
      .attr("r", 4)
      .merge(scatter2)
      .transition()
      .duration(1000)
      .attr("cx", (d) => xScale(d["e" + year]))
      .attr("cy", (d) => yScale(d["g" + year]))
      .attr("fill", "orange")
      .style("opacity", 0.5)
      .attr("clip-path", "url(#clip)");

    // Add zoom behavior
    g.append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .call(
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

    // Define clip path
    g.append("defs")
      .append("svg:clipPath")
      .attr("id", "clip")
      .append("svg:rect")
      .attr("width", width)
      .attr("height", height);
  });
};

yearSliderEl.addEventListener("input", () => {
  selectedYearEl.innerHTML = yearSliderEl.value;
});

yearSliderEl.addEventListener("change", () => {
  const selectedValue = yearSliderEl.value;
  generateScatterPlot(selectedValue);
});

generateScatterPlot(); //setup
generateScatterPlot("1990"); //default in 1990
