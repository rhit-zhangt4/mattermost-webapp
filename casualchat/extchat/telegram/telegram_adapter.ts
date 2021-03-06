// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {setIsLinked, setContacts} from 'casualchat/actions/telegram_action';

import store from 'stores/redux_store';
import {ExtChatAdapter} from 'casualchat/extchat/extchat_adapter';

import {getExtRefByChannel, postToExtChannel, getExtChannelByExternalId} from 'casualchat/CasualChatClient';

import {TelegramContact} from './telegram_reducer';

type TdObject = {'@type': string} & Record<string, any>;

type TdClient = {send: (message: TdObject) => Promise<TdObject>};

async function importTdClient() {
    // eslint-disable-next-line
    if (process.env.NODE_ENV !== 'test') {
        // eslint-disable-next-line
        // @ts-ignore
        await import(/* webpackMode: "eager" */'casualchat/extchat/telegram/include_prebuilt.js_tsignore');
        // eslint-disable-next-line
        // @ts-ignore
        const {default: TdClientConstructor} = await import('tdweb');
        return TdClientConstructor;
    }
    const {default: TdClientConstructor} = await import('./td_client_stub');
    return TdClientConstructor;
}

class TelegramAdapter implements ExtChatAdapter {
    client: TdClient | null;
    readyToLogin: boolean;
    readyToSendCode: boolean;

    constructor() {
        this.client = null;
        this.readyToLogin = false;
        this.readyToSendCode = false;
        this.checkClient();
    }

    private checkClient = async (): Promise<TdClient> => {
        if (this.client !== null) {
            return this.client;
        }

        const ClientInstance = await importTdClient();
        const newClient = new ClientInstance({
            onUpdate: this.onUpdate,
            jsLogVerbosityLevel: 'INFO',
            instanceName: 'casualchat-tdweb',
            isBackground: true,
        });
        this.client = newClient;
        return newClient;
    }

    private send = async (messageObject: TdObject): Promise<TdObject> => {
        if (this.client === null) {
            return {'@type': 'NotReady'};
        }
        return this.client.send(messageObject);
    };

    private onUpdate = (updateObject: TdObject): void => {
        const updateType = updateObject['@type'];
        switch (updateType) {
        case 'updateAuthorizationState':
            this.updateAuthorizationState(updateObject.authorization_state['@type']);
            break;
        case 'updateNewMessage':
            this.updateNewMessage(updateObject);
            break;
        default:

                //console.log(updateObject);
        }
    };

    private updateAuthorizationState = (authState: string): void => {
        switch (authState) {
        case 'authorizationStateWaitTdlibParameters':
            this.setTdLibParameters();
            break;
        case 'authorizationStateWaitEncryptionKey':
            this.checkDatabaseEncryptionKey();
            break;
        case 'authorizationStateWaitPhoneNumber':
            this.readyToLogin = true;
            break;
        case 'authorizationStateWaitCode':
            this.readyToSendCode = true;
            break;
        case 'authorizationStateReady':
            store.dispatch(setIsLinked(true));

                //whackyLinkCallback();
        }
    }

    setTdLibParameters = async () => {
        await this.send({
            '@type': 'setTdlibParameters',
            parameters: {
                database_directory: './td-db',
                api_id: 2727981,
                api_hash: 'f74bb617138e30e349a7c93bed9477ca',
                system_language_code: 'en',
                device_model: 'Casual Chat Client',
                application_version: '1',
            },
        });
    };

    checkDatabaseEncryptionKey = async () => {
        await this.send({
            '@type': 'checkDatabaseEncryptionKey',
            encryption_key: null,
        });
    };

    private updateNewMessage = async (updateObject: TdObject): Promise<any> => {
        const senderExternalId: number = updateObject.message.sender.user_id;
        const messageObject = updateObject.message.content;
        let message: string;
        if ('text' in messageObject && 'text' in messageObject.text) {
            message = messageObject.text.text;
        } else {
            message = '[Unsupported Message]';
        }

        //console.log(`${senderExternalId}: ${message}`);
        let channelId: string;
        try {
            channelId = await getExtChannelByExternalId('telegram', String(senderExternalId));
        } catch (e) {
            //console.error(e);
            return;
        }

        //console.log(channelId);
        const extRef = await getExtRefByChannel(channelId);
        if (!extRef || !extRef.alias_user_id) {
            return;
        }

        //console.log(extRef);
        postToExtChannel(channelId, extRef.alias_user_id, message);
    }

    logOut = async (): Promise<any> => {
        await this.send({'@type': 'logout'});
    };

    logIn = async (username: string): Promise<any> => {
        if (!this.readyToLogin) {
            return;
        }
        await this.send({
            '@type': 'setAuthenticationPhoneNumber',
            phone_number: username,
        });
    };

    pullContacts = async (): Promise<any> => {
        const result = await this.send({
            '@type': 'getContacts',
        });

        //console.log(result);
        const ids: number[] = result.user_ids;
        const contacts: Record<string, TelegramContact> = {};
        const processFunction = async (i: number) => {
            if (i >= ids.length) {
                //console.log('Done pulling contacts');
                store.dispatch(setContacts(contacts));
            } else {
                const userResult = await this.send({
                    '@type': 'getUser',
                    user_id: ids[i],
                });
                const name = `${userResult.first_name} ${userResult.last_name}`;
                const contact: TelegramContact = {
                    id: String(ids[i]),
                    name,
                    messages: [],
                };
                contacts[String(ids[i])] = contact;
                await processFunction(i + 1);
            }
        };
        await processFunction(0);
    }

    sendMessage = async (externalId: string, message: string): Promise<any> => {
        await this.send({
            '@type': 'createPrivateChat',
            user_id: Number(externalId),
        });

        await this.send({
            '@type': 'sendMessage',
            chat_id: Number(externalId),
            reply_to_message_id: 0,
            disable_notifications: false,
            from_background: false,
            reply_markup: null,
            input_message_content:
            {
                '@type': 'inputMessageText',
                text: {
                    '@type': 'formattedText',
                    text: message || 'Undefined Message',
                    entities: null,
                },
                disable_web_page_preview: false,
                clear_draft: false,
            },
        });
    };

    sendCode = async (code: string): Promise<any> => {
        if (!this.readyToSendCode) {
            throw new Error('Not ready to send code');
        }
        await this.send({
            '@type': 'checkAuthenticationCode',
            code,
        });
    };

    isReadyToLogin = () => this.readyToLogin;
    isReadyToSendCode = () => this.readyToSendCode;
}

export default new TelegramAdapter();

