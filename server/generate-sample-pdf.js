const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '..', 'sample-website-seo.pdf');
const doc = new PDFDocument({ margin: 60 });
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// ─── Page 1: Homepage ───
doc.fontSize(24).font('Helvetica-Bold').text('TechNova Solutions', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(12).font('Helvetica').fillColor('#666666')
   .text('www.technovasolutions.com', { align: 'center' });
doc.moveDown(2);

doc.fillColor('#000000').fontSize(18).font('Helvetica-Bold')
   .text('Homepage Content');
doc.moveDown(0.5);
doc.fontSize(11).font('Helvetica').text(
  'TechNova Solutions is a leading provider of cloud-based project management and team collaboration software designed for small and medium-sized businesses. Our platform helps over 10,000 teams worldwide streamline their workflows, track projects in real-time, and deliver results faster.'
);
doc.moveDown();
doc.text(
  'Founded in 2020, we have rapidly grown to become a trusted name in the SaaS industry. Our mission is to make enterprise-grade project management accessible to every team, regardless of size or budget. We believe that great software should be simple, powerful, and affordable.'
);
doc.moveDown(1.5);

doc.fontSize(18).font('Helvetica-Bold').text('Key Features');
doc.moveDown(0.5);
doc.fontSize(11).font('Helvetica');
const features = [
  'Real-time project dashboards with drag-and-drop Kanban boards',
  'Time tracking and resource allocation tools',
  'Automated reporting and analytics',
  'Team chat and file sharing integrated into every project',
  'Integrations with Slack, GitHub, Jira, and 50+ tools',
  'Mobile apps for iOS and Android',
  'Role-based access control and SSO support',
];
features.forEach(f => doc.text(`• ${f}`).moveDown(0.3));

// ─── Page 2: About & Pricing ───
doc.addPage();
doc.fontSize(18).font('Helvetica-Bold').text('About Us');
doc.moveDown(0.5);
doc.fontSize(11).font('Helvetica').text(
  'TechNova Solutions was founded by Sarah Chen and Marcus Rivera, two former project managers who were frustrated by the complexity and cost of existing tools. They set out to build a platform that teams actually enjoy using.'
);
doc.moveDown();
doc.text(
  'Today, TechNova serves customers in 45 countries, from freelance designers to 500-person engineering teams. Our customer satisfaction score is 4.8/5.0 and our annual churn rate is under 3%, among the lowest in the industry.'
);
doc.moveDown(1.5);

doc.fontSize(18).font('Helvetica-Bold').text('Pricing');
doc.moveDown(0.5);
doc.fontSize(11).font('Helvetica');
doc.text('Free Plan: Up to 5 users, 3 projects, basic features');
doc.text('Pro Plan: $12/user/month — unlimited projects, advanced analytics, integrations');
doc.text('Enterprise Plan: Custom pricing — SSO, dedicated support, SLA guarantees');
doc.moveDown(1.5);

doc.fontSize(18).font('Helvetica-Bold').text('Current SEO Issues (Internal Audit)');
doc.moveDown(0.5);
doc.fontSize(11).font('Helvetica');
const issues = [
  'Homepage is missing an H1 tag — the main heading is wrapped in a <div>',
  'Meta descriptions are identical across 12 pages',
  'Blog section has only 8 posts (competitors average 60+)',
  'No schema markup (Organization, Product, FAQ)',
  'Images lack alt text on 40% of pages',
  'Core Web Vitals: LCP is 3.8s (should be < 2.5s), CLS is 0.18 (should be < 0.1)',
  'No internal linking strategy — orphan pages found',
  'Mobile page speed score: 52/100',
  'No sitemap.xml submitted to Google Search Console',
  'Canonical tags missing on paginated blog pages',
];
issues.forEach((issue, i) => doc.text(`${i + 1}. ${issue}`).moveDown(0.3));

// ─── Page 3: Content & Competitors ───
doc.addPage();
doc.fontSize(18).font('Helvetica-Bold').text('Content Strategy Notes');
doc.moveDown(0.5);
doc.fontSize(11).font('Helvetica').text(
  'Target Keywords (from initial research):'
);
doc.moveDown(0.3);
const keywords = [
  'project management software for small teams',
  'affordable project management tool',
  'team collaboration platform',
  'kanban board software',
  'free project management app',
  'best project tracking tool 2025',
  'SaaS project management',
  'remote team management software',
];
keywords.forEach(k => doc.text(`• "${k}"`).moveDown(0.2));
doc.moveDown();

doc.fontSize(18).font('Helvetica-Bold').text('Competitor Analysis');
doc.moveDown(0.5);
doc.fontSize(11).font('Helvetica');
doc.text('Asana: 200+ blog posts, strong SEO, domain authority 89');
doc.text('Monday.com: Heavy PPC spend, 150+ landing pages, DA 85');
doc.text('Trello: Community-driven content, 300+ template pages, DA 91');
doc.text('ClickUp: Aggressive content marketing, 400+ articles, DA 82');
doc.moveDown();
doc.text(
  'Gap Analysis: TechNova has no comparison pages (e.g., "TechNova vs Asana"), no use-case landing pages, no customer case studies published, and no resource center or knowledge base.'
);
doc.moveDown(1.5);

doc.fontSize(18).font('Helvetica-Bold').text('Technical Stack');
doc.moveDown(0.5);
doc.fontSize(11).font('Helvetica');
doc.text('Frontend: React 18, Next.js 14 (SSR enabled)');
doc.text('Backend: Node.js, Express, PostgreSQL');
doc.text('Hosting: AWS (CloudFront CDN, S3 for static assets)');
doc.text('Analytics: Google Analytics 4, Mixpanel');
doc.text('CMS: Contentful (for blog)');

doc.end();

stream.on('finish', () => {
  console.log(`✅ Sample PDF created at: ${outputPath}`);
  console.log(`   File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
  console.log(`   Pages: 3`);
});
