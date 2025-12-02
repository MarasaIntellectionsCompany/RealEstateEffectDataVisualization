<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import Chart from 'chart.js/auto'
import ChartDataLabels from 'chartjs-plugin-datalabels'

Chart.register(ChartDataLabels)

// Raw data loaded at runtime from /public/data
const allDeals = ref([])

// Filters
const selectedYear = ref(null)
const selectedQuarter = ref('All')
const selectedType = ref('All') // Bureau / Commercial / Industriel / All

// Chart mode: "area" = square footage, "count" = number of deals
const valueMode = ref('area')

// Chart instance
const chartCanvas = ref(null)
let leasingChart = null

onMounted(async () => {
  try {
    const res = await fetch('/data/leasing_deals_sample.json')
    const data = await res.json()
    allDeals.value = Array.isArray(data) ? data : []

    // Initialize default filters
    const yrs = years.value
    if (yrs.length > 0) {
      selectedYear.value = yrs[0]
    }
    const qs = quartersForYear.value
    if (qs.length > 0) {
      selectedQuarter.value = 'All'
    }

    createOrUpdateChart()
  } catch (err) {
    console.error('Failed to load leasing deals:', err)
  }
})

// Unique years from data
const years = computed(() => {
  const set = new Set()
  allDeals.value.forEach(d => {
    if (d.year != null) set.add(d.year)
  })
  return Array.from(set).sort((a, b) => a - b)
})

// Quarters available for the selected year
const quartersForYear = computed(() => {
  if (!selectedYear.value) return []
  const set = new Set()
  allDeals.value
    .filter(d => d.year === selectedYear.value)
    .forEach(d => {
      if (d.quarter) set.add(d.quarter)
    })
  const list = Array.from(set)
  const order = ['Q1', 'Q2', 'Q3', 'Q4']
  return list.sort((a, b) => order.indexOf(a) - order.indexOf(b))
})

// Filtered deals for table + aggregations
const filteredDeals = computed(() => {
  return allDeals.value.filter(d => {
    if (selectedYear.value && d.year !== selectedYear.value) return false
    if (selectedQuarter.value && selectedQuarter.value !== 'All' && d.quarter !== selectedQuarter.value) return false
    if (selectedType.value && selectedType.value !== 'All' && d.type !== selectedType.value) return false
    return true
  })
})

// Aggregation for stacked bar chart
// Result: { Bureau: { new: {area,count}, renewal: {...}, expansion: {...} }, Commercial: {...}, Industriel: {...} }
const aggregatedByTypeAndStatus = computed(() => {
  const result = {
    Bureau: { new: { area: 0, count: 0 }, renewal: { area: 0, count: 0 }, expansion: { area: 0, count: 0 } },
    Commercial: { new: { area: 0, count: 0 }, renewal: { area: 0, count: 0 }, expansion: { area: 0, count: 0 } },
    Industriel: { new: { area: 0, count: 0 }, renewal: { area: 0, count: 0 }, expansion: { area: 0, count: 0 } },
  }

  filteredDeals.value.forEach(d => {
    const t = d.type
    if (!result[t]) return
    const area = typeof d.area === 'number' ? d.area : 0

    if (d.newLease) {
      result[t].new.area += area
      result[t].new.count += 1
    }
    if (d.renewal) {
      result[t].renewal.area += area
      result[t].renewal.count += 1
    }
    if (d.expansion) {
      result[t].expansion.area += area
      result[t].expansion.count += 1
    }
  })

  return result
})

// Rebuild chart whenever filters or mode change
watch([filteredDeals, valueMode], () => {
  createOrUpdateChart()
})

