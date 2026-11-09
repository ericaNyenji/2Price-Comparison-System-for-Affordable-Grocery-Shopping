const { timingSafeEqual } = require("crypto");

function bufferEqual(a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) return false;
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

bufferEqual.install = () => {};
bufferEqual.restore = () => {};

module.exports = bufferEqual;
