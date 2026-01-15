// src/router/index.js
import { createRouter, createWebHashHistory } from "vue-router";
import { h } from "vue";

// -----------------------------
// 1) 静态路由（故意不加 /admin）
// -----------------------------
const routes = [
  { path: "/", component: { render: () => h("div", "Home") } },
  { path: "/login", component: { render: () => h("div", "Login") } },
  { path: "/dashboard", component: { render: () => h("div", "Dashboard") } },
     // ★ 新增：需要登录权限的静态路由
  {
    path: "/secret",
    component: { render: () => h("div", "Secret Page (requireAuth)") },
    meta: { requireAuth: true }
  }
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// -----------------------------
// 2) 全局演示状态
// -----------------------------
window.__demo = window.__demo ?? {
  token: false,
  dynamicAdded: false,
  useRedirect: false,
  useDynamicFix: true,
  ALWAYS_REPLACE: false,
};

// -----------------------------
// 3) 调试辅助：路由表快照 + 打印工具
// -----------------------------
function hasRoutePath(path) {
  return router.getRoutes().some((r) => r.path === path);
}

function routeTableSnapshot() {
  return router
    .getRoutes()
    .map((r) => ({ path: r.path, name: r.name ?? "-" }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

function printNavHeader(navId, to, from) {
  console.groupCollapsed(
    `%c[NAV#${navId}] beforeEach ${from.fullPath} -> ${to.fullPath}`,
    "color:#42b983;font-weight:bold;"
  );

  console.log("to.fullPath       =", to.fullPath);
  console.log("from.fullPath     =", from.fullPath);
  console.log("to.matched.length =", to.matched.length);
  console.log(
    "to.matched.paths  =",
    to.matched.map((r) => r.path)
  );
  console.log("to.meta           =", to.meta);
  console.log("demo              =", window.__demo);
  console.log("hasRoute('/admin')=", hasRoutePath("/admin"));
  console.log("routes snapshot   =", routeTableSnapshot());

  console.groupEnd();
}

function pause(label, navId, extra = {}) {
  console.groupCollapsed(
    `%c[NAV#${navId}] PAUSE @ ${label}`,
    "color:#d97706;font-weight:bold;"
  );
  Object.entries(extra).forEach(([k, v]) => console.log(k, v));
  console.groupEnd();
  debugger;
}

// -----------------------------
// 4) 动态加路由：只加一次
// -----------------------------
function addDynamicRouteOnce(navId) {
  if (window.__demo.dynamicAdded) {
    console.log(`[NAV#${navId}] addDynamicRouteOnce: 已加过，跳过`);
    return;
  }
  window.__demo.dynamicAdded = true;

  router.addRoute({
    path: "/admin",
    component: { render: () => h("div", "Admin (dynamic route)") },
    meta: { requireAuth: true },
  });

  console.log(`[NAV#${navId}] ✅ addRoute: /admin 已添加`);
  console.log(`[NAV#${navId}]    现在 hasRoute('/admin') =`, hasRoutePath("/admin"));

}

// -----------------------------
// 5) 全局前置守卫（next 版）
// -----------------------------
router.beforeEach((to, from, next) => {
  window.__NAV_COUNTER__ = (window.__NAV_COUNTER__ || 0) + 1;
  const navId = window.__NAV_COUNTER__;

  printNavHeader(navId, to, from);

  // 断点：每次进守卫都停
  pause("ENTER_GUARD", navId, {
    "to.fullPath": to.fullPath,
    "to.matched.length": to.matched.length,
    "hasRoute('/admin')": hasRoutePath("/admin"),
  });

  // -------------------------
  // 分支 0：故意死循环演示
  // -------------------------
  if (window.__demo.ALWAYS_REPLACE) {
    pause("ALWAYS_REPLACE (WILL LOOP)", navId, {
      hint: "每次都 next({ ...to, replace:true }) 会触发新导航，进而无限重复 beforeEach",
    });
    // Router4: next(location) 触发重定向（新导航）
    return next({ ...to, replace: true });
  }

  // -------------------------
  // 分支 1：鉴权（依赖 meta.requireAuth）
  // -------------------------
  if (to.meta?.requireAuth && !window.__demo.token) {
    pause("AUTH_REDIRECT -> /login", navId, {
      reason: "to.meta.requireAuth=true 且 token=false",
      "to.meta": to.meta,
    });
    // Router3/4 风格：next('/login') 触发重定向（新导航）
    return next("/login");
  }

  // -------------------------
  // 分支 2：已登录访问 /login 重定向 /dashboard
  // -------------------------
  if (window.__demo.useRedirect && window.__demo.token && to.path === "/login") {
    pause("REDIRECT /login -> /dashboard", navId, {
      reason: "useRedirect=true 且 token=true 且 to.path=/login",
    });
    return next("/dashboard");
  }

  // -------------------------
  // 分支 3：动态路由演示
  // -------------------------
  if (window.__demo.token && to.path === "/admin" && !window.__demo.dynamicAdded) {
    pause("DYNAMIC: ABOUT TO addRoute('/admin')", navId, {
      "BEFORE addRoute: hasRoute('/admin')": hasRoutePath("/admin"),
      "to.matched.length (BEFORE)": to.matched.length,
      explain:
        "此时这一趟导航开始时 /admin 可能还没匹配到，所以 matched.length 可能是 0",
    });

    addDynamicRouteOnce(navId);

    pause("DYNAMIC: AFTER addRoute('/admin')", navId, {
      "AFTER addRoute: hasRoute('/admin')": hasRoutePath("/admin"),
      "to.matched.length (STILL old nav)": to.matched.length,
      explain:
        "即使路由表更新了，当前这趟导航的 to.matched 不会自动变；需要重导航才能重新匹配",
    });

    if (window.__demo.useDynamicFix) {
      pause("DYNAMIC_FIX: next({ ...to, replace:true }) (RE-NAVIGATE)", navId, {
        explain:
          "这会触发一次新导航到同一个地址 /admin，因此 beforeEach 会再跑一遍，第二次 matched.length 通常会变为 1",
      });
      // 关键：next(location) → 新导航 → beforeEach 再执行
      return next({ ...to, replace: true });
    } else {
      pause("NO_DYNAMIC_FIX: next() (CONTINUE SAME NAV)", navId, {
        explain:
          "这只会继续当前这趟导航，不会触发第二次 beforeEach；若开始时没匹配到 /admin，则最终 matched.length 仍为 0",
      });
      // 关键：next() → 继续当前导航（不新开导航）
      return next();
    }
  }

  // -------------------------
  // 分支 4：正常放行
  // -------------------------
  pause("PASS: next()", navId, {
    explain: "放行当前这趟导航，不会触发新导航，因此不会再次进入 beforeEach",
  });
  return next();
});
