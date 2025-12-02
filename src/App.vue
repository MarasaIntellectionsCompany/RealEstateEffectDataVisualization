<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import { useTheme } from './composables/useTheme'

const route = useRoute()
const { theme, setTheme } = useTheme()

const selectedTheme = computed({
  get: () => theme.value,
  set: (value) => setTheme(value),
})

// treat login route specially (optional, like other project)
const isAuthRoute = computed(() => route.name === 'login')
</script>

<template>
  <div class="app-shell">
    <!-- hide header when on login, same pattern as other project -->
    <header class="app-header" v-if="!isAuthRoute">
      <div class="brand-block">
        <p class="brand-eyebrow">ALFAPOLY</p>
        <h1 class="brand-title">Real Estate Effect</h1>
      </div>

      <div class="header-right">
        <div class="theme-toggle-group" role="group" aria-label="Theme mode">
          <button
            type="button"
            class="theme-toggle-btn"
            :class="{ active: selectedTheme === 'dark' }"
            @click="selectedTheme = 'dark'"
          >
            Dark
          </button>
          <button
            type="button"
            class="theme-toggle-btn"
            :class="{ active: selectedTheme === 'light' }"
            @click="selectedTheme = 'light'"
          >
            Light
          </button>
        </div>
      </div>
    </header>

    <!-- hide tab bar on login as well -->
    <nav class="tab-nav-bar" v-if="!isAuthRoute">
      <RouterLink
        to="/transactions"
        class="tab-link"
        :class="{ active: route.name === 'transactions' }"
      >
        Transactions
      </RouterLink>
      <RouterLink
        to="/leasing"
        class="tab-link"
        :class="{ active: route.name === 'leasing' }"
      >
        Leasing
      </RouterLink>
    </nav>

    <main class="app-main">
      <!-- same transition as big app -->
      <Transition name="view-fade" mode="out-in">
        <RouterView />
      </Transition>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background-color: var(--primary-bg);
  color: var(--primary-text);
  display: flex;
  flex-direction: column;
}

/* header bar */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 0;
  border-bottom: 1px solid var(--border-color-medium);
  background-color: var(--secondary-bg);
}

.brand-block {
  border-right: 0.5px solid var(--border-color-medium);
  padding-right: 16px;
  padding: 16px 32px 10px;
}

.brand-eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.75rem;
  color: var(--secondary-text);
}

.brand-title {
  margin: 2px 0 0;
  font-size: 1.25rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* theme toggle styled like small chrome buttons */
.theme-toggle-group {
  display: inline-flex;
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid var(--border-color-light);
  background-color: var(--secondary-bg);
  margin: 16px 32px 10px;
}

.theme-toggle-btn {
  min-width: 56px;
  padding: 6px 10px;
  border: none;
  background: transparent;
  color: var(--primary-text);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
}

.theme-toggle-btn + .theme-toggle-btn {
  border-left: 1px solid var(--border-color-light);
}

.theme-toggle-btn.active {
  background-color: var(--hover-bg);
  color: var(--box-text-unit);
}

/* tab bar directly under header, visually attached */
.tab-nav-bar {
  display: inline-flex;
  gap: 0;
  padding: 0 32px;
  background-color: var(--secondary-bg);
}

.tab-link {
  font-family: 'Montserrat';
  font-weight: 500;
  border: none;
  background-color: var(--primary-text);
  color: var(--primary-bg);
  padding: 8px 14px;
  border-radius: 0 0 2px 2px;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  text-decoration: none;
  border-left: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color);
  border-top: none;
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 4px 8px var(--shadow-color-strong);
}

.tab-link + .tab-link {
  margin-left: 4px;
}

.tab-link.active {
  background-color: transparent;
  color: var(--accent-color);
  box-shadow: none;
  border-color: transparent;
}

.app-main {
  flex: 1;
  padding: 24px 32px 32px;
}

/* same transition behavior as in the other project */
.view-fade-enter-active,
.view-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.view-fade-enter-from,
.view-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
