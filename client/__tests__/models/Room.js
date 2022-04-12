import Room from '@/models/Room'

const stringToMap = (s) => {
  s = s.replace(/^\n+/, '').replace(/\n+$/, '')
  const result = {}
  s.split('\n').forEach((line, y) =>
    line.split('').forEach((c, x) => {
      if (c !== ' ') {
        result[[x, y]] = c
      }
    }),
  )
  return result
}

const simple = stringToMap(`
X XXX
X XXX
X XXXX
X X
X
`)

const nature_7AEDF = stringToMap(`
       X
     XXX
    XXXX
   XXXXX
  XXXXXX
  XXXXXX
  XXX XX
  XX  XX
 XX   XX
      XX
       X
`)

test('stringToMap', () => {
  expect(Object.keys(simple).length).toBe(16)
  expect(Object.keys(nature_7AEDF).length).toBe(41)
})

const testMap = (map, x, y, w, h) => expect(map[[x, y]]).toEqual([x, y, w, h])

test('findHorizontalRects', () => {
  const result = Room.findHorizontalRects(simple)
  testMap(result, 0, 0, 1, 5)
  testMap(result, 2, 0, 3, 2)
  testMap(result, 2, 2, 4, 1)
  testMap(result, 2, 3, 1, 1)

  const result2 = Room.findHorizontalRects(nature_7AEDF)
  testMap(result2, 7, 0, 1, 1)
  testMap(result2, 5, 1, 3, 1)
  testMap(result2, 4, 2, 4, 1)
  testMap(result2, 3, 3, 5, 1)
  testMap(result2, 2, 4, 6, 2)
  testMap(result2, 2, 6, 3, 1)
  testMap(result2, 6, 6, 2, 4)
  testMap(result2, 2, 7, 2, 1)
  testMap(result2, 1, 8, 2, 1)
  testMap(result2, 7, 10, 1, 1)
})

test('findVerticalRects', () => {
  const result = Room.findVerticalRects(simple)

  testMap(result, 0, 0, 1, 5)
  testMap(result, 2, 0, 1, 4)
  testMap(result, 3, 0, 2, 3)
  testMap(result, 5, 2, 1, 1)

  const result2 = Room.findVerticalRects(nature_7AEDF)
  testMap(result2, 1, 8, 1, 1)
  testMap(result2, 2, 4, 1, 5)
  testMap(result2, 3, 3, 1, 5)
  testMap(result2, 4, 2, 1, 5)
  testMap(result2, 5, 1, 1, 5)
  testMap(result2, 6, 1, 1, 9)
  testMap(result2, 7, 0, 1, 11)
})
