
import {createHash} from 'crypto';
import { v4 as uuidv4 } from 'uuid';


class Blockchain{

    constructor(){
        const currentNodeUrl = process.argv[3];

        this.chain = [];
        this.pendingTransactions = [];
        
        this.currentNodeUrl = currentNodeUrl;
        this.networkNodes = [];

        this.createNewBlock(100, '0', '0');
    }

    getHashId(){
        const hashId = uuidv4().split('-').join('');
        return hashId;
    }
    
    createNewBlock(nonce, previousBlockHash, hash) {
        const newBlock = {
            index: this.chain.length + 1,
            timestamp: Date.now(),
            transactions: this.pendingTransactions,
            nonce: nonce,
            hash: hash,
            previousBlockHash: previousBlockHash
        };

        this.pendingTransactions = [];
        this.chain.push(newBlock)

        return newBlock;
    }



    getLastBlock(){
        return this.chain[this.chain.length - 1];
    } 



    createNewTransaction(amount, sender, recipient){
        const newTransaction = {
            amount: amount,
            sender: sender,
            recipient: recipient,
            transactionId: this.getHashId()
        };
        
        return newTransaction;
    }



    addTransactionToPendingTransactions(transactionObj){
        this.pendingTransactions.push(transactionObj);
        return this.getLastBlock()['index'] + 1;
    }


    
    hashBlock(previousBlockHash, currentBlockData, nonce){
        const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);

        const sha256 = createHash('sha256').update(dataAsString);
        const hash = sha256.digest('hex');

        return hash;
    }



    proofOfWork(previousBlockHash, currentBlockData){
        let nonce = 0;
        let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        while (hash.substring(0, 4) !== '0000'){//first 4 nulls check
            nonce++;
            hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        }

        return nonce;
    }


    getTransaction(transactionId){
        let correctTransaction = null;
        let correctBlock = null;
        
        for(let block of this.chain){
            for(let transaction of block.transactions){
                if(transaction.transactionId === transactionId){
                    correctTransaction = transaction;
                    correctBlock = block;
                }
            }
        }
        return {
            transaction: correctTransaction,
            block: correctBlock
        }
    }


    getAddressData(address){
        const addressTransactions = [];
        for(let block of this.chain){
            for(let transaction of block.transactions){
                if(transaction.sender === address ||
                    transaction.recipient === address){
                    addressTransactions.push(transaction);
                }
            }
        }

        let balance = 0;
        for(let transaction of addressTransactions){
            if(transaction.recipient === address) balance += transaction.amount;
            else if (transaction.sender === address) balance -= transaction.amount;
        }

        return{
            addressTransactions: addressTransactions,
            addressBalance: balance
        }
    }


    getBlock(blockHash){
        let correctBlock = null;
        for(let block of this.chain){
            if(block.hash === blockHash){
                correctBlock = block;
            }
        }
        return correctBlock;
    }



    chainIsValid(blockchain){
        let validChain = true;

        for(let i=1; i < blockchain.length; i++){
            //the two hash values have to do equal
            const currentBlock = blockchain[i];
            const prevBlock = blockchain[i - 1];

            //recreate the hash value
            const blockHash = this.hashBlock(
                prevBlock['hash'], {
                    transactions: currentBlock['transactions'], 
                    index: currentBlock['index']
                },
                currentBlock.nonce
            );

            if(blockHash.substring(0, 4) !== '0000'){
                validChain = false;
                console.log('1', validChain)
                console.log(blockHash.substring(0, 4))
            }
            if(currentBlock['previousBlockHash'] !== prevBlock['hash']){//chain is not valid
                validChain = false;
                console.log('2', validChain)
            } 
        }

        //genesis block check
        const genesisBlock = blockchain[0];
        const correctNonce = (genesisBlock['nonce'] === 100);
        const correctPreviousBlockHash = (genesisBlock['previousBlockHash'] === '0');
        const correctHash = (genesisBlock['hash'] === '0');
        const correctTransactions = (genesisBlock['transactions'].length === 0);

        if(!correctNonce || !correctPreviousBlockHash || !correctHash || !correctTransactions ){
            validChain = false;
            console.log('3', validChain)
        }
        
        return validChain;
    }



}


export default Blockchain

















