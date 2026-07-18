const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Handlebars = require('handlebars');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

function buildLdJson(business) {
  const baseUrl = business.url;
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'LodgingBusiness',
          '@id': `${baseUrl}#lodging`,
          name: business.name,
          description: business.description,
          url: baseUrl,
          image: business.images.map((image) => `${baseUrl}assets/${image}`),
          logo: `${baseUrl}assets/${business.logo}`,
          telephone: business.telephone,
          email: business.email,
          priceRange: business.priceRange,
          address: {
            '@type': 'PostalAddress',
            ...business.address,
          },
          geo: {
            '@type': 'GeoCoordinates',
            ...business.geo,
          },
          amenityFeature: business.amenities.map((name) => ({
            '@type': 'LocationFeatureSpecification',
            name,
            value: true,
          })),
        },
        {
          '@type': 'EventVenue',
          '@id': `${baseUrl}#venue`,
          name: `${business.name} — Wedding & Conference Venue`,
          description: 'Heritage country-house setting for weddings, celebrations, small conferences and retreats near Martinborough, Wairarapa.',
          url: baseUrl,
          image: `${baseUrl}assets/${business.images[0]}`,
          telephone: business.telephone,
          address: { '@id': `${baseUrl}#lodging` },
          geo: { '@id': `${baseUrl}#lodging` },
        },
      ],
    },
    null,
    2
  );
}

function registerPartials() {
  const partialsDir = path.join(ROOT, 'templates', 'partials');
  for (const file of fs.readdirSync(partialsDir)) {
    const name = path.basename(file, '.hbs');
    Handlebars.registerPartial(name, fs.readFileSync(path.join(partialsDir, file), 'utf8'));
  }
}

function build() {
  const data = yaml.load(fs.readFileSync(path.join(ROOT, 'content', 'site.yaml'), 'utf8'));

  registerPartials();
  const template = Handlebars.compile(fs.readFileSync(path.join(ROOT, 'templates', 'page.hbs'), 'utf8'));
  const html = template({ ...data, ldJson: buildLdJson(data.business) });

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  fs.writeFileSync(path.join(DIST, 'index.html'), html);
  fs.copyFileSync(path.join(ROOT, 'robots.txt'), path.join(DIST, 'robots.txt'));
  fs.copyFileSync(path.join(ROOT, 'sitemap.xml'), path.join(DIST, 'sitemap.xml'));
  fs.cpSync(path.join(ROOT, 'assets'), path.join(DIST, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'CNAME'), `${new URL(data.business.url).hostname}\n`);
  fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

  console.log(`Built ${path.relative(ROOT, DIST)}/`);
}

build();
