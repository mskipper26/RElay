import Parse from './parseClient';

export const getMailbox = async () => {
    const currentUser = Parse.User.current();
    if (!currentUser) throw new Error('User not authenticated');

    const Letter = Parse.Object.extend('Letter');
    const query = new Parse.Query(Letter);

    // "Query the Letter class where currentHolders includes the currentUser"
    query.equalTo('currentHolders', currentUser);

    // Include Originator for UI
    query.include('originator');

    // Sort by most recent
    query.descending('createdAt');

    return await query.find();
};

export const getArchive = async () => {
    const currentUser = Parse.User.current();
    if (!currentUser) throw new Error('User not authenticated');

    const Letter = Parse.Object.extend('Letter');
    const query = new Parse.Query(Letter);

    // "Query the Letter class for letters where the user is in the archivedBy field"
    query.equalTo('archivedBy', currentUser);

    // Limit 10
    query.limit(10);
    query.descending('updatedAt'); // Usually archive sort by when it was added or updated

    return await query.find();
};

export const createLetter = async (subject, body, images = []) => {
    const currentUser = Parse.User.current();
    if (!currentUser) throw new Error('User not authenticated');

    const Letter = Parse.Object.extend('Letter');
    const letter = new Letter();

    letter.set('subject', subject);
    letter.set('body', body);
    letter.set('images', images); // Assuming array of Parse.File or strings
    letter.set('originator', currentUser);
    // Initial holder is the creator (until they send it off?)
    // "Create a new Letter object... and add the currentUser to currentHolders"
    letter.set('currentHolders', [currentUser]);
    letter.set('chainCount', 0); // Initialize chain count
    letter.set('comments', []); // Initialize comments

    return await letter.save();
};
