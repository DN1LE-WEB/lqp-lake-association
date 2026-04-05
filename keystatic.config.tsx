import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
  storage: import.meta.env.DEV
    ? { kind: 'local' }
    : {
        kind: 'github',
        repo: 'DN1LE-WEB/lqp-lake-association',
      },
  ui: {
    brand: {
      name: 'LQP Lake Association',
    },
  },
  singletons: {
    siteSettings: singleton({
      label: 'Site Settings',
      path: 'src/content/settings',
      schema: {
        siteName: fields.text({ label: 'Site Name', validation: { isRequired: true } }),
        tagline: fields.text({ label: 'Tagline' }),
        description: fields.text({ label: 'Site Description', multiline: true }),
        contactEmail: fields.text({ label: 'Contact Email' }),
        mailingAddress: fields.text({ label: 'Mailing Address', multiline: true }),
        facebookUrl: fields.url({ label: 'Facebook URL' }),
        phone: fields.text({ label: 'Phone Number' }),
      },
    }),
    homepage: singleton({
      label: 'Homepage',
      path: 'src/content/homepage',
      schema: {
        heroTitle: fields.text({ label: 'Hero Title', validation: { isRequired: true } }),
        heroSubtitle: fields.text({ label: 'Hero Subtitle', multiline: true }),
        heroImage: fields.image({
          label: 'Hero Image',
          directory: 'public/images/hero',
          publicPath: '/images/hero',
        }),
        welcomeTitle: fields.text({ label: 'Welcome Section Title' }),
        welcomeText: fields.document({
          label: 'Welcome Text',
          formatting: true,
          links: true,
          images: {
            directory: 'public/images/content',
            publicPath: '/images/content',
          },
        }),
        boardMembers: fields.text({ label: 'Board of Directors', multiline: true }),
        featuredImage: fields.image({
          label: 'Featured Image',
          directory: 'public/images/featured',
          publicPath: '/images/featured',
        }),
        announcements: fields.array(
          fields.object({
            title: fields.text({ label: 'Title', validation: { isRequired: true } }),
            content: fields.text({ label: 'Content', multiline: true }),
            image: fields.image({
              label: 'Image',
              directory: 'public/images/announcements',
              publicPath: '/images/announcements',
            }),
          }),
          {
            label: 'Announcements',
            itemLabel: (props) => props.fields.title.value || 'Announcement',
          }
        ),
      },
    }),
    about: singleton({
      label: 'Our Mission',
      path: 'src/content/about',
      schema: {
        title: fields.text({ label: 'Page Title', validation: { isRequired: true } }),
        content: fields.document({
          label: 'Content',
          formatting: true,
          links: true,
          images: {
            directory: 'public/images/content',
            publicPath: '/images/content',
          },
        }),
      },
    }),
    membership: singleton({
      label: 'Membership',
      path: 'src/content/membership',
      schema: {
        title: fields.text({ label: 'Page Title', validation: { isRequired: true } }),
        content: fields.document({
          label: 'Content',
          formatting: true,
          links: true,
        }),
        yearlyDues: fields.text({ label: 'Yearly Dues' }),
        applicationFileUrl: fields.text({ label: 'Application PDF URL' }),
      },
    }),
  },
  collections: {
    projects: collection({
      label: 'Lake Association Projects',
      slugField: 'title',
      path: 'src/content/projects/*',
      schema: {
        title: fields.slug({ name: { label: 'Title', validation: { isRequired: true } } }),
        description: fields.text({ label: 'Description', multiline: true }),
        date: fields.date({ label: 'Date' }),
        image: fields.image({
          label: 'Image',
          directory: 'public/images/projects',
          publicPath: '/images/projects',
        }),
        content: fields.document({
          label: 'Content',
          formatting: true,
          links: true,
          images: {
            directory: 'public/images/projects',
            publicPath: '/images/projects',
          },
        }),
        featured: fields.checkbox({ label: 'Featured on Homepage' }),
      },
    }),
    tournaments: collection({
      label: 'Walleye Tournaments',
      slugField: 'title',
      path: 'src/content/tournaments/*',
      schema: {
        title: fields.slug({ name: { label: 'Title', validation: { isRequired: true } } }),
        year: fields.integer({ label: 'Year', validation: { isRequired: true } }),
        annualNumber: fields.text({ label: 'Annual Number (e.g., 46th)' }),
        date: fields.date({ label: 'Tournament Date' }),
        description: fields.text({ label: 'Description', multiline: true }),
        content: fields.document({
          label: 'Details & Results',
          formatting: true,
          links: true,
          images: {
            directory: 'public/images/tournaments',
            publicPath: '/images/tournaments',
          },
        }),
        coverLetterUrl: fields.text({ label: 'Cover Letter Download URL' }),
        rulesUrl: fields.text({ label: 'Rules Download URL' }),
        liabilityUrl: fields.text({ label: 'Liability Waiver Download URL' }),
        resultsUrl: fields.text({ label: 'Results Spreadsheet URL' }),
      },
    }),
    fishingLeague: collection({
      label: 'Fishing League Seasons',
      slugField: 'title',
      path: 'src/content/fishing-league/*',
      schema: {
        title: fields.slug({ name: { label: 'Title', validation: { isRequired: true } } }),
        year: fields.integer({ label: 'Year', validation: { isRequired: true } }),
        resultsUrl: fields.text({ label: 'Results Spreadsheet URL' }),
        content: fields.document({
          label: 'Season Details & Results',
          formatting: true,
          links: true,
          images: {
            directory: 'public/images/fishing-league',
            publicPath: '/images/fishing-league',
          },
        }),
        weeks: fields.array(
          fields.object({
            weekNumber: fields.integer({ label: 'Week Number' }),
            label: fields.text({ label: 'Label' }),
            resultsUrl: fields.text({ label: 'Results URL' }),
          }),
          {
            label: 'Weekly Results',
            itemLabel: (props) => props.fields.label.value || `Week ${props.fields.weekNumber.value}`,
          }
        ),
      },
    }),
    gallery: collection({
      label: 'Photo Gallery',
      slugField: 'title',
      path: 'src/content/gallery/*',
      schema: {
        title: fields.slug({ name: { label: 'Title', validation: { isRequired: true } } }),
        description: fields.text({ label: 'Description' }),
        date: fields.date({ label: 'Date' }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Fishing', value: 'fishing' },
            { label: 'Tournament', value: 'tournament' },
            { label: 'Lake Views', value: 'lake-views' },
            { label: 'Events', value: 'events' },
            { label: 'Wildlife', value: 'wildlife' },
            { label: 'Projects', value: 'projects' },
          ],
          defaultValue: 'fishing',
        }),
        images: fields.array(
          fields.object({
            image: fields.image({
              label: 'Image',
              directory: 'public/images/gallery',
              publicPath: '/images/gallery',
              validation: { isRequired: true },
            }),
            caption: fields.text({ label: 'Caption' }),
          }),
          {
            label: 'Images',
            itemLabel: (props) => props.fields.caption.value || 'Image',
          }
        ),
      },
    }),
  },
});
