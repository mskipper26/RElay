import Parse from './parseClient';

export const redeemInvite = async (inviteCode, username, password) => {
    try {
        // Cloud code handles validation, user creation, and friend linking
        const sessionToken = await Parse.Cloud.run('redeemInvite', {
            code: inviteCode,
            username,
            password
        });

        // Log in the new user using the returned session token
        return await Parse.User.become(sessionToken);

    } catch (error) {
        console.error('Error redeeming invite:', error);
        throw error;
    }
};

export const generateInvite = async () => {
    return await Parse.Cloud.run('generateInvite');
};

export const login = async (username, password) => {
    try {
        const user = await Parse.User.logIn(username, password);
        return user;
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
};
