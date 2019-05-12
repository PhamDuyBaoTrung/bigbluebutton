import React, { Component } from 'react';
import PropTypes from 'prop-types';
import RenderInBrowser from 'react-render-in-browser';
import AnnotationHelpers from '../helpers';

const DRAW_END = Meteor.settings.public.whiteboard.annotations.status.end;

export default class TextDrawComponent extends Component {
  static getViewerStyles(results) {
    const styles = {
      WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
      pointerEvents: 'none',
      fontStyle: 'normal',
      fontVariant: 'normal',
      fontWeight: 'normal',
      fontStretch: 'normal',
      lineHeight: 'normal',
      fontFamily: 'Arial',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      wordBreak: 'normal',
      textAlign: 'left',
      margin: 0,

      // padding to match the border of the text area and the flash client's default 1px padding
      padding: 1,
      color: results.fontColor,
      fontSize: results.calcedFontSize,
    };
    return styles;
  }

  static getPresenterStyles(results) {
    const styles = {
      fontFamily: 'Arial',
      border: '1px dashed black',
      width: '100%',
      height: '100%',
      resize: 'none',
      overflow: 'hidden',
      outline: 'none',
      color: results.fontColor,
      fontSize: results.calcedFontSize,
      padding: '0',
    };

    return styles;
  }

  static checkPointInsidePencil(annotation, x, y, slideWidth, slideHeight) {
    const textCoordinates = TextDrawComponent.getCoordinates(annotation, slideWidth, slideHeight);
    return x >= textCoordinates.x && x <= (textCoordinates.x + textCoordinates.width)
      && y >= textCoordinates.y && y <= (textCoordinates.y + textCoordinates.height);
  }

  static getTopLeftCornerCoordinates(annotation) {
    const { x, y, textBoxWidth, textBoxHeight } = annotation;
    return {
      startX: x,
      startY: y,
      width: textBoxWidth,
      height: textBoxHeight,
    }
  }

  static transformPointsByAction(annotation, action, px, py, ax, ay, width, height, initialX, initialY, slideWidth, slideHeight) {
    const ANNOTATION_CONFIG = Meteor.settings.public.whiteboard.annotations;
    const HORIZONTAL_LEFT = ANNOTATION_CONFIG.resize.horizontal_left;
    const HORIZONTAL_RIGHT = ANNOTATION_CONFIG.resize.horizontal_right;
    const VERTICAL_TOP = ANNOTATION_CONFIG.resize.vertical_top;
    const VERTICAL_BOTTOM = ANNOTATION_CONFIG.resize.vertical_bottom;
    const DRAG = ANNOTATION_CONFIG.drag;

    let newStartX = ax;
    let newStartY = ay;
    let newWidth = width;
    let newHeight = height;
    switch (action) {
      case HORIZONTAL_LEFT:
        newStartX = px;
        newStartY = ay;
        newWidth = width - (px - ax);
        newHeight = height;
        break;
      case HORIZONTAL_RIGHT:
        newStartX = ax;
        newStartY = ay;
        const midRight = {
          x: ax + width,
          y: ay + (height / 2),
        };
        newWidth = width + (px - midRight.x);
        newHeight = height;
        break;
      case VERTICAL_TOP:
        newStartX = ax;
        newStartY = py;
        newWidth = width;
        newHeight = height - (py - ay);
        break;
      case VERTICAL_BOTTOM:
        newStartX = ax;
        newStartY = ay;
        const midBottom = {
          x: ax + (width / 2),
          y: ay + height,
        };
        newWidth = width;
        newHeight = height + (py - midBottom.y);
        break;
      case DRAG:
        newStartX = px + ax - initialX;
        newStartY = py + ay - initialY;
        newWidth = width;
        newHeight = height;
    }

    // update active annotation
    const newTransX = (newStartX / slideWidth) * 100;
    const newTransY = (newStartY / slideHeight) * 100;
    const newTransWidth = (newWidth / slideWidth) * 100;
    const newTransHeight = (newHeight / slideHeight) * 100;
    annotation.x = newTransX;
    annotation.y = newTransY;
    annotation.textBoxWidth = newTransWidth;
    annotation.textBoxHeight = newTransHeight;
    return annotation;
  }

  static getCoordinates(annotation, slideWidth, slideHeight) {
    const {
      x,
      y,
      textBoxWidth,
      textBoxHeight,
      fontColor,
      fontSize,
      calcedFontSize,
      text,
    } = annotation;

    const _x = (x / 100) * slideWidth;
    const _y = (y / 100) * slideHeight;
    const _width = (textBoxWidth / 100) * slideWidth;
    const _height = (textBoxHeight / 100) * slideHeight;
    const _fontColor = AnnotationHelpers.getFormattedColor(fontColor);
    const _fontSize = fontSize;
    const _calcedFontSize = (calcedFontSize / 100) * slideHeight;
    const _text = text;

    return {
      x: _x,
      y: _y,
      text: _text,
      width: _width,
      height: _height,
      fontSize: _fontSize,
      fontColor: _fontColor,
      calcedFontSize: _calcedFontSize,
    };
  }

  constructor() {
    super();

    this.handleFocus = this.handleFocus.bind(this);
    this.handleOnBlur = this.handleOnBlur.bind(this);
    this.onChangeHandler = this.onChangeHandler.bind(this);

    this.shouldEnableTextArea = false;

    this.state = {
      textHeight: null
    };
  }

