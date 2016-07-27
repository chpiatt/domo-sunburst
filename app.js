// Set of colors to choose from to support arbitrary number of sources up to array length.
// Could be extended to support additional sources if needed.
var potential_colors = ["#5687d1", "#7b615c", "#de783b", "#6ab975", "#a173d1", "#bbbbbb", "#cccf6c", "#4C0000", "#0C4C07", "#61035D", "#3493A0", "#245604", "#560419", "#7ba5e4", "#df61be", "#6165df", "#dc8850", "#61df88", "#976ae1", "#e16a9a", "#b3e16a"];
var colors = {};

// Total number of conversions. Gets set after data is parsed.
var numConversions;

var pathsLengthArray = [];

// Fetch, parse, and visualize data.
domo.get('/data/v1/sequences')
  .then(convertDataObjectToArray)
  .then(createPaths)
  .then(createVisualization)
  .catch(function() {
    console.log('Error fetching data');
  });

// Converts incoming array of objects to array of arrays for easy iteration
function convertDataObjectToArray(data) {
  var newData = data.map(function(d) {
    var newArray = [];
    for (var item in d) {
      newArray.push(d[item]);
    }
    return newArray;
  });
  return newData;
}

// Converts raw data into paths for visualization
function createPaths(data) {
  var sources = [];
  var sets = [];
  var counter = {};
  var paths = {};
  var pathsArray = [];

  for (var i = 0; i < data.length; i++) {
    if (sources.indexOf(data[i][1]) === -1) {
      sources.push(data[i][1]);
    }
    if (paths[data[i][0]]) {
      paths[data[i][0]].push(data[i][1]);
    } else {
      paths[data[i][0]] = [data[i][1]];
    }
  }

  // Mapping of step names to colors.
  for (var i = 0; i < sources.length; i++) {
    colors[sources[i]] = potential_colors[i];
  }


  Object.keys(paths).forEach(function(key, index) {
    pathsArray.push(paths[key]);
    pathsLengthArray.push(paths[key].length);
  });

  // Sets the total number of conversions using the unique conversion IDs
  numConversions = pathsArray.length;

  function combinations(set) {
    for (var k = 0; k < set.length; k++) {
      counter[set[k]] = (counter[set[k]] || 0) + 1;
    }
    return counter;
  }

  combinations(pathsArray);

  Object.keys(counter).forEach(function(key, index) {
    sets.push([key, counter[key]]);
  });
  var json = buildHierarchy(sets);
  return json;
}

// Creates JSON tree with paths to be visualized by d3.
function buildHierarchy(sets) {
  var root = {
    "name": "root",
    "children": []
  };
  for (var i = 0; i < sets.length; i++) {
    var sequence = sets[i][0];
    var size = +sets[i][1];
    if (isNaN(size)) { // e.g. if this is a header row
      continue;
    }
    var parts = sequence.split(",");
    var currentNode = root;
    if (parts.length != 1) {
      var numSteps = parts.length < 8 ? parts.length : 8;
      for (var j = 0; j < numSteps; j++) {
        var children = currentNode["children"];
        var nodeName = parts[j];
        var childNode;
        if (j + 1 < numSteps) {
          // Not yet at the end of the sequence; move down the tree.
          var foundChild = false;
          for (var k = 0; k < children.length; k++) {
            if (children[k]["name"] == nodeName && !children[k]["leafNode"]) {
              childNode = children[k];
              foundChild = true;
              break;
            }
          }
          // If we don't already have a child node for this branch, create it.
          if (!foundChild) {
            childNode = {
              "name": nodeName,
              "children": []
            };
            children.push(childNode);
          }
          currentNode = childNode;
        } else {
          // Reached the end of the sequence; create a leaf node.
          childNode = {
            "name": nodeName,
            "size": size,
            "leafNode": true
          };
          children.push(childNode);
        }
      }
    } else {
      childNode = {
        "name": parts[0],
        "size": size,
        "leafNode": true
      };
      currentNode["children"].push(childNode);
    }
  }
  return root;
};

