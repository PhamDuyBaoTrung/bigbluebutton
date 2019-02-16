import Users from '/imports/api/users';
import Auth from '/imports/ui/services/auth';
import WhiteboardMultiUser from '/imports/api/whiteboard-multi-user/';
import { AnnotationsStreamer } from '/imports/api/annotations';
import addAnnotationQuery from '/imports/api/annotations/addAnnotation';
import logger from '/imports/startup/client/logger';
import { isEqual } from 'lodash';

const Annotations = new Mongo.Collection(null);
const ANNOTATION_CONFIG = Meteor.settings.public.whiteboard.annotations;
const DRAW_START = ANNOTATION_CONFIG.status.start;
const DRAW_END = ANNOTATION_CONFIG.status.end;
const discardedList = [];

export function addAnnotationToDiscardedList(annotation) {
  if (!discardedList.includes(annotation)) discardedList.push(annotation);
}

function clearFakeAnnotations() {
  Annotations.remove({ id: /-fake/g });
}

function handleAddedAnnotation({
  meetingId, whiteboardId, userId, annotation,
}) {
  const isOwn = Auth.meetingID === meetingId && Auth.userID === userId;

  let query;
  if (annotation.annotationType === 'pencil') {
    const currAnnotation = Annotations.findOne({ id: annotation.id });
    const isModifyAnnotation = currAnnotation
      && currAnnotation.annotationInfo.points.length === annotation.annotationInfo.points.length;
    query = addAnnotationQuery(meetingId, whiteboardId, userId, annotation, isModifyAnnotation);
  } else {
    query = addAnnotationQuery(meetingId, whiteboardId, userId, annotation);
  }

  if (!isOwn) {
    Annotations.upsert(query.selector, query.modifier);
    return;
  }

  const fakeAnnotation = Annotations.findOne({ id: `${annotation.id}-fake` });
  if (!fakeAnnotation) {
    return;
  }
  const fakePoints = fakeAnnotation.annotationInfo.points;
  const { points: lastPoints } = annotation.annotationInfo;

  if (annotation.annotationType !== 'pencil') {
    Annotations.update(fakeAnnotation._id, {
      $set: {
        position: annotation.position,
        'annotationInfo.color': isEqual(fakePoints, lastPoints) || annotation.status === DRAW_END ?
          annotation.annotationInfo.color : fakeAnnotation.annotationInfo.color,
      },
      $inc: { version: 1 }, // TODO: Remove all this version stuff
    });
    return;
  }

  Annotations.upsert(query.selector, query.modifier, (err) => {
    if (err) {
      logger.error(err);
      return;
    }

    // Remove fake annotation for pencil on draw end
    if (annotation.status === DRAW_END) {
      Annotations.remove({ id: `${annotation.id}-fake` });
      return;
    }

    if (annotation.status === DRAW_START) {
      Annotations.update(fakeAnnotation._id, {
        $set: {
          position: annotation.position - 1,
        },
        $inc: { version: 1 }, // TODO: Remove all this version stuff
      });
    }
  });
}

function handleRemovedAnnotation({
  meetingId, whiteboardId, userId, shapeId,
}) {
  const query = { meetingId, whiteboardId };

  addAnnotationToDiscardedList(shapeId);

  if (userId) {
    query.userId = userId;
  }

  if (shapeId) {
    query.id = { $in: [shapeId, `${shapeId}-fake`] };
  }

  Annotations.remove(query);
}

AnnotationsStreamer.on('removed', handleRemovedAnnotation);

AnnotationsStreamer.on('added', ({ annotations }) => {
  // Call handleAddedAnnotation when this annotation is not in discardedList
  annotations
    .filter(({ annotation }) => !discardedList.includes(annotation.id))
    .forEach(annotation => handleAddedAnnotation(annotation));
});

