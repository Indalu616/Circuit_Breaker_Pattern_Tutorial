// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const config = {
  title: "Circuit Breaker Pattern Tutorial",
  tagline: "Distributed Systems Resilience & Load Balancing Activity",
  favicon: "img/favicon.ico",

  // GitHub Pages URL
  url: "https://indalu616.github.io",

  // Repository name
  baseUrl: "/Circuit_Breaker_Pattern_Tutorial/",

  // GitHub deployment config
  organizationName: "Indalu616",
  projectName: "Circuit_Breaker_Pattern_Tutorial",

  trailingSlash: false,

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),

          // Edit this to your repo
          editUrl:
            "https://github.com/Indalu616/Circuit_Breaker_Pattern_Tutorial/tree/main/",
        },

        blog: false,

        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],

  themeConfig: {
    image: "img/docusaurus-social-card.jpg",

    navbar: {
      title: "Circuit Breaker Docs",

      logo: {
        alt: "Circuit Breaker Logo",
        src: "img/logo.svg",
      },

      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Documentation",
        },

        {
          href: "https://github.com/Indalu616/Circuit_Breaker_Pattern_Tutorial",
          label: "GitHub",
          position: "right",
        },
      ],
    },

    footer: {
      style: "dark",

      links: [
        {
          title: "Documentation",
          items: [
            {
              label: "Introduction",
              to: "/docs/intro",
            },
            {
              label: "Backend Server",
              to: "/docs/category/part-1--backend-server",
            },
          ],
        },

        {
          title: "More",
          items: [
            {
              label: "GitHub Repository",
              href: "https://github.com/Indalu616/Circuit_Breaker_Pattern_Tutorial",
            },
          ],
        },
      ],

      copyright: `Copyright © ${new Date().getFullYear()} Indalu Kelbesa. Built with Docusaurus.`,
    },

    prism: {
      additionalLanguages: ["java", "bash", "properties"],
    },

    colorMode: {
      defaultMode: "light",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
  },
};

module.exports = config;
