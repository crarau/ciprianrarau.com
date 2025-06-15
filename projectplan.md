# Portfolio Migration Project Plan: al-folio to Astro Wind

## Project Overview
Migration of Ciprian Rarau's portfolio website from Jekyll-based al-folio theme to Astro Wind template, maintaining the minimalistic aesthetic while leveraging modern Astro framework capabilities.

## Phase 1: Project Setup & Analysis
### Checkpoint 1.1: Environment Setup
- [ ] Clone ciprianrarau-site folder as the working directory
- [ ] Install Astro dependencies and verify build process
- [ ] Set up development environment with hot reload
- [ ] Configure Git repository for version control
- [ ] Test deployment pipeline (Netlify/Vercel configuration)

### Checkpoint 1.2: Content Audit & Migration Planning
- [ ] Catalog all content from al-folio:
  - [ ] Personal information and bio
  - [ ] 6 project case studies with images
  - [ ] CV/Resume data structure
  - [ ] Contact information and social links
- [ ] Map al-folio content structure to Astro Wind components
- [ ] Identify content gaps and enhancement opportunities
- [ ] Create content migration checklist

## Phase 2: Core Site Configuration
### Checkpoint 2.1: Site Metadata & Configuration
- [ ] Update site.config.ts with Ciprian's information
- [ ] Configure navigation.ts for proper menu structure
- [ ] Set up environment variables for API keys (if needed)
- [ ] Configure domain settings and redirects
- [ ] Set up analytics and tracking codes

### Checkpoint 2.2: Branding & Theming
- [ ] Replace default colors with brand palette
- [ ] Update typography settings to match minimalistic style
- [ ] Configure dark/light mode preferences
- [ ] Update favicon and app icons
- [ ] Implement custom CSS overrides

## Phase 3: Component Development
### Checkpoint 3.1: Header & Navigation
- [ ] Customize Header component with proper links
- [ ] Update navigation items: Home, About, Projects, CV, Blog, Contact
- [ ] Add LinkedIn and GitHub social links
- [ ] Implement sticky header with scroll behavior
- [ ] Add "Hire me" CTA button

### Checkpoint 3.2: Hero Section
- [ ] Update Hero component with Ciprian's information
- [ ] Add professional title and tagline
- [ ] Implement profile image integration
- [ ] Create compelling subtitle content
- [ ] Add primary CTA for contact

### Checkpoint 3.3: About Section
- [ ] Migrate about content from al-folio
- [ ] Update Content widget with professional summary
- [ ] Add key achievements and highlights
- [ ] Integrate social media links
- [ ] Implement responsive layout

## Phase 4: Portfolio/Projects Section
### Checkpoint 4.1: Project Component Development
- [ ] Create reusable project showcase component
- [ ] Implement image gallery functionality
- [ ] Add project metadata (title, description, tech stack)
- [ ] Create project detail pages
- [ ] Implement project filtering/categorization

### Checkpoint 4.2: Project Content Migration
- [ ] Migrate WISK project with 25+ images
- [ ] Migrate IdeaPlaces project content
- [ ] Migrate OMsignal project content
- [ ] Migrate Alvéole project content
- [ ] Migrate XpertSea project content
- [ ] Migrate Eastern Bank project content
- [ ] Optimize all project images for web

## Phase 5: Resume/CV Section
### Checkpoint 5.1: Experience Timeline
- [ ] Adapt Steps widget for work experience
- [ ] Migrate employment history from CV data
- [ ] Format job titles, companies, and dates
- [ ] Add job descriptions and achievements
- [ ] Implement chronological ordering

### Checkpoint 5.2: Education & Skills
- [ ] Create education section using Steps widget
- [ ] Migrate education data
- [ ] Adapt Features3 widget for skills showcase
- [ ] Categorize technical and soft skills
- [ ] Add proficiency levels or ratings

## Phase 6: Additional Features
### Checkpoint 6.1: Contact Integration
- [ ] Implement contact form functionality
- [ ] Add email integration (SendGrid/Mailgun)
- [ ] Create success/error handling
- [ ] Add form validation
- [ ] Implement spam protection

