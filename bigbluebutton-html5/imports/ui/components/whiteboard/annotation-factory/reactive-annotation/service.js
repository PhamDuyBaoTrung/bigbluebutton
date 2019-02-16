import Annotations from '/imports/ui/components/whiteboard/service';
const DRAW_SETTINGS = 'drawSettings';
const getAnnotationById = _id => Annotations.findOne({
  _id,
});

const getActivatedShapeId = () => {
  const drawSettings = Storage.getItem(DRAW_SETTINGS);
  return drawSettings ? drawSettings.activatedShapeId : '';
};

export default {
  getAnnotationById,
  getActivatedShapeId,
};
