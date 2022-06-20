import {BridgeParams} from "../interfaces/bridge-params";
import {ethers} from "ethers";
import {Web3Bridge} from "../bridge/web3-bridge";
import {CreateTransactionResponse} from "fireblocks-sdk";
import {ContractFunction} from "@ethersproject/contracts";
import {ABIStructure} from "../types/abi";


export class BaseToken {
    private readonly _allFunctions: { [key: string]: ContractFunction | any };
    private readonly bridgeParams: BridgeParams;
    private readonly contract: ethers.Contract;
    web3Bridge: Web3Bridge;
    contractABI: ABIStructure;

    constructor(bridgeParams: BridgeParams, contractABI: ABIStructure) {
        if (!bridgeParams.chain) {
            throw new Error('Token must contain chain');
        }

        if (!bridgeParams.contractAddress) {
            throw new Error('Token must contain contract address');
        }

        this.bridgeParams = {...bridgeParams, externalWalletId: bridgeParams.contractAddress};
        this.web3Bridge = new Web3Bridge(bridgeParams);
        this.contractABI = contractABI
        this.contract = new ethers.Contract(this.bridgeParams.contractAddress,
            JSON.stringify(this.contractABI),
            ethers.getDefaultProvider(this.bridgeParams.chain));
        this._allFunctions = this.contract.functions;
    }


    /**
     * Use this to build a transaction which will then be sent to fireblocks to get signed.
     * @param abiName - abi function name
     * @param args - function params
     */
    buildTransaction(abiName: string, ...args) {
        return this.contract.populateTransaction[abiName].call(this, ...args);
    }

    /**
     * Use this to execute a function that needs no signing, e.g. supportsInterface. Basically a "read" function
     * @param abiName
     * @param args
     */
    async callView(abiName: string, ...args): Promise<any> {
        try {
            const response = await this.contract.functions[abiName].call(this, ...args);
            return response[0] ?? response;
        } catch (e) {
            throw new Error(e);
        }
    }


    /**
     * Submit transaction using defi SDK
     * @param transactionData
     * @param notes - (Optional) Add a note to the transaction
     */
    submitTransaction(transactionData, notes?: string): Promise<CreateTransactionResponse> {
        return this.web3Bridge.sendTransaction(transactionData, notes);
    }

}