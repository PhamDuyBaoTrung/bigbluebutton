import React from 'react';
import PropTypes from 'prop-types';
import { withTracker } from 'meteor/react-meteor-data';
import PresentationOverlayService from './service';
import PresentationUploaderService from '../presentation-uploader/service';
import WhiteboardOverlayService from '../../whiteboard/whiteboard-overlay/service';
import PresentationOverlay from './component';

const PresentationOverlayContainer = ({ children, ...rest }) => (
  <PresentationOverlay {...rest}>
    {children}
  </PresentationOverlay>
);

export default withTracker(() => ({
  updateCursor: PresentationOverlayService.updateCursor,
  uploadImage: PresentationUploaderService.uploadImage,
  userId: WhiteboardOverlayService.getCurrentUserId(),
  sendAnnotation: WhiteboardOverlayService.sendAnnotation,
}))(PresentationOverlayContainer);

PresentationOverlayContainer.propTypes = {
  children: PropTypes.node,
};

PresentationOverlayContainer.defaultProps = {
  children: undefined,
};
