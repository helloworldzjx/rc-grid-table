export const raf = (callback: FrameRequestCallback) => {
  if (typeof requestAnimationFrame === 'function') {
    return requestAnimationFrame(callback);
  }

  return setTimeout(() => callback(Date.now()), 16) as unknown as number;
};

export const cancelRaf = (id: number | null) => {
  if (id === null) return;

  if (typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
};
