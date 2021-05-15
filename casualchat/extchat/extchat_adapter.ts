// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import telegram from './telegram/telegram_adapter';

export interface ExtChatAdapter {
    logOut: () => Promise<any>;
    pullContacts: () => Promise<any>;
    sendMessage: (externalId: string, message: string) => Promise<any>;
    logIn: (username: string) => Promise<any>;
    sendCode: (code: string) => Promise<any>;
    isReadyToLogin: () => boolean;
    isReadyToSendCode: () => boolean;
}

class AdapterStub implements ExtChatAdapter{
    async logOut(): Promise<any>{
        
    }
    async pullContacts(): Promise<any>{

    }
    async sendMessage(externalId: string, message: string):Promise<any>{

    }
    async logIn(username: string):Promise<any>{

    }
    async sendCode(code: string) :Promise<any>{

    }
    isReadyToLogin():boolean{
        return true;
    }
    isReadyToSendCode() :boolean{
        return true;
    }
    
}
export type ExtChat = {
    telegram: ExtChatAdapter;
}

export default {
    telegram
};

export const ExtChatStub = {
    telegram: AdapterStub,
}
