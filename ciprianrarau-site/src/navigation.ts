import { getPermalink, getBlogPermalink } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Home',
      href: getPermalink('/'),
    },
    {
      text: 'About',
      href: getPermalink('/#about'),
    },
    {
      text: 'Projects',
      href: getPermalink('/#projects'),
    },
    {
      text: 'Resume',
      href: getPermalink('/#resume'),
    },
    {
      text: 'Blog',
      href: getBlogPermalink(),
    },
    {
      text: 'Contact',
      href: getPermalink('/contact'),
    },
  ],
  actions: [
    { 
      text: 'Contact me', 
      href: getPermalink('/contact'),
      variant: 'primary',
    }
  ],
};

export const footerData = {
  links: [
    {
      title: 'Navigation',
      links: [
        { text: 'Home', href: getPermalink('/') },
        { text: 'About', href: getPermalink('/#about') },
        { text: 'Projects', href: getPermalink('/#projects') },
        { text: 'Resume', href: getPermalink('/#resume') },
        { text: 'Blog', href: getBlogPermalink() },
        { text: 'Contact', href: getPermalink('/contact') },
      ],
    },
    {
      title: 'Projects',
      links: [
        { text: 'WISK.ai', href: 'https://wisk.ai', target: '_blank' },
        { text: 'Alvéole', href: 'https://alveole.buzz', target: '_blank' },
        { text: 'CatalyzeUp', href: '#' },
        { text: 'IdeaPlaces', href: '#' },
        { text: 'OMsignal', href: '#' },
      ],
    },
    {
      title: 'Connect',
      links: [
        { text: 'LinkedIn', href: 'https://linkedin.com/in/ciprianrarau', target: '_blank' },
        { text: 'GitHub', href: 'https://github.com/crarau', target: '_blank' },
        { text: 'Email', href: 'mailto:me@ciprianrarau.com' },
        { text: 'Phone', href: 'tel:+15145605016' },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'LinkedIn', icon: 'tabler:brand-linkedin', href: 'https://linkedin.com/in/ciprianrarau' },
    { ariaLabel: 'Github', icon: 'tabler:brand-github', href: 'https://github.com/crarau' },
          { ariaLabel: 'Email', icon: 'tabler:mail', href: 'mailto:me@ciprianrarau.com' },
  ],
  footNote: `
    © ${new Date().getFullYear()} Ciprian Rarau. All rights reserved.
  `,
};
