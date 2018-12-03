import Annotations from '/imports/ui/components/whiteboard/service';

const getCurrentAnnotationsInfo = (whiteboardId) => {
  if (!whiteboardId) {
    return null;
  }

  return Annotations.find(
    {
      whiteboardId,
      // annotationType: { $ne: 'pencil_base' },
    },
    {
      sort: { position: 1 },

    },
  ).fetch();
};

export default {
  getCurrentAnnotationsInfo,
};
