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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const config_1 = require("./config");
/**
 * Awaits for the Vercel deployment to be in a "ready" state.
 *
 * @param baseUrl Base url of the Vercel deployment to await for.
 * @param timeout Duration (in seconds) until we'll await for.
 *  When the timeout is reached, the Promise is rejected (the action will fail).
 */
const awaitVercelDeployment = (baseUrl, timeout) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        const timeoutTime = new Date().getTime() + timeout;
        let numErrors = 0;
        while (new Date().getTime() < timeoutTime) {
            const data = (yield (0, node_fetch_1.default)(`${config_1.VERCEL_BASE_API_ENDPOINT}/v11/now/deployments/get?url=${baseUrl}`, {
                headers: {
                    Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
                },
            })
                .then((response) => {
                if (response.ok) {
                    return response.json();
                }
                else {
                    core.debug(`${new Date()}: Error while fetching deployment status: ${response.statusText}`);
                    return undefined;
                }
            })
                .catch((error) => {
                core.debug(`${new Date()}: Error while fetching deployment status: ${error}`);
                return undefined;
            }));
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
            yield new Promise((resolve) => setTimeout(resolve, 5000));
        }
        return reject(`${new Date()}: Timeout has been reached`);
    }));
};
exports.default = awaitVercelDeployment;
