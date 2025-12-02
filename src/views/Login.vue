<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useTheme } from '../composables/useTheme'
import logoDark from '../assets/logos/logo.svg'
import logoLight from '../assets/logos/logo-light.svg'

const route = useRoute()
const router = useRouter()
const { theme } = useTheme()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

const headerLogo = computed(() =>
  theme.value === 'dark' ? logoDark : logoLight
)

const handleSubmit = async () => {
  error.value = ''

  if (!email.value || !password.value) {
    error.value = 'Email and password are required.'
    return
  }

  loading.value = true
  try {
    const res = await fetch(`api.alfapoly.com/api/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value,
      }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      error.value = data.error || 'Invalid credentials.'
      return
    }

    // 1) Mark user as logged in for the router guard
    // If your backend returns a token, use that instead of 'session'
    // example: const token = data.token
    localStorage.setItem('auth_token', 'session')

    // 2) Redirect to requested page or to /transactions by default
    const redirectParam = route.query.redirect
    const redirectTo =
      typeof redirectParam === 'string' && redirectParam
        ? redirectParam
        : '/transactions'

    await router.replace(redirectTo)
  } catch (e) {
    error.value = 'There was a problem contacting the server.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-shell">
    <div class="login-card thin-border">
      <header class="login-header">
        <div class="login-brand">
          <img
            :src="headerLogo"
            alt="Alfapoly logo"
            class="login-logo"
          />
          <div class="login-brand-text">
            <p class="eyebrow">Alfapoly</p>
            <h1 class="login-title">Real Estate Effect</h1>
          </div>
        </div>
      </header>

      <form class="login-form" @submit.prevent="handleSubmit">
        <div class="field-input">
          <div class="input-wrapper">
            <Icon icon="mdi:email-outline" class="input-icon" />
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              required
              placeholder="Email"
            />
          </div>
        </div>

        <div class="field-input">
          <div class="input-wrapper">
            <Icon icon="mdi:lock-outline" class="input-icon" />
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
              placeholder="Password"
            />
          </div>
        </div>

        <p v-if="error" class="login-error">
          {{ error }}
        </p>

        <button
          class="primary-btn login-submit"
          type="submit"
          :disabled="loading"
        >
          <span v-if="!loading">Sign in</span>
          <span v-else>Signing in...</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-shell {
  min-height: 100vh;
  background: radial-gradient(
      circle at top left,
      rgba(255, 255, 255, 0.04),
      transparent 55%
    ),
    var(--primary-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
}

.login-card {
  width: min(420px, 100%);
  background-color: var(--secondary-bg);
  border-radius: 2px;
  border: 1px solid var(--border-color-medium);
  box-shadow: 0 26px 60px var(--shadow-color);
  padding: 24px 24px 20px;
  color: var(--primary-text);
}

.login-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.login-logo {
  height: 44px;
  width: auto;
  display: block;
}

.login-brand-text .eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: var(--secondary-text);
}

.login-title {
  margin: 2px 0 0;
  font-size: 1.05rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 600;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 8px;
}

.field-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper input {
  width: 100%;
  border-radius: 2px;
  border: 1px solid var(--border-color-light);
  padding: 8px 10px 8px 32px;
  background-color: var(--input-bg);
  color: var(--primary-text);
  font-family: 'Montserrat';
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--accent-color-border);
  box-shadow: 0 0 0 1px var(--accent-color-border);
  background-color: var(--secondary-bg-pane);
}

.input-icon {
  position: absolute;
  left: 9px;
  font-size: 1.1rem;
  color: var(--secondary-text);
}

.login-error {
  margin: 2px 0 0;
  font-size: 0.85rem;
  color: #ff6b6b;
}

.primary-btn {
  border-radius: 2px;
  border: none;
  padding: 8px 10px;
  font-size: 0.9rem;
  cursor: pointer;
  background: var(--primary-text);
  color: var(--primary-bg);
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.18s ease, transform 0.1s ease;
}

.primary-btn:disabled {
  opacity: 0.7;
  cursor: default;
  transform: none;
}

.primary-btn:not(:disabled):hover {
  background-color: var(--accent-color);
  transform: translateY(-1px);
}

.login-submit {
  margin-top: 6px;
  width: 100%;
}

.thin-border {
  border-width: 1px;
}
</style>
