"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const config_1 = require("./config");
/**
 * Awaits for the Vercel deployment to be in a "ready" state.
 *
 * XXX Uses the global `fetch` (available since Node.js 18), rather than a userland HTTP client.
 *  This keeps the bundled runtime free of `whatwg-url`/`tr46`, which pull in the deprecated
 *  `punycode` core module and make Node.js emit DEP0040 at runtime.
 *
 * @param baseUrls Base urls of the Vercel deployments to await for.
 * @param timeout Duration (in seconds) until we'll await for.
 *  When the timeout is reached, the Promise is rejected (the action will fail).
 */
const awaitVercelDeployment = (baseUrls, timeout) => {
    return new Promise(async (resolve, reject) => {
        const timeoutTime = new Date().getTime() + timeout;
        let numErrors = 0;
        while (new Date().getTime() < timeoutTime) {
            for (const baseUrl of baseUrls) {
                core.debug(`${new Date()}: Fetching deployment status for ${baseUrl}`);
                const data = await fetch(`${config_1.VERCEL_BASE_API_ENDPOINT}/v13/deployments/${baseUrl}`, {
                    headers: {
                        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
                    },
                })
                    .then(async (response) => {
                    if (response.ok) {
                        return (await response.json());
                    }
                    else {
                        core.debug(`${new Date()}: Error while fetching deployment status: ${response.statusText}`);
                        return undefined;
                    }
                })
                    .catch((error) => {
                    core.debug(`${new Date()}: Error while fetching deployment status: ${error}`);
                    return undefined;
                });
                core.debug(`${new Date()}: Received data from Vercel: ${JSON.stringify(data)}`);
                if (data) {
                    numErrors = 0;
                    const deployment = data;
                    if (deployment.readyState === 'READY') {
                        core.debug(`${new Date()}: Deployment has been found`);
                        return resolve(deployment);
                    }
                    else if (deployment.readyState === 'ERROR') {
                        return reject(`${new Date()}: Deployment failed`);
                    }
                }
                else {
                    numErrors++;
                    if (numErrors > 1) {
                        return reject(`${new Date()}: Fetching deployment status failed`);
                    }
                    else {
                        core.debug(`${new Date()}: Fetching deployment status failed, retrying...`);
                    }
                }
                await new Promise((resolve) => setTimeout(resolve, 5_000));
            }
        }
        return reject(`${new Date()}: Timeout has been reached`);
    });
};
exports.default = awaitVercelDeployment;
