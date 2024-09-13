/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { scanChat } from '../../../models/constants'
import { AuthFollowUpType } from '../../../../amazonq/auth/model'
import { MessagePublisher } from '../../../../amazonq/messages/messagePublisher'
import { ChatItemButton, ChatItemFormItem } from '@aws/mynah-ui/dist/static'
import { ScanCommands } from '../../controller/messenger/messengerUtils'
import { ChatItemType } from '../../../../amazonq/commons/model'

export type ScanMessageType =
    | 'errorMessage'
    | 'asyncEventProgressMessage'
    | 'authenticationUpdateMessage'
    | 'authNeededException'
    | 'chatPrompt'
    | 'chatMessage'
    | 'chatInputEnabledMessage'
    | 'sendCommandMessage'
    | 'updatePlaceholderMessage'

class UiMessage {
    readonly time: number = Date.now()
    readonly sender: string = scanChat
    readonly type: ScanMessageType = 'chatMessage'
    readonly status: string = 'info'

    public constructor(protected tabID: string) {}
}

export class ErrorMessage extends UiMessage {
    override type: ScanMessageType = 'errorMessage'

    constructor(
        readonly title: string,
        readonly message: string,
        tabID: string
    ) {
        super(tabID)
    }
}

export interface AsyncEventProgressMessageProps {
    readonly inProgress: boolean
    readonly message: string | undefined
    readonly messageId?: string | undefined
    readonly buttons?: ChatItemButton[]
}

export class AsyncEventProgressMessage extends UiMessage {
    readonly inProgress: boolean
    readonly message: string | undefined
    readonly messageId?: string | undefined
    readonly buttons?: ChatItemButton[]
    readonly messageType = 'answer-part'
    override type: ScanMessageType = 'asyncEventProgressMessage'

    constructor(tabID: string, props: AsyncEventProgressMessageProps) {
        super(tabID)
        this.inProgress = props.inProgress
        this.message = props.message
        this.messageId = props.messageId
        this.buttons = props.buttons ?? []
    }
}

export class AuthenticationUpdateMessage {
    readonly time: number = Date.now()
    readonly sender: string = scanChat
    readonly type: ScanMessageType = 'authenticationUpdateMessage'

    constructor(
        readonly gumbyEnabled: boolean,
        readonly authenticatingTabIDs: string[]
    ) {}
}

export class AuthNeededException extends UiMessage {
    override type: ScanMessageType = 'authNeededException'

    constructor(
        readonly message: string,
        readonly authType: AuthFollowUpType,
        tabID: string
    ) {
        super(tabID)
    }
}

export interface ChatPromptProps {
    readonly message: string | undefined
    formItems: ChatItemFormItem[]
}

export class ChatPrompt extends UiMessage {
    readonly message: string | undefined
    readonly messageType = 'system-prompt'
    readonly formItems: ChatItemFormItem[]
    formButtons: ChatItemButton[]
    override type: ScanMessageType = 'chatPrompt'

    constructor(props: ChatPromptProps, promptIDPrefix: string, tabID: string, keepCardAfterClick: boolean = true) {
        super(tabID)
        this.message = props.message
        this.formItems = props.formItems

        this.formButtons = []
        this.formButtons.push({
            keepCardAfterClick: keepCardAfterClick,
            waitMandatoryFormItems: true,
            text: 'Confirm',
            id: `gumby${promptIDPrefix}Confirm`,
        })
        this.formButtons.push({
            keepCardAfterClick: false,
            waitMandatoryFormItems: false,
            text: 'Cancel',
            id: `gumby${promptIDPrefix}Cancel`,
        })
    }
}

export interface ChatMessageProps {
    readonly message: string | undefined
    readonly messageId?: string | undefined
    readonly messageType: ChatItemType
    readonly buttons?: ChatItemButton[]
}

export class ChatMessage extends UiMessage {
    readonly message: string | undefined
    readonly messageId?: string | undefined
    readonly messageType: ChatItemType
    readonly buttons: ChatItemButton[]
    override type: ScanMessageType = 'chatMessage'

    constructor(props: ChatMessageProps, tabID: string) {
        super(tabID)
        this.message = props.message
        this.messageType = props.messageType
        this.buttons = props.buttons || []
        this.messageId = props.messageId || undefined
    }
}

export class ChatInputEnabledMessage extends UiMessage {
    override type: ScanMessageType = 'chatInputEnabledMessage'

    constructor(
        tabID: string,
        readonly enabled: boolean
    ) {
        super(tabID)
    }
}

export class SendCommandMessage extends UiMessage {
    override type: ScanMessageType = 'sendCommandMessage'

    constructor(
        readonly command: ScanCommands,
        tabID: string,
        readonly eventId: string
    ) {
        super(tabID)
    }
}

export class UpdatePlaceholderMessage extends UiMessage {
    readonly newPlaceholder: string
    override type: ScanMessageType = 'updatePlaceholderMessage'

    constructor(tabID: string, newPlaceholder: string) {
        super(tabID)
        this.newPlaceholder = newPlaceholder
    }
}

export class AppToWebViewMessageDispatcher {
    constructor(private readonly appsToWebViewMessagePublisher: MessagePublisher<any>) {}

    public sendErrorMessage(message: ErrorMessage) {
        this.appsToWebViewMessagePublisher.publish(message)
    }

    public sendChatMessage(message: ChatMessage) {
        this.appsToWebViewMessagePublisher.publish(message)
    }

    public sendChatPrompt(message: ChatPrompt) {
        this.appsToWebViewMessagePublisher.publish(message)
    }

    public sendAsyncEventProgress(message: AsyncEventProgressMessage) {
        this.appsToWebViewMessagePublisher.publish(message)
    }

    public sendUpdatePlaceholder(message: UpdatePlaceholderMessage) {
        this.appsToWebViewMessagePublisher.publish(message)
    }

    public sendAuthenticationUpdate(message: AuthenticationUpdateMessage) {
        this.appsToWebViewMessagePublisher.publish(message)
    }

    public sendAuthNeededExceptionMessage(message: AuthNeededException) {
        this.appsToWebViewMessagePublisher.publish(message)
    }

    public sendChatInputEnabled(message: ChatInputEnabledMessage) {
        this.appsToWebViewMessagePublisher.publish(message)
    }

    public sendCommandMessage(message: SendCommandMessage) {
        this.appsToWebViewMessagePublisher.publish(message)
    }
}