### Checkpoint 6.2: Blog Setup (Optional)
- [ ] Configure Astro content collections for blog
- [ ] Create blog listing page
- [ ] Design blog post template
- [ ] Migrate selected blog posts (if any)
- [ ] Implement categorization and tagging

## Phase 7: Optimization & Launch
### Checkpoint 7.1: Performance Optimization
- [ ] Implement image lazy loading
- [ ] Optimize bundle size
- [ ] Add proper meta tags for SEO
- [ ] Implement structured data
- [ ] Run Lighthouse audits and fix issues

### Checkpoint 7.2: Testing & Quality Assurance
- [ ] Cross-browser compatibility testing
- [ ] Mobile responsiveness verification
- [ ] Form submission testing
- [ ] 404 page setup
- [ ] Accessibility compliance check

### Checkpoint 7.3: Deployment
- [ ] Final build verification
- [ ] Deploy to production environment
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Implement redirects from old URLs

---

## Agent Instructions

### Marketing Background Agent Instructions
**Objective**: Analyze Ciprian's professional brand and create compelling marketing copy

**Tasks**:
1. **Brand Analysis**
   - Review Ciprian's entrepreneurial journey (WISK, OMsignal, IdeaPlaces)
   - Identify unique value propositions
   - Define target audience (investors, potential clients, partners)
   - Analyze competitor portfolios in the tech entrepreneurship space

2. **Content Creation**
   - Write compelling hero section tagline and subtitle
   - Create project descriptions that highlight business impact
   - Develop "hire me" value proposition
   - Write meta descriptions for SEO
   - Create social media bio variations

3. **Messaging Strategy**
   - Define key messages for different audience segments
   - Create elevator pitch variations
   - Develop testimonial requests for past clients/partners
   - Plan content for future blog posts

### Researcher Agent Instructions
**Objective**: Research user needs and industry best practices for tech entrepreneur portfolios

**Research Areas**:
1. **User Experience Research**
   - Analyze what VCs/investors look for in founder portfolios
   - Study successful tech entrepreneur websites
   - Research portfolio conversion optimization
   - Identify key decision factors for fractional CTO hiring

2. **Technical Research**
   - Best practices for portfolio performance
   - Modern web accessibility standards
   - SEO strategies for personal brands
   - Analytics and tracking recommendations

3. **Competitive Analysis**
   - Analyze 10 top tech entrepreneur portfolios
   - Document common features and patterns
   - Identify differentiation opportunities
   - Research emerging portfolio trends

**Deliverables**:
- User persona documentation
- Feature priority matrix
- Competitive analysis report
- SEO keyword research

### Feature Planning Agent Instructions
**Objective**: Plan the portfolio roadmap and future enhancements

**Immediate Features (MVP)**:
1. Core portfolio with 6 project showcases
2. Interactive resume/CV section
3. Contact form with email integration
4. Responsive design with dark mode
5. Basic analytics integration

**Phase 2 Features (Post-Launch)**:
1. Blog with technical articles
2. Newsletter subscription
3. Testimonials section
4. Speaking engagements showcase
5. Downloadable resume PDF
6. Case study deep-dives

**Phase 3 Features (Growth)**:
1. Interactive project demos
2. Video introductions
3. Booking calendar integration
4. Client portal access
5. Resource library
6. Podcast/media appearances section

**Roadmap Planning Tasks**:
1. Create feature specifications
2. Define success metrics for each feature
3. Estimate development timelines
4. Plan A/B testing strategies
5. Create maintenance schedule
6. Plan content update workflow

---

## Success Criteria
1. Site loads in under 2 seconds
2. Mobile-first responsive design
3. 90+ Lighthouse performance score
4. All projects properly showcased with images
5. Contact form functional with email delivery
6. SEO optimized with proper meta tags
7. Professional design maintaining minimalist aesthetic
8. Easy content management for future updates

## Timeline Estimate
- Phase 1-2: 2-3 days (Setup & Configuration)
- Phase 3-4: 5-7 days (Component Development & Content)
- Phase 5-6: 3-4 days (Additional Features)
- Phase 7: 2-3 days (Optimization & Launch)

**Total: 12-17 days for complete migration**