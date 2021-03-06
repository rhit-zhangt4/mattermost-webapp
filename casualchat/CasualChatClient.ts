// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Emoji, CustomEmoji} from 'mattermost-redux/types/emojis';
import {UserProfile} from 'mattermost-redux/types/users';
import {Client4} from 'mattermost-redux/client';
import FormData from 'form-data';
import {buildQueryString} from 'mattermost-redux/utils/helpers';
import {isCustomEmoji} from 'mattermost-redux/utils/emoji_utils';

import * as Utils from 'utils/utils.jsx';

import {ExtRef} from './types';
// import UserProfile from 'components/user_profile/user_profile';

function getPrivateEmojisRoute() {
    return `${Client4.getEmojisRoute()}/private`;
}

export async function createPrivateEmoji(emoji: CustomEmoji, imageData: File): Promise<any> {
    Client4.trackEvent('api', 'api_emoji_custom_add_private');

    const formData = new FormData();
    formData.append('image', imageData);
    formData.append('emoji', JSON.stringify(emoji));
    const request: any = {
        method: 'post',
        body: formData,
    };

    if (formData.getBoundary) {
        request.headers = {
            'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
        };
    }

    return Client4.doFetch<CustomEmoji>(
        getPrivateEmojisRoute(),
        request,
    );
}

export function getEmojiUrl(emoji: Emoji): string {
    if (isCustomEmoji(emoji)) {
        const url = Client4.getCustomEmojiImageUrl(emoji.id);
        return url;
    }

    const filename = emoji.filename || emoji.aliases[0];
    return Client4.getSystemEmojiImageUrl(filename);
}

export async function getPrivateEmojis(userID: string, page: number, perPage: number, sort: string): Promise<Emoji[]> {
    const result = await Client4.doFetch<Emoji[]>(
        `${getPrivateEmojisRoute()}${buildQueryString({page, per_page: perPage, sort})}`,
        {method: 'get'},
    );
    if (result == null) {
        return Promise.resolve([]);
    }
    return Promise.resolve(result);
}

export async function searchPrivateEmoji(userID: string, term: string, options = {}): Promise<Emoji[]> {
    //TODO: After backend is finished
    // return Client4.doFetch<CustomEmoji[]>(
    //     `${Client4.getEmojisRoute()}/search`,
    //     {method: 'post', body: JSON.stringify({term, ...options})},
    // );
    //console.log('userId =', userID);
    //console.log('term =', term);
    //console.log('options =', options);
    if (userID && term && options) {
        //pass linter
    }
    return Promise.resolve([]);
}

export async function checkEmojiAccess(userid: string, emoji: Emoji|undefined): Promise<boolean> {
    if (emoji === undefined) {
        return false;
    }
    if (isCustomEmoji(emoji)) {
        const url = `${Client4.getEmojiRoute(emoji.id)}/checkprivate${buildQueryString({userid})}`;
        return Client4.doFetch<boolean>(
            url,
            {method: 'get'},
        );
    }
    return true;
}

export async function savePrivateEmoji(userid: string, emoji: Emoji|undefined): Promise<any> {
    if (emoji !== undefined && isCustomEmoji(emoji)) {
        const url = `${Client4.getEmojiRoute(emoji.id)}/save${buildQueryString({userid})}`;
        await Client4.doFetch<any>(
            url,
            {method: 'post'},
        );
    }
}

export async function deleteEmojiWithAccess(emojiId: string): Promise<any> {
    return Client4.doFetch<any>(
        `${Client4.getEmojiRoute(emojiId)}/withAccess`,
        {method: 'delete'},
    );
}

export async function removeEmojiAccess(emojiId: string): Promise<any> {
    return Client4.doFetch<any>(
        `${Client4.getEmojiRoute(emojiId)}/access`,
        {method: 'delete'},
    );
}

export async function linkAccount(externalPlatform: string, externalId: string): Promise<any> {
    return Client4.doFetch<any>(
        `${Client4.getBaseRoute()}/extchat/${externalPlatform}/linkAccount${buildQueryString({externalId})}`,
        {method: 'post'},
    );
}

export async function getAliasId(externalPlatform: string, externalId: string, username: string): Promise<string> {
    return Client4.doFetch<string>(
        `${Client4.getBaseRoute()}/extchat/${externalPlatform}/aliasUserId${buildQueryString({externalId, username})}`,
        {method: 'get'},
    );
}

