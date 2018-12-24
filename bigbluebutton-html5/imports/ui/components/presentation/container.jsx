import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { getSwapLayout } from '/imports/ui/components/media/service';
import PresentationAreaService from './service';
import PresentationArea from './component';

const PresentationAreaContainer = props => (
  <PresentationArea {...props} />
);

export default withTracker(() => {
  const currentSlide = PresentationAreaService.getCurrentSlide();
  return {
    currentSlide,
    userIsPresenter: PresentationAreaService.isPresenter() && !getSwapLayout(),
    multiUser: PresentationAreaService.getMultiUserStatus() && !getSwapLayout(),
  };
})(PresentationAreaContainer);
