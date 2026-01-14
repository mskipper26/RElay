import Parse from './parseClient';

export const redeemInvite = async (inviteCode, username, password) => {
    try {
        // 1. Query the InviteCode class
        const InviteCode = Parse.Object.extend('InviteCode');
        const query = new Parse.Query(InviteCode);
        query.equalTo('code', inviteCode);
        query.equalTo('isUsed', false);
        query.include('createdBy'); // Important to get the inviter

        const invite = await query.first();

        if (!invite) {
            throw new Error('Invalid or used invite code.');
        }

        const inviter = invite.get('createdBy');

        // 2. Sign up the new user
        const user = new Parse.User();
        user.set('username', username);
        user.set('password', password);
        // Explicitly link the invite used (optional but good for tracking)
        user.set('invitedBy', inviter);

        await user.signUp();

        // 3. Create Double-Sided Friendship
        const currentUser = Parse.User.current();
        if (inviter) {
            // Add inviter to new user's friends
            const userFriends = currentUser.relation('friends');
            userFriends.add(inviter);
            // We must save the current user to persist the relation update
            await currentUser.save();

            // Note: Modifying the inviter (adding new user to their friends) logic 
            // is placed here, but in production this should be in Cloud Code 
            // to avoid ACL write permission errors on the 'inviter' object.
            // For this prototype, if ACLs allow public write (not recommended), this works.
            // Otherwise, this part will fail if not done via Cloud Code.
            // We will attempt it, but catch errors silently or rely on Cloud Code.
            try {
                const inviterFriends = inviter.relation('friends');
                inviterFriends.add(currentUser);
                await inviter.save(null, { useMasterKey: true }); // Client usage of master key is unsafe, strictly for dev/prototype if enabled on server
            } catch (err) {
                console.warn('Could not update inviter friends relation (likely ACL restricted). This should be done in Cloud Code.', err);
            }
        }

        // 4. Mark invite as used
        invite.set('isUsed', true);
        invite.set('usedBy', currentUser);
        await invite.save();

        return currentUser;

    } catch (error) {
        console.error('Error redeeming invite:', error);
        throw error;
    }
};
