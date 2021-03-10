import { Arguments } from 'yargs';
import { readFileSync, writeFileSync } from 'fs';
import childProcess from 'child_process';

const yaml = require('js-yaml');
const lodash = require('lodash');

export const command = 'import';
export const desc = "Import media assets";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const handler = async (
  argv: Arguments
): Promise<void> => {
  try {

    // Reading global settings
    let settingsYAML = readFileSync(`./settings.yaml`).toString();

    // Backup settings
    writeFileSync("settings.yaml.backup", settingsYAML);

    // Converting from YAML to JSON
    const settingsJSON = yaml.load(settingsYAML)
    console.log('Global settings loaded');

    const sourceType = settingsJSON.dam.source.type;
    if (sourceType === 's3') {

      const bucket = settingsJSON.dam.source.bucket;
      const region = settingsJSON.dam.source.region;
      childProcess.execSync(
        `dam-cli assets import-s3 ${bucket} ${region} ${settingsJSON.dam.bucketsMap.assets}`
      );
      console.log('Importing assets from S3...');
      await delay(10000);
      childProcess.execSync(
        `dam-cli assets publish-all ${settingsJSON.dam.bucketsMap.assets}`
      );
      console.log('Publishing all assets...');
      await delay(10000);
    }
  } catch(error) {
    console.log(error.message);
  }
};
