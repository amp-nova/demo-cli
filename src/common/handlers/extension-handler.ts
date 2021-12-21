import { Cleanable, CleanableResourceHandler, Importable, ImportableResourceHandler, Context, ResourceHandler } from "./resource-handler"
import { Hub, Extension } from "dc-management-sdk-js"
import { paginator } from "../paginator"
import _ from 'lodash'
import logger, { logComplete, logUpdate } from "../logger"
import chalk from 'chalk'
import { HubOptions, MappingOptions } from "../interfaces"
import { Arguments } from "yargs"
import fs from 'fs-extra'
import { prompts } from "../prompts"
import { HubSettingsOptions } from "../settings-handler"

import { customAlphabet } from "nanoid"
import { lowercase } from "nanoid-dictionary"
const nanoid = customAlphabet(lowercase, 50)

export class ExtensionImportHandler extends ImportableResourceHandler {
    constructor() {
        super(Extension, 'extensions')
        this.icon = '⚙️'
        this.sortPriority = 1.1
    }

    async import(argv: HubSettingsOptions): Promise<any> {
        const { hub } = argv
        let extensions = fs.readJsonSync(`${global.tempDir}/content/extensions/extensions.json`)

        const existingExtensions = await paginator(hub.related.extensions.list)
        let createCount = 0
        await Promise.all(extensions.map(async (ext: any) => {
            try {
                if (!_.includes(_.map(existingExtensions, 'name'), ext.name)) {
                    logUpdate(`${prompts.import} extension [ ${ext.name} ]`)
                    let extension = await hub.related.extensions.create(ext)
                    createCount++
                }
            } catch (error) {
                if (error.message.indexOf('EXTENSION_NAME_DUPLICATE')) {
                    logger.error(`${prompts.error} importing extension [ ${ext.name} ]: duplicate name`)
                }
                else {
                    logger.error(`${prompts.error} importing extension [ ${ext.name} ]: ${error.message}`)
                }
            }
        }))

        logComplete(`${chalk.blueBright(`extensions`)}: [ ${chalk.green(createCount)} created ]`)
    }
}

export class ExtensionCleanupHandler extends CleanableResourceHandler {
    constructor() {
        super(Extension, 'extensions')
        this.icon = '⚙️'
    }

    async cleanup(argv: Context): Promise<any> {
        try {
            let deleteCount = 0
            let extensions = await paginator(argv.hub.related.extensions.list)
            await Promise.all(extensions.map(async ext => {
                let oldName = ext.name
                ext.name = nanoid()
                ext = await ext.related.update(ext)
                deleteCount++
                await ext.related.delete()
                logUpdate(`${chalk.red('delete')} extension [ ${oldName} ]`)
            }))
            logComplete(`${chalk.blueBright('extensions')}: [ ${chalk.red(deleteCount)} ] deleted`)
        } catch (error) {
            logger.error(error.message || error)
        }
    }
}