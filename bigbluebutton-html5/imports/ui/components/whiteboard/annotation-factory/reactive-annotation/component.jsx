import React from 'react';
import PropTypes from 'prop-types';
import AnnotationHelper from '../../annotations/helpers';
import BoundaryDrawComponent from "../../annotations/boundary/component";

const ReactiveAnnotation = (props) => {
  const Component = props.drawObject;
  const { annotation, activeShapeId, slideWidth, slideHeight } = props;
  const cornerPoints = AnnotationHelper.getCornerPoints(annotation.annotationInfo.x, annotation.annotationInfo.y,
    annotation.annotationInfo.textBoxWidth, annotation.annotationInfo.textBoxHeight, slideWidth, slideHeight);


  return (
    <g>
      <Component
        version={props.annotation.version}
        annotation={props.annotation.annotationInfo}
        slideWidth={props.slideWidth}
        slideHeight={props.slideHeight}
      />
      {
        activeShapeId === annotation.id ?
          <BoundaryDrawComponent
            version={props.annotation.version}
            annotation={annotation}
            slideWidth={slideWidth}
            slideHeight={slideHeight}
          /> : null
      }
    </g>
  );
};

ReactiveAnnotation.propTypes = {
  annotation: PropTypes.objectOf(PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object,
  ])).isRequired,
  activeShapeId: PropTypes.string,
  drawObject: PropTypes.func.isRequired,
  slideWidth: PropTypes.number.isRequired,
  slideHeight: PropTypes.number.isRequired,
};

export default ReactiveAnnotation;
