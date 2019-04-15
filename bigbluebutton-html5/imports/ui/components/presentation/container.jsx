import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { getSwapLayout } from '/imports/ui/components/media/service';
import PresentationAreaService from './service';
import PresentationArea from './component';

const PresentationAreaContainer = props => (
  <PresentationArea {...props} />
);

export default withTracker(() => {
  let currentPresentation, currentSlide;
  const currentWhiteBoard = PresentationAreaService.getCurrentSlide();
  if (currentWhiteBoard) {
    currentPresentation = currentWhiteBoard.currentPresentation;
      currentSlide = currentWhiteBoard.currentSlide;
  }
  return {
    currentSlide,
    currentPresentation,
    userIsPresenter: PresentationAreaService.isPresenter() && !getSwapLayout(),
    multiUser: PresentationAreaService.getMultiUserStatus() && !getSwapLayout(),
  };
})(PresentationAreaContainer);
