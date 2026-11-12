const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i += 1) {
    let crc = i
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }
    table[i] = crc >>> 0
  }
  return table
})()

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i += 1) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function u16(value: number): Uint8Array {
  const out = new Uint8Array(2)
  out[0] = value & 0xff
  out[1] = (value >>> 8) & 0xff
  return out
}

function u32(value: number): Uint8Array {
  const out = new Uint8Array(4)
  out[0] = value & 0xff
  out[1] = (value >>> 8) & 0xff
  out[2] = (value >>> 16) & 0xff
  out[3] = (value >>> 24) & 0xff
  return out
}

function concat(chunks: Uint8Array[]): Uint8Array {
  let size = 0
  for (const chunk of chunks) {
    size += chunk.length
  }
  const out = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

export type ZipEntry = {
  name: string
  data: Uint8Array
}

export function buildZipStore(entries: ZipEntry[]): Blob {
  const encoder = new TextEncoder()
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let offset = 0
  const utf8Flag = 0x0800

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name)
    const crc = crc32(entry.data)
    const size = entry.data.length

    const local = concat([
      u32(0x04034b50),
      u16(20),
      u16(utf8Flag),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
      entry.data,
    ])
    localParts.push(local)

    const central = concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(utf8Flag),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes,
    ])
    centralParts.push(central)
    offset += local.length
  }

  const centralDir = concat(centralParts)
  const end = concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(centralDir.length),
    u32(offset),
    u16(0),
  ])

  return new Blob([concat([...localParts, centralDir, end])], {
    type: 'application/zip',
  })
}
