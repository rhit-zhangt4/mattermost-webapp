// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {forceLogoutIfNecessary} from 'mattermost-redux/actions/helpers';

import {EmojiTypes} from 'mattermost-redux/action_types';
import {GetStateFunc, DispatchFunc, ActionFunc} from 'mattermost-redux/types/actions';
import {General, Emoji} from 'mattermost-redux/constants';
import {logError} from 'mattermost-redux/actions/errors';

import CasualChatClient from 'casualchat/CasualChatClient';

// export function createPrivateEmoji(emoji: any, image: any): ActionFunc {
//     return bindClientFunc({
//         clientFunc: CasualChatClient.createPrivateEmoji,
//         onSuccess: EmojiTypes.RECEIVED_CUSTOM_EMOJI,
//         params: [
//             emoji,
//             image,
//         ],
//     });
// }

export function getFriends(
    page = 0,
    perPage: number = General.PAGE_SIZE_DEFAULT,
    sort: string = Emoji.SORT_BY_NAME,
    userID: string,
): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let data;
        try {
            data = await CasualChatClient.getPrivateEmojis(userID, page, perPage, sort);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(logError(error));
            return {error};
        }

        dispatch({
            type: EmojiTypes.RECEIVED_CUSTOM_EMOJIS,
            data,
        });

        return {data};
    };
}

export function searchFriends(term: string, options: any = {}, userID: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        let data;
        try {
            data = await CasualChatClient.searchPrivateEmoji(userID, term, options);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(logError(error));
            return {error};
        }

        dispatch({
            type: EmojiTypes.RECEIVED_CUSTOM_EMOJIS,
            data,
        });

        return {data};
    };
}

export function deleteFriend(friendId: string): ActionFunc {
    return async (dispatch: DispatchFunc, getState: GetStateFunc) => {
        try {
            await CasualChatClient.deleteFriend(friendId);
        } catch (error) {
            forceLogoutIfNecessary(error, dispatch, getState);

            dispatch(logError(error));
            return {error};
        }

        // dispatch({
        //     type: FRIENDTypes.FRIEND,
        //     data: {id: friendId},
        // });

        return {data: true};
    };
}

