# Domo Sunburst Visual
![sunburst](http://g.recordit.co/x8a9K6V8rY.gif)

Sunburst visualization for Domo BI tool.  This visualization is useful for path analysis.

## Getting Started

Inside a terminal -
Install CLI:
```
npm install -g ryuu
```
If this command fails, then make sure you have satisfied all the requirements for Git and Node installation, and that you have access to npm. If you're getting permission issues you can either use sudo when installing the CLI, or follow one of the these tutorials for fixing Node permissions:

* https://docs.npmjs.com/getting-started/fixing-npm-permissions
* http://www.johnpapa.net/how-to-use-npm-global-without-sudo-on-osx/


Clone Repository:
```
git clone https://github.com/Pyython/domo-sunburst.git
```

In manifest.json, change dataSetId to the ID of a data set within your Domo instance.  To do this, go to Data Center and click on the target data set.  The ID will be in the URL immediately following the /datasources/ part of the path.


Sign into Domo:
```
domo login
```

To preview in a local environment, run:
```
domo dev
```

To publish the visualization to your Domo instance, run:
```
domo publish
```

You can then find the app in the 'Asset Library' and begin to build cards to analyze your conversion paths.


## Prerequisites

Must have a license for [Domo Business Cloud](https://www.domo.com/pricing)

Must also have Git and Node.js installed:

### Windows Installation
Install [Git](http://git-scm.com/downloads)

The installer will also install "git bash", which you will use as your terminal when running all future commands.

Install [Node.js](https://nodejs.org/)

Verify that Node is properly installed on your path by opening your terminal and typing node --version.
Dev Studio supports up to Node.js v6.x.x
[npm](https://www.npmjs.com/)

Make sure your firewall isn't blocking the npm registry by running "ping www.npmjs.com" in your terminal.

### Mac Installation

Install [Git](http://git-scm.com/downloads)

Install Node.js via "brew install node" on OS X or via [download](https://nodejs.org/).

Verify that Node is properly installed on your path by opening your terminal and typing node --version.
Dev Studio supports up to Node.js v6.x.x

Accept the XCode License "sudo xcodebuild -license"
[npm](https://www.npmjs.com/)

Make sure your firewall isn't blocking the npm registry by running "ping www.npmjs.com" in your terminal.

## Additional Information

For more information on building and deploying Domo apps or to troubleshoot any issues, visit [Domo Dev Studio](https://developer.domo.com/docs/dev-studio/dev-studio-get-started)

### Acknowledgments
Forked, with modifications, from: https://bl.ocks.org/kerryrodden/7090426
