// OpenSeadragon SVG Overlay plugin 0.0.5
// Edited to use import instead of window/require by chris cauley

import OpenSeadragon from 'openseadragon'
const { Viewer, Point, MouseTracker } = OpenSeadragon

// ----------
Viewer.prototype.svgOverlay = function(svg) {
  if (this._svgOverlayInfo) {
    return this._svgOverlayInfo
  }

  this._svgOverlayInfo = new Overlay(this, svg)
  return this._svgOverlayInfo
}

// ----------
var Overlay = function(viewer, svg) {
  var self = this

  this._viewer = viewer
  this._containerWidth = 0
  this._containerHeight = 0

  this._svg = svg
  this._svg.style.position = 'absolute'
  this._svg.style.left = 0
  this._svg.style.top = 0
  this._svg.style.width = '100%'
  this._svg.style.height = '100%'
  this._viewer.canvas.appendChild(this._svg)

  this._node = svg.childNodes[0]
  if (svg.childNodes.length !== 1 || this._node.tagName.toLowerCase() !== 'g') {
    throw 'SvgOverlay must have one child node and it must bea  <g>'
  }
  this._svg.appendChild(this._node)

  this._viewer.addHandler('animation', function() {
    self.resize()
  })

  this._viewer.addHandler('open', function() {
    self.resize()
  })

  this._viewer.addHandler('rotate', function() {
    self.resize()
  })

  this._viewer.addHandler('resize', function() {
    self.resize()
  })

  this.resize()
}

// ----------
Overlay.prototype = {
  // ----------
  node: function() {
    return this._node
  },

  // ----------
  resize: function() {
    if (this._containerWidth !== this._viewer.container.clientWidth) {
      this._containerWidth = this._viewer.container.clientWidth
      this._svg.setAttribute('width', this._containerWidth)
    }

    if (this._containerHeight !== this._viewer.container.clientHeight) {
      this._containerHeight = this._viewer.container.clientHeight
      this._svg.setAttribute('height', this._containerHeight)
    }

    var p = this._viewer.viewport.pixelFromPoint(new Point(0, 0), true)
    var zoom = this._viewer.viewport.getZoom(true)
    var rotation = this._viewer.viewport.getRotation()
    // TODO: Expose an accessor for _containerInnerSize in the OSD API so we don't have to use the private variable.
    var scale = this._viewer.viewport._containerInnerSize.x * zoom
    this._node.setAttribute(
      'transform',
      'translate(' + p.x + ',' + p.y + ') scale(' + scale + ') rotate(' + rotation + ')',
    )
  },

  // ----------
  onClick: function(node, handler) {
    // TODO: Fast click for mobile browsers

    new MouseTracker({
      element: node,
      clickHandler: handler,
    }).setTracking(true)
  },
}
