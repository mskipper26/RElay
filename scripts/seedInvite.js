import Parse from 'parse/node.js';

const PARSE_APP_ID = 'relay_app_2026';
const PARSE_SERVER_URL = 'http://localhost:1337/parse';

const PARSE_MASTER_KEY = 'ytrewasdflkj';

Parse.initialize(PARSE_APP_ID, null, PARSE_MASTER_KEY);
Parse.serverURL = PARSE_SERVER_URL;

async function seedInvite() {
    try {
        const InviteCode = Parse.Object.extend('InviteCode');
        const query = new Parse.Query(InviteCode);
        query.equalTo('code', 'GENESIS');
        const exists = await query.first({ useMasterKey: true });

        if (exists) {
            console.log('GENESIS invite code already exists.');
            return;
        }

        const invite = new InviteCode();
        invite.set('code', 'GENESIS');
        invite.set('isUsed', false);

        await invite.save(null, { useMasterKey: true });
        console.log('Successfully created GENESIS invite code.');

    } catch (error) {
        console.error('Error seeding invite:', error);
    }
}

seedInvite();