  componentDidMount() {
    // iOS doesn't show the keyboard if the input field was focused by event NOT invoked by a user
    // by it still technically moves the focus there
    // that's why we have a separate case for iOS - we don't focus here automatically
    // but we focus on the next "tap" invoked by a user
    const iOS = ['iPad', 'iPhone', 'iPod'].indexOf(navigator.platform) >= 0;
    const Android = navigator.userAgent.toLowerCase().indexOf('android') > -1;

    // unsupported Firefox condition (not iOS though) can be removed when FF 59 is released
    // see https://bugzilla.mozilla.org/show_bug.cgi?id=1409113
    const unsupportedFirefox = navigator.userAgent.indexOf('Firefox/57') !== -1
                            || navigator.userAgent.indexOf('Firefox/58') !== -1;

    if (iOS || (Android && unsupportedFirefox)) { return; }
    if (this.props.isActive && this.props.isEditable && this.props.annotation.status !== DRAW_END) {
      console.log('Set focus textarea');
      this.handleFocus();
    }
  }

  shouldComponentUpdate(nextProps) {
    return this.props.version !== nextProps.version ||
      this.props.isActive !== nextProps.isActive;
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.isActive && nextProps.annotation.status !== DRAW_END) {
      this.shouldEnableTextArea = true;
    } else {
      this.shouldEnableTextArea = false;
    }
  }

  componentDidUpdate() {
    if (this.shouldEnableTextArea) {
      this.handleFocus();
      this.shouldEnableTextArea = false;
    }
  }

  // If the user is drawing a text shape and clicks Undo - reset textShapeId
  componentWillUnmount() {
    if (this.props.isActive) {
      this.props.resetTextShapeActiveId();
    }
  }

  onChangeHandler(event) {
    const { annotation } = this.props;
    this.props.setTextShapeValue(event.target.value);
    const textArea = document.querySelector(`#${annotation.annotationInfo.id}`);
    if (textArea) {
      this.textRef.style.height = textArea.scrollHeight + 'px';
    }
  }

  handleOnBlur() {
    // it'd be better to use ref to focus onBlur (handleFocus), but it doesn't want to work in FF
    // so we are back to the old way of doing things, getElementById and setTimeout
    const node = document.getElementById(this.props.annotation.id);
    setTimeout(() => { node.focus(); }, 1);
  }

  handleFocus() {
    // Explicitly focus the text input using the raw DOM API
    this.textArea.focus();
  }

  renderViewerTextShape(results) {
    const styles = TextDrawComponent.getViewerStyles(results);

    return (
      <g>
        <RenderInBrowser only firefox>
          <clipPath id={this.props.annotation.id}>
            <rect
              x={results.x}
              y={results.y}
              width={results.width}
              height={results.height}
            />
          </clipPath>
        </RenderInBrowser>
        <foreignObject
          clipPath={`url(#${this.props.annotation.id})`}
          x={results.x}
          y={results.y}
          width={results.width}
          height={results.height}
        >
          <p style={styles}>
            {results.text}
          </p>
        </foreignObject>
      </g>
    );
  }

  renderPresenterTextShape(results) {
    const styles = TextDrawComponent.getPresenterStyles(results);

    return (
      <g>
        <foreignObject
          ref={(ref) => { this.textRef = ref; }}
          x={results.x}
          y={results.y}
          width={results.width}
          height={results.height}
          style={{ pointerEvents: 'none' }}
        >
          <textarea
            id={this.props.annotation.id}
            maxLength="1024"
            placeholder="Typing..."
            ref={(ref) => { this.textArea = ref; }}
            onChange={this.onChangeHandler}
            onBlur={this.handleOnBlur}
            style={styles}
            defaultValue={results.text}
            spellCheck="false"
          >
          </textarea>
        </foreignObject>
      </g>
    );
  }

  render() {
    const { annotation, slideWidth, slideHeight, isActive, isEditable } = this.props;
    const results = TextDrawComponent.getCoordinates(annotation, slideWidth, slideHeight);

    if (isActive && isEditable && this.props.annotation.status !== DRAW_END) {
      return this.renderPresenterTextShape(results);
    }
    return this.renderViewerTextShape(results);
  }
}

TextDrawComponent.propTypes = {
  // Defines a version of the shape, so that we know if we need to update the component or not
  version: PropTypes.number.isRequired,
  // Defines an annotation object, which contains all the basic info we need to draw text shape
  annotation: PropTypes.shape({
    calcedFontSize: PropTypes.number.isRequired,
    fontColor: PropTypes.number.isRequired,
    fontSize: PropTypes.number.isRequired,
    id: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    textBoxWidth: PropTypes.number.isRequired,
    textBoxHeight: PropTypes.number.isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  // Defines the width of the slide (svg coordinate system), which needed in calculations
  slideWidth: PropTypes.number.isRequired,
  // Defines the height of the slide (svg coordinate system), which needed in calculations
  slideHeight: PropTypes.number.isRequired,
  // Defines a flag which indicates that this shape is currently used by a presenter to draw text
  isActive: PropTypes.bool.isRequired,
  isEditable: PropTypes.bool.isRequired,
  // Defines a function that sends updates from the active text shape  to the server
  setTextShapeValue: PropTypes.func.isRequired,
  // Defines a function that resets the textShape active Id in case if a user clicks Undo
  // while drawing a shape
  resetTextShapeActiveId: PropTypes.func.isRequired,
};