function increaseBrightness(realHex, percent) {
  let hex = parseInt(realHex, 10).toString(16).padStart(6, 0);
  // strip the leading # if it's there
  hex = hex.replace(/^\s*#|\s*$/g, '');

  // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
  if (hex.length === 3) {
    hex = hex.replace(/(.)/g, '$1$1');
  }

  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  /* eslint-disable no-bitwise, no-mixed-operators */
  return parseInt(((0 | (1 << 8) + r + ((256 - r) * percent) / 100).toString(16)).substr(1) +
     ((0 | (1 << 8) + g + ((256 - g) * percent) / 100).toString(16)).substr(1) +
     ((0 | (1 << 8) + b + ((256 - b) * percent) / 100).toString(16)).substr(1), 16);
  /* eslint-enable no-bitwise, no-mixed-operators */
}

let annotationsQueue = [];
// How many packets we need to have to use annotationsBufferTimeMax
const annotationsMaxDelayQueueSize = 60;
// Minimum bufferTime
const annotationsBufferTimeMin = 30;
// Maximum bufferTime
const annotationsBufferTimeMax = 200;
let annotationsSenderIsRunning = false;

const proccessAnnotationsQueue = () => {
  annotationsSenderIsRunning = true;
  const queueSize = annotationsQueue.length;

  if (!queueSize) {
    annotationsSenderIsRunning = false;
    return;
  }

  // console.log('annotationQueue.length', annotationsQueue, annotationsQueue.length);
  AnnotationsStreamer.emit('publish', {
    credentials: Auth.credentials,
    payload: annotationsQueue.filter(({ id }) => !discardedList.includes(id)),
  });
  annotationsQueue = [];
  // ask tiago
  const delayPerc =
    Math.min(annotationsMaxDelayQueueSize, queueSize) / annotationsMaxDelayQueueSize;
  const delayDelta = annotationsBufferTimeMax - annotationsBufferTimeMin;
  const delayTime = annotationsBufferTimeMin + (delayDelta * delayPerc);
  setTimeout(proccessAnnotationsQueue, delayTime);
};

export function sendAnnotation(annotation, onlySyncToRedis = false) {
  // Prevent sending annotations while disconnected
  if (!Meteor.status().connected) return;

  annotationsQueue.push(annotation);
  if (!annotationsSenderIsRunning) setTimeout(proccessAnnotationsQueue, annotationsBufferTimeMin);

  // skip optimistic for draw end since the smoothing is done in akka
  if (annotation.status === DRAW_END || onlySyncToRedis) return;

  const { position, ...relevantAnotation } = annotation;
  const queryFake = addAnnotationQuery(
    Auth.meetingID, annotation.wbId, Auth.userID,
    {
      ...relevantAnotation,
      id: `${annotation.id}-fake`,
      position: Number.MAX_SAFE_INTEGER,
      annotationInfo: {
        ...annotation.annotationInfo,
        color: increaseBrightness(annotation.annotationInfo.color, 40),
      },
    },
  );

  Annotations.upsert(queryFake.selector, queryFake.modifier);
}

export function updateAnnotation(annotation) {
  // Prevent sending annotations while disconnected
  if (!Meteor.status().connected) return;
  // skip optimistic for draw end since the smoothing is done in akka
  if (annotation.status === DRAW_END) return;

  const { position, ...relevantAnotation } = annotation;
  const updateQuery = addAnnotationQuery(
    Auth.meetingID, annotation.wbId, Auth.userID,
    {
      ...relevantAnotation,
      id: annotation.id,
      position,
      annotationInfo: {
        ...annotation.annotationInfo,
        color: annotation.annotationInfo.color,
      },
    },
    true,
  );

  const cb = (err, numChanged) => {
    if (err) {
      return console.error(`Error happend when upsert ${annotation.id}`);
    }

    const { insertedId } = numChanged;
    if (insertedId) {
      return console.info(`[ADDED] annotation id=${annotation.id}`);
    }
    return console.info(`[UPDATED] annotation id=${annotation.id}`);
  };

  Annotations.upsert(updateQuery.selector, updateQuery.modifier, cb);
}

WhiteboardMultiUser.find({ meetingId: Auth.meetingID }).observeChanges({
  changed: clearFakeAnnotations,
});

Users.find({ userId: Auth.userID }).observeChanges({
  changed(id, { presenter }) {
    if (presenter === false) clearFakeAnnotations();
  },
});

export default Annotations;
