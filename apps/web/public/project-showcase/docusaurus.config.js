// @ts-check
import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'G-NEXA',
  tagline: 'Engineering the Future of Multi-Seller Microservices',
  favicon: 'img/favicon.png',

  url: 'https://muhammadwildan.com', // Placeholder for actual domain
  baseUrl: '/',

  organizationName: 'muhammadwildanskyyy', 
  projectName: 'G-NEXA', 

  onBrokenLinks: 'throw', 
  onBrokenMarkdownLinks: 'throw',

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
          editUrl:
            'https://github.com/muhammadwildanskyyy/G-NEXA/edit/main/apps/web/public/project-showcase/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'G-NEXA',
        logo: {
          alt: 'G-NEXA Logo',
          src: 'img/logo.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'gnexaSidebar',
            position: 'left',
            label: 'Engineering Journal',
          },
          {
            href: 'https://github.com/muhammadwildan/G-NEXA',
            label: 'GitHub (Coming Soon)',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'Vision',
                to: '/docs/overview/vision',
              },
              {
                label: 'Components',
                to: '/docs/components/user-service',
              },
              {
                label: 'Core Engineering',
                to: '/docs/engineering/saga-pattern',
              },
            ],
          },
          {
            title: 'Repository',
            items: [
              {
                label: 'GitHub (Coming Soon)',
                href: 'https://github.com/muhammadwildan/G-NEXA',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} GNEXA Project`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
      mermaid: {
        theme: { light: 'neutral', dark: 'forest' },
      },
    }),
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],
};

export default config;
