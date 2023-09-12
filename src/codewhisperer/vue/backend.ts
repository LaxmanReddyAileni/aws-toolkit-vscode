/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import * as nls from 'vscode-nls'
const localize = nls.loadMessageBundle()
import * as os from 'os'
import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { VueWebview } from '../../webviews/main'
import { isCloud9 } from '../../shared/extensionUtilities'

import { telemetry } from '../../shared/telemetry/telemetry'

export class CodeWhispererWebview extends VueWebview {
    public readonly id = 'CodeWhispererWebview'
    public readonly source = 'src/codewhisperer/vue/index.js'

    public constructor(private readonly start: string) {
        super()
    }
    //This function is called when the extension is activated to check whether is it the first time the user is using the extension or not
    public async showAtStartUp(): Promise<string | void> {
        return this.start
    }

    private isFileSaved: boolean = false
    private getLocalFilePath(fileName: string): string {
        const workspaceFolder = vscode.workspace.workspaceFolders![0]
        return path.join(workspaceFolder.uri.fsPath, fileName)
    }

    // This function opens Python/JavaScript/C# file in the editor.
    async openFile(name: string[]): Promise<void> {
        const fileName = name[0]
        const fileContent = name[1]

        const localFilePath = this.getLocalFilePath(fileName)

        if (fs.existsSync(localFilePath) && this.isFileSaved) {
            const fileUri = vscode.Uri.file(localFilePath)
            vscode.workspace.openTextDocument(fileUri).then(doc => {
                vscode.window.showTextDocument(doc, vscode.ViewColumn.Active)
            })
        } else {
            this.saveFileLocally(localFilePath, fileContent)
        }
    }

    // This function saves and open the file in the editor.
    private async saveFileLocally(localFilePath: string, fileContent: string): Promise<void> {
        await fs.promises.writeFile(localFilePath, fileContent)
        this.isFileSaved = true
        vscode.workspace.openTextDocument(localFilePath).then(doc => {
            vscode.window.showTextDocument(doc, vscode.ViewColumn.Active)
        })
    }

    //This function returns the OS type of the machine used in Shortcuts and Generate Suggestion Sections
    public getOSType() {
        const platform = os.platform()
        if (platform === 'win32') {
            return 'Windows'
        } else if (platform === 'darwin') {
            return 'Mac'
        } else {
            return 'undefined'
        }
    }

    //This function opens the Keyboard shortcuts in VSCode
    async openShortCuts(): Promise<void> {
        vscode.commands.executeCommand('workbench.action.openGlobalKeybindings', 'codewhisperer')
    }

    //This function opens the Feedback CodeWhisperer page in the webview
    async openFeedBack(): Promise<void> {
        vscode.commands.executeCommand('aws.submitFeedback', 'CodeWhisperer')
    }

    //------Telemetry------
    /** This represents the cause for the webview to open, whether a certain button was clicked or it opened automatically */
    #codeWhispererSource?: CodeWhispererSource

    setSource(source: CodeWhispererSource | undefined) {
        if (this.#codeWhispererSource) {
            return
        }
        this.#codeWhispererSource = source
    }

    emitUiClick(id: CodeWhispererUiClick) {
        telemetry.ui_click.emit({
            elementId: id,
        })
    }
}

//List of all events that are emitted from the webview of CodeWhisperer
export type CodeWhispererUiClick =
    | 'cw_Resources_Documentation'
    | 'cw_Resources_Feedback'
    | 'cw_Resources_Workshop'
    | 'cw_Shortcuts_KeyboardShortcutsEditor'
    | 'cw_ScanCode_LearnMore'
    | 'cw_GenerateSuggestions_LearnMore'
    | 'cw_GenerateSuggestions_Tab'
    | 'cw_GenerateSuggestions_TryExample'

const Panel = VueWebview.compilePanel(CodeWhispererWebview)
let activePanel: InstanceType<typeof Panel> | undefined
let subscriptions: vscode.Disposable[] | undefined

export type CodeWhispererSource = 'codewhispererDeveloperTools'

// This function is called when the extension is activated : Webview of CodeWhisperer
export async function showCodeWhispererWebview(
    ctx: vscode.ExtensionContext,
    source: CodeWhispererSource,
    start: string
): Promise<void> {
    activePanel ??= new Panel(ctx, start) // "start" Parameter is passed to the constructor of CodeWhispererWebview to seperate the user experience from first time user to regualr signIn user
    activePanel.server.setSource(source)

    const webview = await activePanel!.show({
        title: localize('AWS.view.gettingStartedPage.title', `Getting Started with CodeWhisperer`),
        viewColumn: isCloud9() ? vscode.ViewColumn.One : vscode.ViewColumn.Active,
    })

    if (!subscriptions) {
        subscriptions = [
            webview.onDidDispose(() => {
                vscode.Disposable.from(...(subscriptions ?? [])).dispose()
                activePanel = undefined
                subscriptions = undefined
            }),
        ]
    }
}