function createOrUpdateChart() {
  if (!chartCanvas.value || !allDeals.value.length) return

  const ctx = chartCanvas.value.getContext('2d')
  const agg = aggregatedByTypeAndStatus.value
  const mode = valueMode.value

  const labels = ['Bureau', 'Commercial', 'Industriel']

  const newData = labels.map(t => agg[t].new[mode])
  const renewalData = labels.map(t => agg[t].renewal[mode])
  const expansionData = labels.map(t => agg[t].expansion[mode])

  const titleText =
    mode === 'area'
      ? 'Leasing mix by asset type and deal status (square footage)'
      : 'Leasing mix by asset type and deal status (number of deals)'

  if (leasingChart) {
    leasingChart.destroy()
  }

  leasingChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'New lease',
          data: newData,
          backgroundColor: '#4A90E2',
          stack: 'leasing',
        },
        {
          label: 'Renewal',
          data: renewalData,
          backgroundColor: '#50B96A',
          stack: 'leasing',
        },
        {
          label: 'Expansion',
          data: expansionData,
          backgroundColor: '#F5A623',
          stack: 'leasing',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'left',
          align: 'center',
          labels: {
            usePointStyle: true,
          },
        },
        title: {
          display: true,
          text: titleText,
          align: 'center',
          padding: { top: 10, bottom: 10 },
        },
        tooltip: {
          callbacks: {
            label(context) {
              const value = context.parsed.y || 0
              if (mode === 'area') {
                return `${context.dataset.label}: ${value.toLocaleString('en-CA')} sqft`
              }
              return `${context.dataset.label}: ${value.toLocaleString('en-CA')} deals`
            },
          },
        },
        datalabels: {
          anchor: 'end',
          align: 'end',
          offset: 4,
          clamp: true,
          formatter(value) {
            if (!value) return ''
            if (mode === 'area') {
              return `${value.toLocaleString('en-CA')} sqft`
            }
            return value.toLocaleString('en-CA')
          },
          font: {
            size: 10,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: {
            display: false,
          },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: {
            callback(value) {
              return value.toLocaleString('en-CA')
            },
          },
        },
      },
    },
  })
}

// Helpers
function formatSqft(v) {
  if (v == null || isNaN(v)) return ''
  return `${v.toLocaleString('en-CA')} sqft`
}
</script>

<template>
  <div class="leasing-view">
    <header class="panel-header">
      <div class="panel-header-left">
        <h1 class="panel-title">Leasing activity</h1>
        <p class="panel-subtitle">
          Montreal leasing tape by asset type, deal status, and square footage.
        </p>
      </div>
      <div class="panel-header-right">
        <div class="filters-row">
          <label class="filter-field">
            <span>Year</span>
            <select v-model="selectedYear">
              <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
            </select>
          </label>

          <label class="filter-field">
            <span>Quarter</span>
            <select v-model="selectedQuarter">
              <option value="All">All</option>
              <option v-for="q in quartersForYear" :key="q" :value="q">{{ q }}</option>
            </select>
          </label>

          <label class="filter-field">
            <span>Asset class</span>
            <select v-model="selectedType">
              <option value="All">All</option>
              <option value="Bureau">Bureau</option>
              <option value="Commercial">Commercial</option>
              <option value="Industriel">Industriel</option>
            </select>
          </label>
        </div>

        <div class="mode-switch">
          <span class="mode-label">Metric</span>
          <div class="mode-buttons" role="group" aria-label="Leasing metric switch">
            <button
              type="button"
              class="switch-btn"
              :class="{ active: valueMode === 'area' }"
              @click="valueMode = 'area'"
            >
              Square footage mix
            </button>
            <button
              type="button"
              class="switch-btn"
              :class="{ active: valueMode === 'count' }"
              @click="valueMode = 'count'"
            >
              Deal count mix
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="panel-main">
      <section class="chart-card">
        <div class="chart-wrapper">
          <canvas ref="chartCanvas" />
        </div>
      </section>

      <section class="table-card">
        <header class="table-header">
          <h2>Leasing deals</h2>
          <p>
            {{ filteredDeals.length.toLocaleString('en-CA') }}
            deals in view
          </p>
        </header>

        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Quarter</th>
                <th>Type</th>
                <th>Area</th>
                <th>Address</th>
                <th>Owner</th>
                <th>Tenant</th>
                <th>Deal flags</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(deal, idx) in filteredDeals" :key="idx">
                <td>{{ deal.year }}</td>
                <td>{{ deal.quarter }}</td>
                <td>{{ deal.type }}</td>
                <td class="numeric">{{ formatSqft(deal.area) }}</td>
                <td>{{ deal.address }}</td>
                <td>{{ deal.owner }}</td>
                <td>{{ deal.tenant }}</td>
                <td>
                  <span v-if="deal.newLease" class="pill pill-new">New</span>
                  <span v-if="deal.renewal" class="pill pill-renewal">Renewal</span>
                  <span v-if="deal.expansion" class="pill pill-expansion">Expansion</span>
                </td>
              </tr>
              <tr v-if="!filteredDeals.length">
                <td colspan="8" class="empty-row">
                  No deals for this filter.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.leasing-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  padding: 0.75rem 1rem 1rem;
  box-sizing: border-box;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  border-bottom: 1px solid var(--border-subtle, #333);
  padding-bottom: 0.5rem;
}

