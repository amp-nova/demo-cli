import { Arguments } from 'yargs';

export const command = 'list';
export const desc = "List AWS serverless stacks";

export const handler = async (
  argv: Arguments
): Promise<void> => {
  console.log("Listing serverless stacks");

};