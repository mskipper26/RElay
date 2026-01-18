import Parse from './parseClient';

export const getMailbox = async () => {
    const user = Parse.User.current();
    if (!user) return [];

    const Letter = Parse.Object.extend('Letter');

    // Folder = 'inbox' OR (No Folder AND isArchived=false)
    const q1 = new Parse.Query(Letter);
    q1.equalTo('folder', 'inbox');

    const q2 = new Parse.Query(Letter);
    q2.doesNotExist('folder');
    q2.equalTo('isArchived', false);

    const query = Parse.Query.or(q1, q2);
    query.equalTo('recipient', user);

    query.include('content');
    query.include('sender');
    query.include('content.originalAuthor');
    query.include('previousSender');
    query.descending('createdAt');

    const results = await query.find();

    return results
        .map(l => {
            try {
                if (!l || !l.get) return null;
                const content = l.get('content');
                const sender = l.get('sender');

                if (!content || !content.get || !sender || !sender.get) return null;

                const orig = content.get('originalAuthor');
                const prev = l.get('previousSender');
                return {
                    id: l.id,
                    contentId: content.id,
                    subject: content.get('subject'),
                    body: content.get('body'),
                    images: content.get('images'),
                    sender: sender.get('username'),
                    previousSender: (prev && prev.get) ? prev.get('username') : null,
                    previousSenderId: (prev && prev.id) ? prev.id : null,
                    receivedAt: l.createdAt,
                    chainIndex: l.get('chainIndex') || 1,
                    originalAuthor: (orig && orig.get) ? orig.get('username') : 'Unknown'
                };
            } catch (e) {
                console.error('Error parsing letter:', e);
                return null;
            }
        })
        .filter(l => l !== null);
};

export const getArchive = async () => {
    const user = Parse.User.current();
    if (!user) return [];

    const Letter = Parse.Object.extend('Letter');

    // Folder = 'archive' OR (No Folder AND isArchived=true)
    const q1 = new Parse.Query(Letter);
    q1.equalTo('folder', 'archive');

    const q2 = new Parse.Query(Letter);
    q2.doesNotExist('folder');
    q2.equalTo('isArchived', true);

    const query = Parse.Query.or(q1, q2);
    query.equalTo('recipient', user);

    query.include('content');
    query.include('sender');
    query.include('content.originalAuthor');
    query.descending('createdAt');

    const results = await query.find();

    return results
        .filter(l => l.get('content') && l.get('sender'))
        .map(l => {
            const content = l.get('content');
            const orig = content.get('originalAuthor');
            return {
                id: l.id,
                contentId: content.id,
                subject: content.get('subject'),
                body: content.get('body'),
                images: content.get('images'),
                sender: l.get('sender').get('username'),
                receivedAt: l.createdAt,
                chainIndex: l.get('chainIndex') || 1,
                originalAuthor: orig ? orig.get('username') : 'Unknown'
            };
        });
};

export const getSent = async () => {
    // Reimplemented to fetch my authored content
    const sentItems = await Parse.Cloud.run('getSentBox');

    // Map to Letter shape compatibility
    return sentItems.map(item => ({
        id: item.id,
        contentId: item.contentId,
        subject: item.subject,
        body: item.body,
        images: item.images,
        sender: 'You', // Display as "From: You"
        realSender: item.originalAuthor,
        receivedAt: item.createdAt,
        chainIndex: 0,
        originalAuthor: item.originalAuthor
    }));
};

export const createLetter = async (data) => {
    // data: { subject, body, images, recipients, keepCopy }
    return await Parse.Cloud.run('compose', data);
};

export const forwardLetter = async (letterId, targetUsernames, comment, archiveCopy) => {
    return await Parse.Cloud.run('forward', {
        letterId,
        targetUsernames,
        commentText: comment,
        archiveCopy
    });
};

export const burnLetter = async (letterId) => {
    return await Parse.Cloud.run('burn', { letterId });
};

export const getComments = async (contentId) => {
    return await Parse.Cloud.run('getComments', { contentId });
};

// Fetch friends (using Friend class)
// Fetch friends (using Cloud Function for reliability)
export const getFriends = async () => {
    return await Parse.Cloud.run('getFriends');
};

export const removeFriend = async (targetUserId) => {
    return await Parse.Cloud.run('removeFriend', { targetUserId });
};

export const sendFriendRequest = async (targetUserId) => {
    return await Parse.Cloud.run('sendFriendRequest', { targetUserId });
};

export const respondToFriendRequest = async (requestId, action) => {
    return await Parse.Cloud.run('respondToFriendRequest', { requestId, action });
};

export const getFriendRequests = async () => {
    const user = Parse.User.current();
    if (!user) return [];

    const FriendRequest = Parse.Object.extend('FriendRequest');
    const query = new Parse.Query(FriendRequest);
    query.equalTo('toUser', user);
    query.equalTo('status', 'pending');
    query.include('fromUser');
    query.descending('createdAt');

    const results = await query.find();

    return results.map(r => ({
        id: r.id,
        type: 'request',
        fromUser: r.get('fromUser') ? r.get('fromUser').get('username') : 'Unknown',
        fromUserId: r.get('fromUser') ? r.get('fromUser').id : null,
        createdAt: r.createdAt
    }));
};
