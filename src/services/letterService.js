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
    query.notEqualTo('isBurned', true);

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
                    commentCount: content.get('commentCount') || 0,
                    sender: sender.get('username'),
                    previousSender: (prev && prev.get) ? prev.get('username') : null,
                    previousSenderId: (prev && prev.id) ? prev.id : null,
                    receivedAt: l.createdAt,
                    chainIndex: l.get('chainIndex') || 1,
                    receivedAt: l.createdAt,
                    chainIndex: l.get('chainIndex') || 1,
                    originalAuthor: (orig && orig.get) ? orig.get('username') : 'Unknown',
                    read: !!l.get('read') // Permissive check (truthy is enough)
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
    query.notEqualTo('isBurned', true);

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
                chainIndex: l.get('chainIndex') || 1,
                originalAuthor: orig ? orig.get('username') : 'Unknown',
                read: !!l.get('read')
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
        commentCount: item.commentCount || 0,
        sender: 'You', // Display as "From: You"
        realSender: item.originalAuthor,
        recipients: item.recipients, // Pass the array of usernames
        receivedAt: item.createdAt,
        chainIndex: 0,
        originalAuthor: item.originalAuthor
    }));
};

export const createLetter = async (data) => {
    // data: { subject, body, images, recipients, keepCopy }
    return await Parse.Cloud.run('compose', data);
};

// --- Image Library ---

export const saveImageToLibrary = async (file) => {
    // 1. Save the File
    const parseFile = new Parse.File(file.name, file);
    await parseFile.save();

    // 2. Create Image Record
    const ImageObject = Parse.Object.extend('Image');
    const imageRecord = new ImageObject();
    imageRecord.set('user', Parse.User.current());
    imageRecord.set('file', parseFile);
    imageRecord.setACL(new Parse.ACL(Parse.User.current()));

    await imageRecord.save();
    return {
        url: parseFile.url(),
        id: imageRecord.id,
        file: parseFile
    };
};

export const getRecentImages = async (limit = 20) => {
    const ImageObject = Parse.Object.extend('Image');
    const query = new Parse.Query(ImageObject);
    query.equalTo('user', Parse.User.current());
    query.descending('createdAt');
    query.limit(limit);
    const results = await query.find();
    return results.map(img => ({
        id: img.id,
        url: img.get('file').url(),
        file: img.get('file'), // Return the Parse.File object for reuse
        createdAt: img.createdAt
    }));
};

// ---------------------

export const saveDraft = async ({ draftId, subject, body, images }) => {
    return await Parse.Cloud.run('saveDraft', {
        draftId,
        subject,
        body,
        images
    });
};

export const getDrafts = async () => {
    const Draft = Parse.Object.extend('Draft');
    const query = new Parse.Query(Draft);
    query.include('content');
    query.descending('updatedAt');
    const results = await query.find();

    return results.map(d => {
        const c = d.get('content');
        return {
            id: d.id, // Draft ID for resuming
            contentId: c.id,
            subject: c.get('subject'),
            body: c.get('body'),
            images: c.get('images'),
            updatedAt: d.updatedAt,
            sender: 'Draft',
            chainIndex: 0,
            read: c.get('read') === 'read' // Actually drafts don't have read status on content usually, but checking.
        };
    });
};

export const markAsRead = async (letterId) => {
    const Letter = Parse.Object.extend('Letter');
    const letter = new Letter();
    letter.id = letterId;
    letter.set('read', 'read');
    await letter.save();
};

export const deleteDraft = async (draftId) => {
    return await Parse.Cloud.run('deleteDraft', { draftId });
};

export const forwardLetter = async (letterId, targetUsernames, comment, archiveCopy) => {
    return await Parse.Cloud.run('forward', {
        letterId,
        targetUsernames,
        commentText: comment,
        archiveCopy
    });
};

export const burnLetter = async (letterId, comment) => {
    return await Parse.Cloud.run('burn', { letterId, commentText: comment });
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

export const checkFriendStatus = async (targetUserId) => {
    return await Parse.Cloud.run('checkFriendStatus', { targetUserId });
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

export const getProfileStats = async (targetUserId = null) => {
    return await Parse.Cloud.run('getProfileStats', { targetUserId });
};

export const redeemFriendCode = async (code) => {
    return await Parse.Cloud.run('redeemFriendCode', { code });
};
