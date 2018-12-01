import Annotations from '/imports/ui/components/whiteboard/service';

const getAnnotationById = _id => Annotations.findOne({
  _id,
});

const getAnnotationAll = _id => Annotations.findOne({
  _id,
});

export default {
  getAnnotationById,
};
