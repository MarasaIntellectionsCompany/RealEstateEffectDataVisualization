<script setup>
import { computed, ref, onMounted, watch } from 'vue'

const rows = ref([])
const loading = ref(true)
const error = ref(null)

const selectedYear = ref('all')
const selectedQuarter = ref('all')
const minPrice = ref(0)

const chartWidth = 800
const chartHeight = 200
const chartPadding = 36

const hoveredPoint = ref(null)

const sortKey = ref('price')
const sortDir = ref('desc')

const formatCurrency = (n) =>
  n.toLocaleString('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  })

const formatMillions = (n) => (n / 1_000_000).toFixed(1) + ' M'

onMounted(async () => {
  try {
    const res = await fetch('/data/top_transactions_montreal_from_db.geojson')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const geojson = await res.json()
    rows.value =
      (geojson?.features || []).map((f, idx) => {
        const p = f.properties || {}
        const coords = f.geometry?.coordinates || []
        return {
          id: idx,
          address: p.address || '',
          price: Number(p.price) || 0,
          date: p.date || '',
          quarter: p.quarter || '',
          units: p.units ?? null,
          lng: coords[0],
          lat: coords[1],
        }
      }) ?? []
  } catch (e) {
    error.value = e?.message || 'Failed to load transactions'
  } finally {
    loading.value = false
  }
})

const allRows = computed(() => rows.value || [])

const years = computed(() => {
  const set = new Set()
  allRows.value.forEach((r) => {
    if (r.date && r.date.length >= 4) {
      set.add(r.date.slice(0, 4))
    }
  })
  return Array.from(set).sort()
})

/* quarters available given current year selection */
const quartersForFilter = computed(() => {
  const set = new Set()
  allRows.value.forEach((r) => {
    const year = r.date && r.date.length >= 4 ? r.date.slice(0, 4) : ''
    if (selectedYear.value !== 'all' && year !== selectedYear.value) return
    if (r.quarter) set.add(r.quarter)
  })
  return Array.from(set).sort()
})

/* ensure quarter stays valid when year changes */
watch(selectedYear, () => {
  if (
    selectedQuarter.value !== 'all' &&
    !quartersForFilter.value.includes(selectedQuarter.value)
  ) {
    selectedQuarter.value = 'all'
  }
})

const filteredRows = computed(() => {
  return allRows.value.filter((r) => {
    const year = r.date && r.date.length >= 4 ? r.date.slice(0, 4) : ''
    if (selectedYear.value !== 'all' && year !== selectedYear.value) return false
    if (selectedQuarter.value !== 'all' && r.quarter !== selectedQuarter.value) return false
    if (minPrice.value && r.price < minPrice.value * 1_000_000) return false
    return true
  })
})

const totalVolume = computed(() =>
  filteredRows.value.reduce((sum, r) => sum + r.price, 0),
)

const averagePrice = computed(() => {
  if (!filteredRows.value.length) return 0
  return totalVolume.value / filteredRows.value.length
})

const maxPrice = computed(() =>
  filteredRows.value.reduce((m, r) => (r.price > m ? r.price : m), 0),
)

/* sort handling for the table */
const setSort = (key) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    // default directions
    if (key === 'price' || key === 'units') {
      sortDir.value = 'desc'
    } else {
      sortDir.value = 'asc'
    }
  }
}

const sortedRows = computed(() => {
  const data = [...filteredRows.value]
  const key = sortKey.value
  const dir = sortDir.value

  data.sort((a, b) => {
    const va = a[key]
    const vb = b[key]

    if (va == null && vb == null) return 0
    if (va == null) return dir === 'asc' ? -1 : 1
    if (vb == null) return dir === 'asc' ? 1 : -1

    if (typeof va === 'number' && typeof vb === 'number') {
      return dir === 'asc' ? va - vb : vb - va
    }

    const sa = String(va).toLowerCase()
    const sb = String(vb).toLowerCase()
    return dir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa)
  })

  return data
})

const sortIndicator = (key) => {
  if (sortKey.value !== key) return ''
  return sortDir.value === 'asc' ? '▲' : '▼'
}

/* top transaction per quarter for the line chart, based on filteredRows */
const topDealsByQuarter = computed(() => {
  const map = new Map()
  filteredRows.value.forEach((r) => {
    const q = r.quarter || 'Unknown'
    const current = map.get(q)
    if (!current || r.price > current.price) {
      map.set(q, r)
    }
  })
  return Array.from(map.entries())
    .sort(([qa], [qb]) => String(qa).localeCompare(String(qb)))
    .map(([quarter, deal]) => ({
      quarter,
      address: deal.address,
      price: deal.price,
    }))
})

