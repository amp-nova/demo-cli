import { Arguments } from 'yargs';
import { settingsBuilder, settingsHandler } from '../../common/settings-handler';

export const builder = settingsBuilder
export const handler = async (argv: Arguments): Promise<void> => settingsHandler(argv, desc, command, handle)

export const command = 'configure';
export const desc = "Configure all content assets";

import { compile as handlebarsCompile } from 'handlebars';
const { readFileSync, writeFileSync, readdirSync, statSync, unlinkSync } = require('fs')
const childProcess = require('child_process')

const handle = (settingsJSON: any, argv: Arguments) => {
  // Create repositories folder
  try { childProcess.execSync(`mkdir repositories`); } catch (error) { }

  // Copy ./assets/content folder in repositories
  console.log('Copying content assets to repositories folder');
  try { childProcess.execSync(`rm -r ./repositories/content`); } catch (error) { }
  childProcess.execSync(`cp -r ./assets/content ./repositories`);

  // Scan all handlebars files in ./repositories/assets/content
  const iterateDirectory = () => {
    const files: string[] = [];
    const dirs: string[] = [];

    return function directoryIterator(directory: string) {
      try {
        let dirContent = readdirSync(directory);
        dirContent.forEach((path: string) => {
          const fullPath: string = `${directory}/${path}`;

          // Add to files list if it's an handlebars template
          if (statSync(fullPath).isFile()) {
            if (fullPath.endsWith('.hbs')) {
              files.push(fullPath);
            }
          } else {

            // Add sub-directory to directory list
            dirs.push(fullPath);
          }
        });
        const directoryPop = dirs.pop();

        // Scan next sub-directory
        if (directoryPop) { directoryIterator(directoryPop); }

        return files;
      } catch (ex) {
        console.log(ex);
        return files;
      }
    };
  };

  // Finding all templates in content folder
  const contentFolder = `${argv.settingsDir}/repositories/content`;
  console.log(`Finding all templates from ${contentFolder} folder`);
  const assetsIterator = iterateDirectory();
  const files = assetsIterator(contentFolder);

  // Render each template to file
  files.map((item: string) => {
    const templateString = readFileSync(item).toString();
    const template = handlebarsCompile(templateString);
    const contentJSON = template(settingsJSON);

    // Write json to file
    const file = item.replace('.hbs', '');
    writeFileSync(file, contentJSON);
    console.log(`Created json from template: ${file}`)

    // Remove template
    unlinkSync(item);
  });

  // Create config folder if needed
  try { childProcess.execSync(`mkdir ../config`); } catch (error) { }

  childProcess.execSync(`cp -r ./repositories/content/content-type-schemas ../config`);
  childProcess.execSync(`cp -r ./repositories/content/content-types ../config`);
}