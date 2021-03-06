// Copyright (c) 2016 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import React from 'react';
import {voronoi} from 'd3-voronoi';

import PureRenderComponent from 'pure-render-component';
import {AnimationPropType} from 'animation';
import {
  getAttributeFunctor,
  getAttr0Functor,
  getAttributeValue,
  getScaleObjectFromProps,
  getScalePropTypesByAttribute
} from 'utils/scales-utils';

const propTypes = {
  ...getScalePropTypesByAttribute('x'),
  ...getScalePropTypesByAttribute('y'),
  ...getScalePropTypesByAttribute('size'),
  ...getScalePropTypesByAttribute('opacity'),
  ...getScalePropTypesByAttribute('color'),
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  data: React.PropTypes.array,
  onValueMouseOver: React.PropTypes.func,
  onValueMouseOut: React.PropTypes.func,
  onValueClick: React.PropTypes.func,
  onSeriesMouseOver: React.PropTypes.func,
  onSeriesMouseOut: React.PropTypes.func,
  onSeriesClick: React.PropTypes.func,
  onNearestX: React.PropTypes.func,
  onNearestXY: React.PropTypes.func,
  animation: AnimationPropType
};

const defaultProps = {
  className: ''
};

class AbstractSeries extends PureRenderComponent {

  constructor(props) {
    super(props);
    this._seriesMouseOverHandler = this._seriesMouseOverHandler.bind(this);
    this._valueMouseOverHandler = this._valueMouseOverHandler.bind(this);
    this._seriesMouseOutHandler = this._seriesMouseOutHandler.bind(this);
    this._valueMouseOutHandler = this._valueMouseOutHandler.bind(this);
    this._seriesClickHandler = this._seriesClickHandler.bind(this);
    this._valueClickHandler = this._valueClickHandler.bind(this);
  }

  /**
   * Mouse over handler for the specific series' value.
   * @param {Object} d Value object
   * @param {Object} event Event.
   * @protected
   */
  _valueMouseOverHandler(d, event) {
    const {onValueMouseOver, onSeriesMouseOver} = this.props;
    if (onValueMouseOver) {
      onValueMouseOver(d, {event});
    }
    if (onSeriesMouseOver) {
      onSeriesMouseOver({event});
    }
  }

  /**
   * Mouse over handler for the entire series.
   * @param {Object} event Event.
   * @protected
   */
  _seriesMouseOverHandler(event) {
    const {onSeriesMouseOver} = this.props;
    if (onSeriesMouseOver) {
      onSeriesMouseOver({event});
    }
  }

  /**
   * Mouse out handler for the specific series' value.
   * @param {Object} d Value object
   * @param {Object} event Event.
   * @protected
   */
  _valueMouseOutHandler(d, event) {
    const {onValueMouseOut, onSeriesMouseOut} = this.props;
    if (onValueMouseOut) {
      onValueMouseOut(d, {event});
    }
    if (onSeriesMouseOut) {
      onSeriesMouseOut({event});
    }
  }

  /**
   * Mouse out handler for the entire series.
   * @param {Object} event Event.
   * @protected
   */
  _seriesMouseOutHandler(event) {
    const {onSeriesMouseOut} = this.props;
    if (onSeriesMouseOut) {
      onSeriesMouseOut({event});
    }
  }

  /**
   * Click handler for the specific series' value.
   * @param {Object} d Value object
   * @param {Object} event Event.
   * @protected
   */
  _valueClickHandler(d, event) {
    const {onValueClick, onSeriesClick} = this.props;
    if (onValueClick) {
      onValueClick(d, {event});
    }
    if (onSeriesClick) {
      onSeriesClick({event});
    }
  }

  /**
   * Click handler for the entire series.
   * @param {Object} event Event.
   * @protected
   */
  _seriesClickHandler(event) {
    const {onSeriesClick} = this.props;
    if (onSeriesClick) {
      onSeriesClick({event});
    }
  }

  /**
   * Tells the rest of the world that it requires SVG to work.
   * @returns {boolean} Result.
   */
  static get requiresSVG() {
    return true;
  }

  /**
   * Get a default config for the parent.
   * @returns {Object} Empty config.
   */
  static getParentConfig() {
    return {};
  }

  /**
   * Get attribute functor.
   * @param {string} attr Attribute name
   * @returns {*} Functor.
   * @protected
   */
  _getAttributeFunctor(attr) {
    return getAttributeFunctor(this.props, attr);
  }

  /**
   * Get the attr0 functor.
   * @param {string} attr Attribute name.
   * @returns {*} Functor.
   * @private
   */
  _getAttr0Functor(attr) {
    return getAttr0Functor(this.props, attr);
  }

  /**
   * Get the attribute value if it is available.
   * @param {string} attr Attribute name.
   * @returns {*} Attribute value if available, fallback value or undefined
   * otherwise.
   * @protected
   */
  _getAttributeValue(attr) {
    return getAttributeValue(this.props, attr);
  }

  /**
   * Get the scale object distance by the attribute from the list of properties.
   * @param {string} attr Attribute name.
   * @returns {number} Scale distance.
   * @protected
   */
  _getScaleDistance(attr) {
    const scaleObject = getScaleObjectFromProps(this.props, attr);
    return scaleObject ? scaleObject.distance : 0;
  }

  _getXYCoordinateInContainer(event) {
    const {marginTop = 0, marginLeft = 0} = this.props;
    const {nativeEvent: {clientX, clientY}, currentTarget} = event;
    const rect = currentTarget.getBoundingClientRect();
    return {
      x: clientX - rect.left - currentTarget.clientLeft - marginLeft,
      y: clientY - rect.top - currentTarget.clientTop - marginTop
    };
  }

  _handleNearestX(event) {
    const {onNearestX, data} = this.props;
    let minDistance = Number.POSITIVE_INFINITY;
    let value = null;
    let valueIndex = null;

    const coordinate = this._getXYCoordinateInContainer(event);
    const xScaleFn = this._getAttributeFunctor('x');

    data.forEach((item, i) => {
      const currentCoordinate = xScaleFn(item);
      const newDistance = Math.abs(coordinate.x - currentCoordinate);
      if (newDistance < minDistance) {
        minDistance = newDistance;
        value = item;
        valueIndex = i;
      }
    });
    if (!value) {
      return;
    }
    onNearestX(value, {
      innerX: xScaleFn(value),
      index: valueIndex,
      event: event.nativeEvent
    });
  }

  _handleNearestXY(event) {
    const {onNearestXY, data} = this.props;

    const coordinate = this._getXYCoordinateInContainer(event);
    const xScaleFn = this._getAttributeFunctor('x');
    const yScaleFn = this._getAttributeFunctor('y');

    // Create a voronoi with each node center points
    const voronoiInstance = voronoi()
      .x(xScaleFn)
      .y(yScaleFn);

    const foundPoint = voronoiInstance(data).find(coordinate.x, coordinate.y);
    const value = foundPoint.data;

    if (!value) {
      return;
    }
    onNearestXY(value, {
      innerX: foundPoint.x,
      innerY: foundPoint.y,
      index: foundPoint.index,
      event: event.nativeEvent
    });
  }

  onParentMouseMove(event) {
    const {onNearestX, onNearestXY, data} = this.props;
    if ((!onNearestX && !onNearestXY) || !data) {
      return;
    }
    if (onNearestXY) {
      this._handleNearestXY(event);
    } else {
      this._handleNearestX(event);
    }
  }
}

AbstractSeries.displayName = 'AbstractSeries';
AbstractSeries.propTypes = propTypes;
AbstractSeries.defaultProps = defaultProps;

export default AbstractSeries;