const chartPoints = computed(() => {
  if (!topDealsByQuarter.value.length) return { points: [], polyline: '' }

  const maxPriceLocal = Math.max(...topDealsByQuarter.value.map((d) => d.price))
  const innerWidth = chartWidth - chartPadding * 2
  const innerHeight = chartHeight - chartPadding * 2

  const step =
    topDealsByQuarter.value.length === 1
      ? 0
      : innerWidth / (topDealsByQuarter.value.length - 1)

  const points = topDealsByQuarter.value.map((d, index) => {
    const x = chartPadding + index * step
    const ratio = maxPriceLocal ? d.price / maxPriceLocal : 0
    const y = chartPadding + (innerHeight - innerHeight * ratio)
    return {
      key: d.quarter,
      x,
      y,
      label: d.quarter,
      address: d.address,
      price: d.price,
    }
  })

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')

  return { points, polyline, maxPriceLocal }
})
</script>

<template>
  <section class="page">
    <header class="page-header">
      <p class="eyebrow">Top Transactions</p>
      <h2 class="page-title">Greater Montreal income property sales</h2>
      <p class="subtitle">
        Filter by year, quarter, and minimum price. The chart shows the highest transaction per quarter.
      </p>
    </header>

    <div class="filter-row">
      <div class="filter-group">
        <label>
          Year
          <select v-model="selectedYear">
            <option value="all">All</option>
            <option v-for="y in years" :key="y" :value="y">
              {{ y }}
            </option>
          </select>
        </label>

        <label>
          Quarter
          <select v-model="selectedQuarter">
            <option value="all">All</option>
            <option v-for="q in quartersForFilter" :key="q" :value="q">
              {{ q }}
            </option>
          </select>
        </label>

        <label>
          Min price (M CAD)
          <input v-model.number="minPrice" type="number" min="0" step="1" />
        </label>
      </div>
    </div>

    <div v-if="loading" class="status-row">
      Loading transactions...
    </div>
    <div v-else-if="error" class="status-row error">
      {{ error }}
    </div>

    <div v-else class="content">
      <div class="metrics-row">
        <div class="metric-card">
          <p class="metric-label">Deals</p>
          <p class="metric-value">{{ filteredRows.length }}</p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Total volume</p>
          <p class="metric-value">{{ formatCurrency(totalVolume) }}</p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Average deal size</p>
          <p class="metric-value">
            {{ filteredRows.length ? formatCurrency(averagePrice) : 'N/A' }}
          </p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Largest deal</p>
          <p class="metric-value">
            {{ filteredRows.length ? formatCurrency(maxPrice) : 'N/A' }}
          </p>
        </div>
      </div>

      <div class="chart-card" v-if="chartPoints.points.length">
        <div class="chart-header">
          <h3 class="section-title">Highest transaction per quarter</h3>
          <p class="chart-subtitle">
            Hover points to see quarter, price and address.
          </p>
        </div>

        <div class="chart-shell">
          <svg
            :width="chartWidth"
            :height="chartHeight"
            class="chart-svg"
            role="img"
          >
            <line
              :x1="chartPadding"
              :y1="chartHeight - chartPadding"
              :x2="chartWidth - chartPadding"
              :y2="chartHeight - chartPadding"
              class="axis-line"
            />

            <polyline
              v-if="chartPoints.polyline"
              :points="chartPoints.polyline"
              class="chart-line"
              fill="none"
            />

            <g
              v-for="p in chartPoints.points"
              :key="p.key"
              @mouseenter="hoveredPoint = p"
              @mouseleave="hoveredPoint = null"
            >
              <circle
                :cx="p.x"
                :cy="p.y"
                r="4"
                class="chart-point"
              />
            </g>

            <g v-for="p in chartPoints.points" :key="p.key + '-label'">
              <text
                :x="p.x"
                :y="chartHeight - chartPadding + 14"
                class="chart-label"
              >
                {{ p.label }}
              </text>
            </g>
          </svg>

          <div
            v-if="hoveredPoint"
            class="chart-tooltip"
            :style="{
              left: hoveredPoint.x + 'px',
              top: hoveredPoint.y + 'px',
            }"
          >
            <div class="tooltip-line">
              {{ hoveredPoint.label }}
            </div>
            <div class="tooltip-line">
              {{ formatMillions(hoveredPoint.price) }} CAD
            </div>
            <div class="tooltip-line tooltip-address">
              {{ hoveredPoint.address }}
            </div>
          </div>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th @click="setSort('address')">
                Address
                <span class="sort-indicator">{{ sortIndicator('address') }}</span>
              </th>
              <th @click="setSort('price')">
                Price (CAD)
                <span class="sort-indicator">{{ sortIndicator('price') }}</span>
              </th>
              <th @click="setSort('date')">
                Date
                <span class="sort-indicator">{{ sortIndicator('date') }}</span>
              </th>
              <th @click="setSort('quarter')">
                Quarter
                <span class="sort-indicator">{{ sortIndicator('quarter') }}</span>
              </th>
              <th @click="setSort('units')">
                Units
                <span class="sort-indicator">{{ sortIndicator('units') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in sortedRows" :key="row.id">
              <td class="emphasize">{{ row.address }}</td>
              <td>{{ formatCurrency(row.price) }}</td>
              <td>{{ row.date }}</td>
              <td>{{ row.quarter }}</td>
              <td>{{ row.units ?? 'N/A' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page {
  max-width: 1400px;
  margin: 0 auto;
  color: var(--primary-text);
}

.page-header {
  margin-bottom: 16px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.75rem;
  color: var(--secondary-text);
  margin: 0 0 4px;
}

.page-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 0.9rem;
  color: var(--secondary-text);
}

.filter-row {
  margin-top: 16px;
  margin-bottom: 12px;
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-group label {
  display: flex;
  flex-direction: column;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--secondary-text);
}

.filter-group select,
.filter-group input {
  margin-top: 4px;
  padding: 6px 8px;
  border-radius: 2px;
  border: 1px solid var(--border-color-light);
  background-color: var(--tertiary-bg);
  color: var(--primary-text);
  min-width: 140px;
}

.status-row {
  margin-top: 12px;
  font-size: 0.9rem;
}

.status-row.error {
  color: #ffb3b3;
}

.content {
  margin-top: 12px;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  background-color: var(--tertiary-bg);
  border-radius: 2px;
  border: 1px solid var(--border-color-light);
  padding: 10px 12px;
  box-shadow: 0 8px 18px var(--shadow-color-light);
}

.metric-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--secondary-text);
}

.metric-value {
  margin: 4px 0 0;
  font-size: 1.1rem;
  font-weight: 600;
}

/* chart */

.chart-card {
  margin-top: 20px;
  background-color: var(--tertiary-bg);
  border-radius: 2px;
  border: 1px solid var(--border-color-light);
  padding: 12px 16px;
  box-shadow: 0 10px 30px var(--shadow-color-light);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 4px;
}

.section-title {
  margin: 0;
  font-size: 0.95rem;
}

.chart-subtitle {
  margin: 0;
  font-size: 0.8rem;
  color: var(--secondary-text);
  text-align: right;
}

.chart-shell {
  position: relative;
  overflow: visible;
}

.chart-svg {
  width: 100%;
  max-width: 100%;
  padding: auto;
  text-align: center;
  
}

.axis-line {
  stroke: var(--border-color-light);
  stroke-width: 1;
}

.chart-line {
  stroke: var(--accent-color);
  stroke-width: 2;
}

.chart-point {
  fill: var(--accent-bg);
  stroke: var(--border-color-light);
  stroke-width: 1;
  cursor: pointer;
}

.chart-label {
  fill: var(--primary-text);
  font-size: 0.7rem;
  text-anchor: middle;
}

/* tooltip */

.chart-tooltip {
  position: absolute;
  transform: translate(-50%, -110%);
  padding: 6px 8px;
  border-radius: 2px;
  background-color: var(--primary-bg);
  border: 1px solid var(--border-color-light);
  box-shadow: 0 6px 18px var(--shadow-color-medium);
  font-size: 0.75rem;
  max-width: 260px;
  pointer-events: none;
}

.tooltip-line {
  white-space: nowrap;
}

.tooltip-address {
  white-space: normal;
  margin-top: 2px;
  color: var(--secondary-text);
}

/* table */

.table-wrapper {
  margin-top: 24px;
  width: 100%;
  display: flex;
  justify-content: center;
}

.data-table {
  width: 80vw;
  max-width: 1200px;
  border-collapse: collapse;
  background-color: var(--panel-bg);
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid var(--border-color-light);
  box-shadow: 0 12px 30px var(--shadow-color-light);
}

.data-table th,
.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--table-lines);
  text-align: left;
}

.data-table th {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: var(--secondary-text);
  cursor: pointer;
  user-select: none;
}

.data-table tr:hover {
  background-color: var(--hover-bg);
  color: var(--hover-text);
}

.sort-indicator {
  margin-left: 4px;
  font-size: 0.7rem;
  color: var(--secondary-text);
}

.emphasize {
  font-weight: 600;
}

@media (max-width: 900px) {
  .metrics-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .data-table {
    width: 90vw;
  }
}
</style>
