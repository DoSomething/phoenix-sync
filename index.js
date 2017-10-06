require('dotenv').config();

const MANAGEMENT_TOKEN = process.env.MANAGEMENT_TOKEN;
const PRODUCTION_SPACE_ID = process.env.PRODUCTION_SPACE_ID;
const STAGING_SPACE_ID = process.env.STAGING_SPACE_ID;

[MANAGEMENT_TOKEN, PRODUCTION_SPACE_ID, STAGING_SPACE_ID].forEach(env => {
  if (! env) {
    console.warn(`Missing env value for ${env}`);
  }
});

const fs = require('fs');
const EXPORT_DIR = `${__dirname}/tmp`;

const contentfulManagement = require('contentful-management');
const contentfulClient = contentfulManagement.createClient({
  accessToken: MANAGEMENT_TOKEN,
});

const contentfulExport = require('contentful-export');
const exportOptions = {
  spaceId: PRODUCTION_SPACE_ID,
  managementToken: MANAGEMENT_TOKEN,
  exportDir: EXPORT_DIR,
};

const contentfulImport = require('contentful-import');
const importOptions = {
  spaceId: STAGING_SPACE_ID,
  managementToken: MANAGEMENT_TOKEN,
};

function unpublishAndDelete(item, container, space) {
  const errorHandler = (err) => {
    if (err && err.message && err.message.indexOf('Not published') !== -1) {
      return;
    }
    console.error(err);
  };

  return new Promise(async (resolve) => {
    if (! item) {
      return resolve();
    }

    await item.unpublish().catch(errorHandler);
    await item.delete().catch(errorHandler);

    if (container.length === 0) {
      return resolve();
    }

    return resolve(unpublishAndDelete(container.shift(), container, space));
  });
}

function getAllItemsAndClear(space, method) {
  function fetch(config = {}) {
    let allItems = [];

    return new Promise(async (resolve) => {
      const { total, skip, limit, items } = await space[method](config);

      if (total === 0) {
        return resolve(allItems);
      }

      allItems = [...allItems, ...items];

      if (skip + limit > total) {
        return resolve(allItems);
      }

      return resolve(fetch({ skip: skip + limit }));
    });
  }

  return new Promise(async (resolve) => {
    const items = await fetch();

    if (! items) {
      return resolve();
    }

    resolve(unpublishAndDelete(items.shift(), items, space));
  });
}

function getExportFilename() {
  const files = fs.readdirSync(EXPORT_DIR);
  const filename = files.find(file => file.includes('contentful-export'));

  return `${EXPORT_DIR}/${filename}`;
}


console.info('Exporting production contentful data...');

contentfulExport(exportOptions)
  .then(() => contentfulClient.getSpace(STAGING_SPACE_ID))
  .then(async (space) => {
    console.info('Clearing staging space...');

    console.info(' - Deleting assets');
    await getAllItemsAndClear(space, 'getAssets');

    console.info(' - Deleting entries');
    await getAllItemsAndClear(space, 'getEntries');

    console.info(' - Deleting content types');
    await getAllItemsAndClear(space, 'getContentTypes');
  })
  .then(async () => {
    console.info('Importing prod data to staging space...');

    const fileName = getExportFilename();

    importOptions.contentFile = fileName;
    await contentfulImport(importOptions);

    console.info('Import complete, erasing tmp files...');
    fs.unlinkSync(fileName);
  });
