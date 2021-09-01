<template>
  <svg>
    <line
      v-for="([xy1, xy2], i) in edges"
      :key="i"
      :x1="xy1[0] * 10"
      :x2="xy2[0] * 10"
      :y1="xy1[1] * 10"
      :y2="xy2[1] * 10"
      stroke-width="2"
      stroke="green"
    />
    <g transform="scale(10)">
      <path v-for="(p, i) in dotpaths" :d="p" :key="i" />
    </g>
  </svg>
</template>

<script>
import vec from '@/lib/vec'
const s2 = `0000000000
0111011100
0101010100
0111011000
0000000000
0011111100
0010101000
0011111000
0000000000
0000000000`

const s = `000
01110
01010
0111`

class Tracer {
  constructor(input) {
    if (typeof input === 'string') {
      input = input.split('\n').map((row) => row.split('').map((i) => Number(i)))
    }
    this.input = input
    this.makeEdges()
    this.makeDotPaths()
  }
  makeEdges() {
    const edges = []
    this.dots = []
    this.input.forEach((row, y) => {
      row.forEach((i, x) => {
        if (i === 1) {
          edges.push([
            [x, y],
            [x + 1, y],
          ])
          edges.push([
            [x, y],
            [x, y + 1],
          ])
          edges.push([
            [x, y + 1],
            [x + 1, y + 1],
          ])
          edges.push([
            [x + 1, y],
            [x + 1, y + 1],
          ])
          this.dots.push([x, y])
          this.dots.push([x, y + 1])
          this.dots.push([x + 1, y])
          this.dots.push([x + 1, y + 1])
        }
      })
    })
    const counts = {}
    edges.forEach((e) => (counts[e] = (counts[e] || 0) + 1))
    this.edges = edges.filter((e) => counts[e] === 1)
    const allowed = (this.allowed_edges = {})
    this.edges.forEach(([xy1, xy2]) => {
      allowed[xy1] = allowed[xy1] || {}
      allowed[xy1][xy2] = true
      allowed[xy2] = allowed[xy2] || {}
      allowed[xy2][xy1] = true
    })
  }
  makeDotPaths() {
    const dots = this.dots.slice()
    const tried = {}
    const exists = {}
    dots.forEach((d) => (exists[d] = true))
    const directions = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]
    const path = []
    let i = 1000
    const checkNeighbors = (xy) => {
      for (let i_dir = 0; i_dir < 4; i_dir++) {
        const dxy = directions[i_dir]
        const target = vec.add(xy, dxy)
        if (exists[target] && !tried[target] && this.allowed_edges[xy][target]) {
          return target
        }
      }
    }
    let xy
    while (dots.length && i--) {
      xy = dots.pop()
      if (tried[xy]) {
        continue
      }
      path.push((path.length ? 'z\n' : '') + `M ${xy[0]} ${xy[1]}`)
      tried[xy] = true
      let next = checkNeighbors(xy)
      while (dots.length && next && i--) {
        xy = next
        path.push(`L ${xy[0]} ${xy[1]}`)
        tried[xy] = true
        next = checkNeighbors(xy)
      }
      directions.reverse()
    }
    this.dot_paths = [path.join(' ')]
  }
}

export default {
  __route: {
    path: '/tracer/:room_id',
  },
  computed: {
    edges() {
      let edges = []
      s.split('\n').forEach((line, y) => {
        line.split('').forEach((i, x) => {
          if (i === '1') {
            edges.push([
              [x, y],
              [x + 1, y],
            ])
            edges.push([
              [x, y],
              [x, y + 1],
            ])
            edges.push([
              [x, y + 1],
              [x + 1, y + 1],
            ])
            edges.push([
              [x + 1, y],
              [x + 1, y + 1],
            ])
          }
        })
      })
      const counts = {}
      edges.forEach((e) => {
        counts[e] = (counts[e] || 0) + 1
      })
      edges = edges.filter((e) => counts[e] === 1)
      return edges
    },
    dots() {
      let dots = []
      s.split('\n').forEach((line, y) => {
        line.split('').forEach((i, x) => {
          if (i === '1') {
            dots.push([x, y])
            dots.push([x, y + 1])
            dots.push([x + 1, y])
            dots.push([x + 1, y + 1])
          }
        })
      })
      const exists = {}
      dots = dots.filter((d) => {
        if (!exists[d]) {
          exists[d] = true
          return true
        }
      })
      return dots
    },
    allowedEdges() {
      const allowed = {}
      this.edges.forEach(([xy1, xy2]) => {
        allowed[xy1] = allowed[xy1] || {}
        allowed[xy1][xy2] = true
        allowed[xy2] = allowed[xy2] || {}
        allowed[xy2][xy1] = true
      })
      return allowed
    },
    dotpaths() {
      return new Tracer(s2).dot_paths
    },
  },
}
</script>
