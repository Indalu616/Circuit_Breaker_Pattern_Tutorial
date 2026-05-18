// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Circuit Breaker Activity',
  tagline: 'CSC408 – Distributed Information Systems',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://your-docusaurus-site.example.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'facebook', // Usually your GitHub org/user name.
  projectName: 'docusaurus', // Usually your repo name.

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  // To enable Mermaid diagrams, run: npm install @docusaurus/theme-mermaid
  // Then uncomment the two lines below and restart:
  // markdown: { mermaid: true },
  // themes: ['@docusaurus/theme-mermaid'],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'CSC408',
        logo: {
          alt: 'CSC408 Circuit Breaker Activity',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Circuit Breaker Pattern',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Activity',
            items: [
              {
                label: 'Overview',
                to: '/docs/intro',
              },
              {
                label: 'Background & Theory',
                to: '/docs/background',
              },
              {
                label: 'Conclusion',
                to: '/docs/conclusion',
              },
            ],
          },
          {
            title: 'Parts',
            items: [
              {
                label: 'Part 1 — Backend Server',
                to: '/docs/part-1-backend-server',
              },
              {
                label: 'Part 2 — Load Balancer',
                to: '/docs/part-2-load-balancer',
              },
              {
                label: 'Part 3 — Demo & Testing',
                to: '/docs/part-3-demo',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} CSC408 – Distributed Information Systems`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
