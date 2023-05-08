import * as core from '@actions/core';
import fetch from 'node-fetch';
import { VERCEL_BASE_API_ENDPOINT } from './config';
import { VercelDeployment } from './types/VercelDeployment';

/**
 * Awaits for the Vercel deployment to be in a "ready" state.
 *
 * @param baseUrl Base url of the Vercel deployment to await for.
 * @param timeout Duration (in seconds) until we'll await for.
 *  When the timeout is reached, the Promise is rejected (the action will fail).
 */
const awaitVercelDeployment = (baseUrl: string, timeout: number): Promise<VercelDeployment> => {
  return new Promise(async (resolve, reject) => {
    const timeoutTime = new Date().getTime() + timeout;
    let numErrors = 0;

    while (new Date().getTime() < timeoutTime) {
      const data = (await fetch(`${VERCEL_BASE_API_ENDPOINT}/v11/now/deployments/get?url=${baseUrl}`, {
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
        },
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            core.debug(`${new Date()}: Error while fetching deployment status: ${response.statusText}`);
            return undefined;
          }
        })
        .catch((error: string) => {
          core.debug(`${new Date()}: Error while fetching deployment status: ${error}`);
          return undefined;
        }));
      core.debug(`${new Date()}: Received data from Vercel: ${JSON.stringify(data)}`);

      if (data) {
        numErrors = 0;
        const deployment: VercelDeployment = data;
        if (deployment.readyState === 'READY') {
          core.debug(`${new Date()}: Deployment has been found`);
          return resolve(deployment);
        } else if (deployment.readyState === 'ERROR') {
          return reject(`${new Date()}: Deployment failed`);
        }
      } else {
        numErrors++;
        if (numErrors > 1) {
          return reject(`${new Date()}: Fetching deployment status failed`);
        } else {
          core.debug(`${new Date()}: Fetching deployment status failed, retrying...`);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
    return reject(`${new Date()}: Timeout has been reached`);
  });
};

export default awaitVercelDeployment;