export async function getExtRefByChannel(channelId: string): Promise<ExtRef|null> {
    const ref = await Client4.doFetch<ExtRef>(
        `${Client4.getBaseRoute()}/extchat/any/refByChannel${buildQueryString({channelId})}`,
        {method: 'get'},
    );
    if (!ref.external_platform) {
        return null;
    }
    return ref;
}

export async function postToExtChannel(channelId: string, userId: string, message: string): Promise<any> {
    const time = Utils.getTimestamp();
    const post = {
        file_ids: [],
        message,
        user_id: userId,
        channel_id: channelId,
        pending_post_id: `${userId}:${time}`,
        create_at: time,
        parent_id: null,
        metadata: {},
        props: {
            mentionHighlightDisabled: false,
            disable_group_highlight: false,
        },
    };
    return Client4.doFetch<any>(
        `${Client4.getBaseRoute()}/extchat/any/post`,
        {
            method: 'post',
            body: JSON.stringify(post),
        },
    );
}

export async function getExtChannelByExternalId(platform: string, externalId: string): Promise<string> {
    const result = await Client4.doFetch<{channelId: string}>(
        `${Client4.getBaseRoute()}/extchat/${platform}/channel${buildQueryString({externalId})}`,
        {
            method: 'get'
        }
    );
    return result.channelId;
}

export async function getFriends(userID: string, page: number, perPage: number, sort: string): Promise<UserProfile[]> {
    const result = await Client4.doFetch<UserProfile[]>(
        `${Client4.getUsersRoute()}${buildQueryString({page, per_page: perPage, sort})}`,
        {method: 'get'},
    );
    if (result == null) {
        return Promise.resolve([]);
    }
    return Promise.resolve(result);
// return Promise.resolve([]);
}

export async function searchFriend(userID: string, term: string, options = {}): Promise<UserProfile[]> {
    //TODO: After backend is finished
    // return Client4.doFetch<CustomEmoji[]>(
    //     `${Client4.getEmojisRoute()}/search`,
    //     {method: 'post', body: JSON.stringify({term, ...options})},
    // );
    //console.log('userId =', userID);
    //console.log('term =', term);
    //console.log('options =', options);
    if (userID && term && options) {
        //pass linter
    }
    return Promise.resolve([]);
}

export async function deleteFriend(friendId: string): Promise<any> {
    return Client4.doFetch<any>(
        `${Client4.getEmojiRoute(friendId)}`,
        {method: 'delete'},
    );
}

export async function getRequests(requestID: string, page: number, perPage: number, sort: string): Promise<UserProfile[]> {
    // const result = await Client4.doFetch<UserProfile[]>(
    //     `${Client4.getUsersRoute()}${buildQueryString({page, per_page: perPage, sort})}`,
    //     {method: 'get'},
    // );
    // if (result == null) {
    //     return Promise.resolve([]);
    // }
    // return Promise.resolve(result);
    return Promise.resolve([]);
}

export async function searchRequest(requestID: string, term: string, options = {}): Promise<UserProfile[]> {
    //TODO: After backend is finished
    // return Client4.doFetch<CustomEmoji[]>(
    //     `${Client4.getEmojisRoute()}/search`,
    //     {method: 'post', body: JSON.stringify({term, ...options})},
    // );
    //console.log('userId =', userID);
    //console.log('term =', term);
    //console.log('options =', options);
    if (requestID && term && options) {
        //pass linter
    }
    return Promise.resolve([]);
}

export async function acceptRequest(requestId: string): Promise<any> {
    return Client4.doFetch<any>(
        `${Client4.getEmojiRoute(requestId)}`,
        {method: 'delete'},
    );
}

export async function deleteRequest(requestId: string): Promise<any> {
    return Client4.doFetch<any>(
        `${Client4.getEmojiRoute(requestId)}`,
        {method: 'delete'},
    );
}

export default {
    createPrivateEmoji,
    getEmojiUrl,
    getPrivateEmojis,
    searchPrivateEmoji,
    checkEmojiAccess,
    savePrivateEmoji,
    deleteEmojiWithAccess,
    removeEmojiAccess,
    getAliasId,
    getExtRefByChannel,
    postToExtChannel,
    getExtChannelByExternalId,

    getFriends,
    searchFriend,
    deleteFriend,

    getRequests,
    searchRequest,
    acceptRequest,
    deleteRequest,
};