// Main function to draw and set up the visualization, once we have the data.
function createVisualization(json) {
  // Dimensions of sunburst.
  var width = 750;
  var height = 600;
  var radius = Math.min(width, height) / 2;

  // Breadcrumb dimensions: width, height, spacing, width of tip/tail.
  var b = {
    w: 75,
    h: 30,
    s: 3,
    t: 10
  };

  var vis = d3.select("#chart").append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .append("svg:g")
    .attr("id", "container")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var partition = d3.layout.partition()
    .size([2 * Math.PI, radius * radius])
    .value(function(d) {
      return d.size;
    });

  var arc = d3.svg.arc()
    .startAngle(function(d) {
      return d.x;
    })
    .endAngle(function(d) {
      return d.x + d.dx;
    })
    .innerRadius(function(d) {
      return Math.sqrt(d.y);
    })
    .outerRadius(function(d) {
      return Math.sqrt(d.y + d.dy);
    });
  // Basic setup of page elements.
  initializeBreadcrumbTrail();
  drawLegend();

  // Bounding circle underneath the sunburst, to make it easier to detect
  // when the mouse leaves the parent g.
  vis.append("svg:circle")
    .attr("r", radius)
    .style("opacity", 0);

  // For efficiency, filter nodes to keep only those large enough to see.
  var nodes = partition.nodes(json)
    .filter(function(d) {
      return (d.dx > 0.005); // 0.005 radians = 0.29 degrees
    });

  var path = vis.data([json]).selectAll("path")
    .data(nodes)
    .enter().append("svg:path")
    .attr("display", function(d) {
      return d.depth ? null : "none";
    })
    .attr("d", arc)
    .attr("fill-rule", "evenodd")
    .style("fill", function(d) {
      return colors[d.name];
    })
    .style("opacity", 1)
    .on("mouseover", mouseover);

  d3.select("#numConversions").text(numConversions);
  d3.select("#mean").text(d3.mean(pathsLengthArray).toFixed(1));
  d3.select("#median").text(d3.median(pathsLengthArray));
  d3.select("#max").text(d3.max(pathsLengthArray));
  d3.select("#min").text(d3.median(pathsLengthArray));

  // Add the mouseleave handler to the bounding circle.
  d3.select("#container").on("mouseleave", mouseleave);

  // Get total size of the tree = value of root node from partition.
  var totalSize = path.node().__data__.value;

  // Fade all but the current sequence, and show it in the breadcrumb trail.
  function mouseover(d) {

    var percentage = (100 * d.value / totalSize).toPrecision(3);
    var numConversionsString;
    if (d.value == 1) {
      numConversionsString = d.value + " Conversion";
    } else {
      numConversionsString = d.value + " Conversions";
    }
    var percentageString = percentage + "%";
    if (percentage < 0.1) {
      percentageString = "< 0.1%";
    }

    d3.select("#percentage")
      .text(percentageString);

    d3.select("#explanation")
      .style("visibility", "");
    d3.select("#conversionsInSet").text(numConversionsString)
      .style("visibility", "");

    var sequenceArray = getAncestors(d);
    updateBreadcrumbs(sequenceArray, percentageString);

    // Fade all the segments.
    d3.selectAll("path")
      .style("opacity", 0.3);

    // Then highlight only those that are an ancestor of the current segment.
    vis.selectAll("path")
      .filter(function(node) {
        return (sequenceArray.indexOf(node) >= 0);
      })
      .style("opacity", 1);
  }

  // Restore everything to full opacity when moving off the visualization.
  function mouseleave(d) {

    // Hide the breadcrumb trail
    d3.select("#trail")
      .style("visibility", "hidden");

    // Deactivate all segments during transition.
    d3.selectAll("path").on("mouseover", null);

    // Transition each segment to full opacity and then reactivate it.
    d3.selectAll("path")
      .transition()
      .duration(1000)
      .style("opacity", 1)
      .each("end", function() {
        d3.select(this).on("mouseover", mouseover);
      });

    d3.select("#explanation")
      .style("visibility", "hidden");
    d3.select("#conversionsInSet")
      .style("visibility", "hidden");
  }

  // Given a node in a partition layout, return an array of all of its ancestor
  // nodes, highest first, but excluding the root.
  function getAncestors(node) {
    var path = [];
    var current = node;
    while (current.parent) {
      path.unshift(current);
      current = current.parent;
    }
    return path;
  }

  function initializeBreadcrumbTrail() {
    // Add the svg area.
    var trail = d3.select("#sequence").append("svg:svg")
      .attr("width", width)
      .attr("height", 50)
      .attr("id", "trail");
    // Add the label at the end, for the percentage.
    trail.append("svg:text")
      .attr("id", "endlabel")
      .style("fill", "#666");
  }

  // Generate a string that describes the points of a breadcrumb polygon.
  function breadcrumbPoints(d, i) {
    var points = [];
    points.push("0,0");
    points.push(b.w + ",0");
    points.push(b.w + b.t + "," + (b.h / 2));
    points.push(b.w + "," + b.h);
    points.push("0," + b.h);
    if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
      points.push(b.t + "," + (b.h / 2));
    }
    return points.join(" ");
  }

  // Update the breadcrumb trail to show the current sequence and percentage.
  function updateBreadcrumbs(nodeArray, percentageString) {

    // Data join; key function combines name and depth (= position in sequence).
    var g = d3.select("#trail")
      .selectAll("g")
      .data(nodeArray, function(d) {
        return d.name + d.depth;
      });

    // Add breadcrumb and label for entering nodes.
    var entering = g.enter().append("svg:g");

    entering.append("svg:polygon")
      .attr("points", breadcrumbPoints)
      .style("fill", function(d) {
        return colors[d.name];
      });

    entering.append("svg:text")
      .attr("x", (b.w + b.t) / 2)
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) {
        return d.name;
      });

    // Set position for entering and updating nodes.
    g.attr("transform", function(d, i) {
      return "translate(" + i * (b.w + b.s) + ", 0)";
    });

    // Remove exiting nodes.
    g.exit().remove();

    // Now move and update the percentage at the end.
    d3.select("#trail").select("#endlabel")
      .attr("x", (nodeArray.length + 0.5) * (b.w + b.s))
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(percentageString);

    // Make the breadcrumb trail visible, if it's hidden.
    d3.select("#trail")
      .style("visibility", "");

  }

  function drawLegend() {

    // Dimensions of legend item: width, height, spacing, radius of rounded rect.
    var li = {
      w: 75,
      h: 30,
      s: 3,
      r: 3
    };

    var legend = d3.select("#legend").append("svg:svg")
      .attr("width", li.w)
      .attr("height", d3.keys(colors).length * (li.h + li.s));

    var g = legend.selectAll("g")
      .data(d3.entries(colors))
      .enter().append("svg:g")
      .attr("transform", function(d, i) {
        return "translate(0," + i * (li.h + li.s) + ")";
      });

    g.append("svg:rect")
      .attr("rx", li.r)
      .attr("ry", li.r)
      .attr("width", li.w)
      .attr("height", li.h)
      .style("fill", function(d) {
        return d.value;
      });

    g.append("svg:text")
      .attr("x", li.w / 2)
      .attr("y", li.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) {
        return d.key;
      });
  }
};
