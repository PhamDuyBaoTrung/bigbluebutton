const colourToHex = (value) => {
  let hex;
  hex = parseInt(value, 10).toString(16);
  while (hex.length < 6) {
    hex = `0${hex}`;
  }

  return `#${hex}`;
};

const getFormattedColor = (color) => {
  let _color = color || '0';

  if (!_color.toString().match(/#.*/)) {
    _color = colourToHex(_color);
  }

  return _color;
};

const getStrokeWidth = (thickness, slideWidth) => (thickness * slideWidth) / 100;

const getCornerPoints = (startX, startY, width, height, slideWidth, slideHeight) => {
  const _startX = (startX / 100) * slideWidth;
  const _startY = (startY / 100) * slideHeight;
  const _width = (width / 100) * slideWidth;
  const _height = (height / 100) * slideHeight;

  return [
    { x: _startX + (_width / 2), y: _startY }, // top mid corner
    { x: _startX + _width, y: _startY + (_height / 2) }, // top right mid corner
    { x: _startX + (_width / 2), y: _startY + _height }, // bottom mid corner
    { x: _startX, y: _startY + (_height / 2) }, // bottom left corner,
  ];
};

export default {
  getFormattedColor,
  getStrokeWidth,
  getCornerPoints,
};