.panel-title {
  font-size: 1.1rem;
  margin: 0;
}

.panel-subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  opacity: 0.8;
}

.panel-header-right {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  align-items: flex-end;
}

.filters-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 0.75rem;
}

.filter-field span {
  opacity: 0.8;
}

.filter-field select {
  min-width: 90px;
  padding: 3px 6px;
  border-radius: 4px;
  border: 1px solid var(--border-subtle, #444);
  background: var(--primary-bg, #101015);
  color: var(--primary-text, #f5f5f5);
  font-size: 0.8rem;
}

.mode-switch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mode-label {
  font-size: 0.75rem;
  opacity: 0.8;
}

.mode-buttons {
  display: inline-flex;
  gap: 0.25rem;
}

.panel-main {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  min-height: 0;
}

.chart-card {
  background: var(--panel-bg, #14141c);
  border-radius: 8px;
  border: 1px solid var(--border-subtle, #333);
  padding: 0.5rem 0.75rem 0.75rem;
  min-height: 260px;
}

.chart-wrapper {
  position: relative;
  width: 100%;
  height: 260px;
}

.table-card {
  background: var(--panel-bg, #14141c);
  border-radius: 8px;
  border: 1px solid var(--border-subtle, #333);
  padding: 0.5rem 0.75rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-height: 0;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
}

.table-header h2 {
  margin: 0;
  font-size: 0.95rem;
}

.table-header p {
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.8;
}

.table-scroll {
  overflow: auto;
  max-height: 280px;
  border-radius: 4px;
  border: 1px solid var(--border-subtle, #333);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.data-table thead {
  position: sticky;
  top: 0;
  background: var(--header-bg, #181821);
  z-index: 1;
}

.data-table th,
.data-table td {
  padding: 0.25rem 0.5rem;
  border-bottom: 1px solid var(--border-subtle, #333);
  text-align: left;
  white-space: nowrap;
}

.data-table th {
  font-weight: 500;
  font-size: 0.75rem;
  opacity: 0.9;
}

.data-table tbody tr:nth-child(odd) {
  background: rgba(255, 255, 255, 0.01);
}

.data-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.04);
}

.numeric {
  text-align: right;
}

.empty-row {
  text-align: center;
  padding: 1rem 0.5rem;
  opacity: 0.8;
}

.pill {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 0.7rem;
  margin-right: 0.15rem;
}

.pill-new {
  background: rgba(74, 144, 226, 0.15);
  color: #4a90e2;
}

.pill-renewal {
  background: rgba(80, 185, 106, 0.15);
  color: #50b96a;
}

.pill-expansion {
  background: rgba(245, 166, 35, 0.15);
  color: #f5a623;
}

@media (max-width: 900px) {
  .panel-header {
    flex-direction: column;
    align-items: stretch;
  }

  .panel-header-right {
    align-items: flex-start;
  }

  .chart-wrapper {
    height: 260px;
  }

  .table-scroll {
    max-height: 220px;
  }
}
</style>
