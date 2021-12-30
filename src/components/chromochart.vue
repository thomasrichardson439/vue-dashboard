<template>
  <b-container ref="wrapper">
    <svg id="d3"></svg>
  </b-container>
</template>

<style>
/* Style the lines by removing the fill and applying a stroke */
.line {
  fill: none;
  stroke: hsl(225, 91%, 37%);
  stroke-width: 1;
}

.overlay {
  fill: none;
  pointer-events: all;
}

/* Style the dots by assigning a fill and stroke */
.dot {
  fill: #0e00a8;
  stroke: #fff;
}

.focus circle {
  fill: none;
  stroke: steelblue;
}
</style>

<script>
import * as d3 from "d3";
import Amplify from "@aws-amplify/core";

const Logger = Amplify.Logger;
Logger.LOG_LEVEL = "DEBUG"; // to show detailed logs from Amplify library
const logger = new Logger("chart");

export default {
  props: ["cgram"],
  data() {
    return {
      chart: null,
      data: [],
      svg: null
    };
  },
  methods: {
    renderChart() {
      // 2. Use the margin convention practice
      var margin = { top: 10, right: 70, bottom: 100, left: 50 },
        width = this.$refs.wrapper.clientWidth - margin.left - margin.right, // Use the window's width
        height = 700 - margin.top - margin.bottom; // Use the window's height
      // const chart_width = 1000 - 2 * margin;
      // const chart_height = 600 - 2 * margin;

      logger.debug("width " + this.$refs.wrapper.clientWidth);
      logger.debug("c width " + width);

      // const n = 21;

      // 5. X scale will use the index of our data
      var xScale = d3
        .scaleTime()
        .domain(d3.extent(this.data, d => d.date)) // input
        .range([0, width - margin.right]); // output

      // 6. Y scale will use the randomly generate number
      var yScale = d3
        .scaleLinear()
        .domain([0, d3.max(this.data, d => d.val)])
        .nice()
        .range([height - margin.bottom, 0]); // output

      // 7. d3's line generator
      var line = d3
        .line()
        .x(d => {
          return xScale(d.date);
        })
        .y(d => {
          return yScale(d.val);
        }) // set the y values for the line generator
        .curve(d3.curveMonotoneX); // apply smoothing to the line

      // 8. An array of objects of length N. Each object has key -> value pair, the key being "y" and the value is a random number
      //   var dataset = d3.range(n).map(function() {
      //     return { y: d3.randomUniform(1)() };
      //   });

      //var parser = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ");
      if (this.svg == null) {
        this.svg = d3
          .select("#d3")
          .attr("width", width)
          .attr("height", height)
          .append("g")
          .attr(
            "transform",
            "translate(" + margin.left + "," + margin.top + ")"
          );
      } else {
        logger.debug("clear!");
        this.svg.selectAll("*").remove();
      }

      // 3. Call the x axis in a group tag
      this.svg
        .append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale)); // Create an axis component with d3.axisBottom

      // 4. Call the y axis in a group tag
      this.svg
        .append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft

      // 9. Append the path, bind the data, and call the line generator
      this.svg
        .append("path")
        .datum(this.data) // 10. Binds data to the line
        .attr("class", "line") // Assign a class for styling
        .attr("d", line); // 11. Calls the line generator
    }
  },
  mounted() {
    logger.debug("HERE");
    this.data = this.$props.cgram.map(x => {
      return { date: x.date, val: x.val };
    });
    this.$watch(
      "cgram",
      () => {
        this.data = this.$props.cgram.map(x => {
          return { date: x.date, val: x.val };
        });
        this.renderChart();
      },
      { immediate: true }
    );
    this.renderChart();
  }
};
</script>
