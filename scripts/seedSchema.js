import Parse from 'parse/node.js';

const PARSE_APP_ID = 'relay_app_2026';
const PARSE_SERVER_URL = 'http://localhost:1337/parse';
const PARSE_MASTER_KEY = 'ytrewasdflkj';

Parse.initialize(PARSE_APP_ID, null, PARSE_MASTER_KEY);
Parse.serverURL = PARSE_SERVER_URL;

async function seedSchema() {
    try {
        console.log('Seeding Schema...');

        // 1. Define Letter Schema
        const schema = new Parse.Schema('Letter');

        // Check if class exists
        try {
            await schema.get();
            console.log('Letter class already exists. Updating Permissions...');
        } catch (e) {
            console.log('Creating Letter class...');
            schema.addString('subject');
            schema.addString('body');
            schema.addArray('images');
            schema.addPointer('originator', '_User');
            schema.addArray('currentHolders'); // Array of arbitrary objects or pointers? usually better to be explicit but Array is generic
            schema.addNumber('chainCount');
            schema.addArray('comments');
            schema.addArray('archivedBy');
        }

        // 2. Set CLP (Class Level Permissions)
        // Allow Public Read/Write for now to unblock, or Authenticated Read/Write
        const clp = {
            get: { '*': true },
            find: { '*': true },
            create: { '*': true }, // Authenticated users can create
            update: { '*': true },
            delete: { '*': true },
            addField: { '*': true } // Allow dynamic schema updates if needed
        };
        schema.setCLP(clp);

        await schema.save(); // save() creates or updates
        console.log('Letter Schema updated successfully.');

    } catch (error) {
        console.error('Error seeding schema:', error);
    }
}

seedSchema();
