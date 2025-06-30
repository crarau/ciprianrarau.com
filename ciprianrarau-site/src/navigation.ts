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
      text: 'Pet Projects',
      href: getPermalink('/pet-projects'),
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
      variant: 'primary' as const,
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
        { text: 'WISK.ai', href: getPermalink('/projects/wisk') },
        { text: 'Mentorly', href: getPermalink('/projects/mentorly') },
        { text: 'WeHappers', href: getPermalink('/projects/wehappers') },
        { text: 'CatalyzeUP', href: getPermalink('/projects/catalyzeup') },
        { text: 'Alvéole', href: getPermalink('/projects/alveole') },
        { text: 'View All', href: getPermalink('/#projects') },
      ],
    },
    {
      title: 'Pet Projects',
      links: [
        { text: 'MyDayInMusic', href: getPermalink('/pet-projects/mydayinmusic') },
        { text: 'OneOps Cloud', href: getPermalink('/pet-projects/oneops') },
        { text: 'View All', href: getPermalink('/pet-projects') },
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
