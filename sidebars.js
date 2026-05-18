// @ts-check

/**
 * @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */
const sidebars = {
  tutorialSidebar: [
    "intro",
    "background",

    {
      type: "category",
      label: "Part 1 — Backend Server",
      collapsible: true,
      collapsed: false,
      items: [
        "part-1-backend-server/index",
        "part-1-backend-server/step-1-initialize",
        "part-1-backend-server/step-2-model",
        "part-1-backend-server/step-3-repository",
        "part-1-backend-server/step-4-service-interface",
        "part-1-backend-server/step-5-service-impl",
        "part-1-backend-server/step-6-product-controller",
        "part-1-backend-server/step-7-admin-controller",
        "part-1-backend-server/step-8-configuration",
        "part-1-backend-server/step-9-seed-data",
      ],
    },

    {
      type: "category",
      label: "Part 2 — Load Balancer",
      collapsible: true,
      collapsed: false,
      items: [
        "part-2-load-balancer/index",
        "part-2-load-balancer/step-1-initialize",
        "part-2-load-balancer/step-2-circuit-breaker-state",
        "part-2-load-balancer/step-3-circuit-breaker",
        "part-2-load-balancer/step-4-backend-instance",
        "part-2-load-balancer/step-5-load-balancer",
        "part-2-load-balancer/step-6-health-checker",
        "part-2-load-balancer/step-7-proxy-controller",
        "part-2-load-balancer/step-8-status-controller",
        "part-2-load-balancer/step-9-configuration",
      ],
    },

    {
      type: "category",
      label: "Part 3 — Demonstration",
      collapsible: true,
      collapsed: false,
      items: [
        "part-3-demo/index",
        "part-3-demo/running-all-services",
        "part-3-demo/triggering-failure",
        "part-3-demo/observing-circuit-breaker",
        "part-3-demo/recovery-demo",
      ],
    },

    "conclusion",
  ],
};

export default sidebars;
