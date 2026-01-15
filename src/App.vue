<template>
  <div style="font-family:sans-serif;padding:20px">
    <h2>Vue3 + Router4 beforeEach / next() Demo</h2>

    <div style="margin-bottom:12px;">
      <button @click="go('/')">Go /</button>
      <button @click="go('/login')">Go /login</button>
      <button @click="go('/dashboard')">Go /dashboard</button>
      <button @click="go('/admin')">Go /admin (dynamic)</button>
      <button @click="go('/secret')">Go /secret (requireAuth)</button>
    </div>

    <div style="margin-bottom:12px;">
      <button @click="toggleToken">
        token: {{ demo.token ? 'ON(已登录)' : 'OFF(未登录)' }}
      </button>

      <button @click="toggleRedirect">
        useRedirect: {{ demo.useRedirect ? 'ON' : 'OFF' }}
      </button>

      <button @click="toggleDynamicFix">
        useDynamicFix: {{ demo.useDynamicFix ? 'ON' : 'OFF' }}
      </button>

      <button @click="resetDynamic">
        reset dynamicAdded
      </button>

      <button style="color:red" @click="toggleAlwaysReplace">
        ALWAYS_REPLACE(死循环): {{ demo.ALWAYS_REPLACE ? 'ON' : 'OFF' }}
      </button>
    </div>

    <p>当前路由： <b>{{ $route.fullPath }}</b></p>
<p>matched.length： <b>{{ $route.matched.length }}</b></p>
<p>name： <b>{{ $route.name ?? '-' }}</b></p>

    <p style="color:#666;">
      打开控制台看 beforeEach 输出
    </p>

    <hr />
    <router-view />
  </div>
</template>

<script setup>
import { reactive } from "vue";
import { useRouter } from "vue-router";

import { watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

watch(
  () => route.fullPath,
  (v) => {
    console.log("[watch route.fullPath]", v, "matched=", route.matched.length);
  },
  { immediate: true }
);

const router = useRouter();
const demo = reactive(window.__demo);

function go(path) {
  router.push(path);
}

function toggleToken() {
  demo.token = !demo.token;
  console.log("[UI] token =", demo.token);
}

function toggleRedirect() {
  demo.useRedirect = !demo.useRedirect;
  console.log("[UI] useRedirect =", demo.useRedirect);
}

function toggleDynamicFix() {
  demo.useDynamicFix = !demo.useDynamicFix;
  console.log("[UI] useDynamicFix =", demo.useDynamicFix);
}

function resetDynamic() {
  demo.dynamicAdded = false;
  console.log("[UI] dynamicAdded reset");
}

function toggleAlwaysReplace() {
  demo.ALWAYS_REPLACE = !demo.ALWAYS_REPLACE;
  console.log("[UI] ALWAYS_REPLACE =", demo.ALWAYS_REPLACE);
}
</script>
