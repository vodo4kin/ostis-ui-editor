export type PointOrigin = { id: string; x: number; y: number }

export type RectOrigin = {
  id: string
  x: number
  y: number
  width: number
  height: number
}

export function clampGroupMoveDelta(
  origins: { x: number; y: number }[],
  dx: number,
  dy: number,
): { dx: number; dy: number } {
  if (origins.length === 0) {
    return { dx: 0, dy: 0 }
  }
  let minX = origins[0].x
  let minY = origins[0].y
  for (let i = 1; i < origins.length; i += 1) {
    minX = Math.min(minX, origins[i].x)
    minY = Math.min(minY, origins[i].y)
  }
  return {
    dx: Math.max(-minX, dx),
    dy: Math.max(-minY, dy),
  }
}

export function boundsOfRects(
  rects: { x: number; y: number; width: number; height: number }[],
): { x: number; y: number; width: number; height: number } | null {
  if (rects.length === 0) {
    return null
  }
  let left = rects[0].x
  let top = rects[0].y
  let right = rects[0].x + rects[0].width
  let bottom = rects[0].y + rects[0].height
  for (let i = 1; i < rects.length; i += 1) {
    const r = rects[i]
    left = Math.min(left, r.x)
    top = Math.min(top, r.y)
    right = Math.max(right, r.x + r.width)
    bottom = Math.max(bottom, r.y + r.height)
  }
  return {
    x: left,
    y: top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  }
}

export function transformGroupResize(
  origins: RectOrigin[],
  box: { x: number; y: number; width: number; height: number },
  next: { x: number; y: number; width: number; height: number },
  minSize: number,
): RectOrigin[] {
  const sx = next.width / box.width
  const sy = next.height / box.height
  return origins.map((item) => {
    const x = next.x + (item.x - box.x) * sx
    const y = next.y + (item.y - box.y) * sy
    const width = Math.max(minSize, item.width * sx)
    const height = Math.max(minSize, item.height * sy)
    return {
      id: item.id,
      x: Math.max(0, Math.round(x)),
      y: Math.max(0, Math.round(y)),
      width: Math.round(width),
      height: Math.round(height),
    }
  })
}

export function clampGroupBox(
  box: { x: number; y: number; width: number; height: number },
  minSize: number,
): { x: number; y: number; width: number; height: number } {
  let { x, y, width, height } = box
  width = Math.max(minSize, width)
  height = Math.max(minSize, height)
  if (x < 0) {
    width = Math.max(minSize, width + x)
    x = 0
  }
  if (y < 0) {
    height = Math.max(minSize, height + y)
    y = 0
  }
  return { x, y, width, height }
}
