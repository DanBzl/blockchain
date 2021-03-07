
import express, { response } from 'express';
import Blockchain from '../dev/blockchain.mjs'
import http from 'http';
import url from 'url';
import path from 'path';
import cors from 'cors';


const port = process.argv[2];


const app = express();
app.use(cors())

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use((error, req, res, next) => {
    res.status(res.statusCode);
    res.render('error', { message: error.message }); 
});



const bitcoin = new Blockchain();
const __dirname = path.resolve(); 



app.use(express.static(path.join(__dirname, './dev/block-explorer/dist/portecoin')));

app.get('/block-explorer', (req, res)=> {
    res.sendFile('./dev/block-explorer/dist/portecoin/index.html', 
    {root: __dirname})
});
app.get('/favico.ico', (req, res)=> {
    // res.sendStatus(404);
    res.sendFile('./dev/block-explorer/dist/portecoin/favicon.ico', 
    {root: __dirname})
});



app.get('/', (req, res)=>{
    res.send(('Welcome to Dans Bitcoin!'));
})


app.get('/blockchain', (req, res)=>{
    res.send(bitcoin);
})


app.post('/transaction', (req, res)=>{
    const newTransaction = req.body;
    const blockIndex = bitcoin.addTransactionToPendingTransactions(newTransaction);
    res.json({note: `Transaction will be added in block ${blockIndex}.`});
})


app.get('/mine', (req, res)=>{ 
    const lastBlock = bitcoin.getLastBlock();
    const previousBlockHash = lastBlock['hash'];
    const currentBlockData = {
        transactions: bitcoin.pendingTransactions,
        index: (lastBlock['index'] + 1)
    };
    const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);
    const nodeAddress = bitcoin.getHashId();
    const newReward = bitcoin.createNewTransaction(12.5, '00', nodeAddress);    
    const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);

    //broadcast new block and reward transaction
    broadcastNewBlock(res, newBlock, newReward)
}) 




function broadcastNewBlock(res, newBlock, newReward){
    const newBlockJsonString = JSON.stringify({newBlock: newBlock});
    let regNodesPromises = [];

    for(let networkNodeUrl of bitcoin.networkNodes){            
        // register new node and create an http promise 
        const parsedUrl = url.parse(networkNodeUrl); 
        const requestPromise = requestPromisePOST(parsedUrl, newBlockJsonString, '/receive-new-block').catch(e=>{
            console.error('broadcastNewBlock()-> requestPromise ERROR:', e)
        })
        
        //add promise 
        regNodesPromises.push(requestPromise);
    }


    //node response
    Promise.all(regNodesPromises).then((data)=>{
        const newRewardJsonString = JSON.stringify(newReward);
        const parsedUrl = url.parse(bitcoin.currentNodeUrl); 

        requestPromisePOST(parsedUrl, newRewardJsonString, '/transaction/broadcast').catch(e=>{
            console.error('broadcastNewBlock()-> newRewardJsonString ERROR:', e)
        })

    }).then((data)=>{
        res.json({
            note: 'New block mined successfully', 
            block: newBlock
        })

    }).catch((e)=>{
        console.error(e);
        res.json({note: 'broadcastNewBlock()-> Promise.all ERROR:', e});
    })

}




app.post('/receive-new-block', (req, res)=>{
    const newBlock = req.body.newBlock;
    const lastBlock = bitcoin.getLastBlock();
    const correctHash = (lastBlock.hash === newBlock.previousBlockHash);
    const correctIndex = ((lastBlock['index'] + 1) === newBlock['index']);
    
    if(correctHash && correctIndex){
        bitcoin.chain.push(newBlock);
        bitcoin.pendingTransactions = [];
        
        //send a response to the client
        res.json({
            note: `New block received and accepted.`,
            newBlock: newBlock
        });

    }else{
        //send a response to the client
        res.json({
            note: `New block rejected.`,
            newBlock: newBlock
        });
    }
})



//register- and broadcast-node-enpoint
app.post('/register-and-broadcast-node', (req, res)=>{
    const newNodeUrl = req.body.newNodeUrl;
    if (bitcoin.networkNodes.indexOf(newNodeUrl) == -1){//if the url doesn't exist
        bitcoin.networkNodes.push(newNodeUrl); //add
    }

    //http-promise-list
    let regNodesPromises = []
    const newNodeUrlJsonString = JSON.stringify({"newNodeUrl":newNodeUrl})

    for (let networkNodeUrl of bitcoin.networkNodes){
        // register new node and create an http promise 
        const parsedUrl = url.parse(networkNodeUrl); 
        let requestPromise = new Promise((resolve, reject)=>{
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: '/register-node', 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': newNodeUrlJsonString.length
                }
            }
            const request = http.request(options, (response) => {
                response.setEncoding('utf8');                   
                response.on('data', d => {
                    process.stdout.write(d)
                });
            });
            
            request.on('error', error => {
                console.log(`statusCode (broadcast): ${response.statusCode}`)
                console.error(error.message)
                reject(error.message)
            });
            
            //post the data
            request.write(newNodeUrlJsonString);
            request.end(()=>{
                resolve(true)
            });            
        });
        
        //add promise
        regNodesPromises.push(requestPromise)
    }
    

    Promise.all(regNodesPromises).then(boolen=>{
        //use the data receive from all nodes

        const allNetworkNodes = [...bitcoin.networkNodes, bitcoin.currentNodeUrl];   
        const allNetworkNodesJsonString = JSON.stringify({allNetworkNodes:allNetworkNodes});
        const newParsedUrl = url.parse(newNodeUrl);   
        
        const bulkRegisterOptions = {
            hostname: newParsedUrl.hostname, 
            port: newParsedUrl.port,
            path: '/register-nodes-bulk',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': allNetworkNodesJsonString.length
            } 
        }

        const request = http.request(bulkRegisterOptions, (response) => {   
            response.setEncoding('utf8');                        
            response.on('data', d => {
                process.stdout.write(d);
            });
        });
                
        request.on('error', error => {
            console.log(`statusCode (nodes-bulk): ${response.statusCode}`);   
            console.error(error.message);
        });
        
        request.write(allNetworkNodesJsonString);
        request.end();

    }).then(data=>{
        res.json({"note": "New Node registered with network successfully!"});
    }).catch(msg=>{
        console.error(msg);
    })
})



//register a node with the network
app.post('/register-node', (req, res)=>{
    const newNodeUrl = req.body.newNodeUrl;

    const nodeNotAlreadyPresent = (bitcoin.networkNodes.indexOf(newNodeUrl) == -1);
    const nodeCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;

    if (nodeNotAlreadyPresent && nodeCurrentNode){ 
        bitcoin.networkNodes.push(newNodeUrl);
    }

    res.json({note: 'New node registered successfully.'});
})



//register-node-bulk
app.post('/register-nodes-bulk', (req, res)=>{
    const allNetworkNodes = req.body.allNetworkNodes;

    for (let networkNodeUrl of allNetworkNodes){

        const nodeNotAlreadyPresent = (bitcoin.networkNodes.indexOf(networkNodeUrl) == -1);
        const nodeCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl;

        if(nodeNotAlreadyPresent && nodeCurrentNode) {
            bitcoin.networkNodes.push(networkNodeUrl);
        }
    }

    res.json({note: 'Bulk registration successful.'})
})




app.post('/transaction/broadcast', (req, res)=>{ 
    const newTransaction = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    bitcoin.addTransactionToPendingTransactions(newTransaction);
    broadcastTransaction(res, newTransaction); //broadcast transaction to all nodes
});




function broadcastTransaction(res, newTransaction){

    const newTransactionJsonString = JSON.stringify(newTransaction);

    let regNodesPromises = [];

    for(let networkNodeUrl of bitcoin.networkNodes){            
        // register new node and create an http promise 
        const parsedUrl = url.parse(networkNodeUrl); 

        let requestPromise = new Promise((resolve, reject)=>{ 
            const requestOptions = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: '/transaction', 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': newTransactionJsonString.length
                }
            };

            const request = http.request(requestOptions, (response) => {
                response.setEncoding('utf8');                   
                response.on('data', d => {
                    process.stdout.write(d)
                });
            });
            
            request.on('error', error => {
                console.log(`statusCode (broadcast): ${response.statusCode}`)
                console.error(error.message)
                reject(error.message)
            });
            
            //post the data
            request.write(newTransactionJsonString);
            request.end(()=>{
                resolve(true)
            });            
        });
        
        //add promise
        regNodesPromises.push(requestPromise)
    }

    //node response
    Promise.all(regNodesPromises).then((data)=>{
        //console.log(data)
    }).then((data)=>{        
        res.json({note: "Transaction created and broacast successfully."});
    }).catch((e)=>{
        console.error(e);
        res.json({note: e});
    })

}







function requestPromisePOST(parsedUrl, jsonDataString, path){
    let requestPromise = new Promise((resolve, reject)=>{ 
        const requestOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: path, 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': jsonDataString.length
            }
        };

        const request = http.request(requestOptions, (response) => {
            response.setEncoding('utf8');                   
            response.on('data', d => {
                process.stdout.write(d)
            });
        });
        
        request.on('error', error => {
            console.log(`statusCode: ${response.statusCode}`)
            console.error(error.message)
            reject(error.message)
        });
        
        //post the data
        request.write(jsonDataString);
        request.end(()=>{
            resolve(true)
        });            
    });

    return requestPromise;
}



function requestPromiseGET(parsedUrl, path){
    let requestPromise = new Promise((resolve, reject)=>{ 
        const requestOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: path, 
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Accept-Charset': 'utf-8',
            }
        };

        const request = http.request(requestOptions, (response) => {
            let rawData = '';
            response.setEncoding('utf8');                   
            response.on('data', d => {
                rawData += d;
            });

            response.on('end', ()=>{
                const parsedData = JSON.parse(rawData);
                resolve(parsedData)
            });    
        });

        request.on('error', error => {
            console.log(`statusCode: ${response.statusCode}`)
            console.error(error.message)
            reject(error.message)
        });

        request.end()
    });

    return requestPromise;
}




app.get('/consensus', (req, res)=>{     
    let regNodesPromises = [];

    for(let networkNodeUrl of bitcoin.networkNodes){           
        const parsedUrl = url.parse(networkNodeUrl); 
        const requestPromise = requestPromiseGET(parsedUrl, '/blockchain').catch(e=>{
            console.error('consensus ERROR:', e)
        })   

        //add promise 
        regNodesPromises.push(requestPromise);
    }


    //node response
    Promise.all(regNodesPromises).then((blockchains)=>{        
        const currentChainLength = bitcoin.chain.length;
        let maxChainLength = currentChainLength; 
        let newLongestChain = null;
        let newPendingTransactions = null;

        console.log('blockchains', blockchains)
        for(let blockchain of blockchains){
            if(blockchain.chain.length > maxChainLength){
                maxChainLength = blockchain.chain.length;
                newLongestChain = blockchain.chain;
                newPendingTransactions = blockchain.pendingTransactions
            }
        }

        //checks
        if(!newLongestChain || (newLongestChain && !bitcoin.chainIsValid(newLongestChain))){
            res.json({
                note: 'Current chain has not been replaced.',
                chain: bitcoin.chain
            })
        }else{
            bitcoin.chain = newLongestChain;
            bitcoin.pendingTransactions = newPendingTransactions;

            res.json({
                note: 'This chain has been replaced.',
                chain: bitcoin.chain
            })
        } 

    }).catch((e)=>{
        console.error(e);
        res.json({note: 'consensus ERROR:', e});
    })    
})



//endpoints for the client
app.get('/block/:blockHash', (req, res)=>{
    const blockHash = req.params.blockHash;
    const correctBlock = bitcoin.getBlock(blockHash);
    res.json({
        block: correctBlock
    });
})
app.get('/transaction/:transactionId', (req, res)=>{
    const transactionId = req.params.transactionId;
    const transactionData = bitcoin.getTransaction(transactionId);

    res.json({ 
        transaction: transactionData.transaction,
        block: transactionData.block
    })
})
app.get('/address/:address', (req, res)=>{
    const address = req.params.address;
    const addressData = bitcoin.getAddressData(address);

    res.json({
        addressData: addressData
    }) 
})




app.listen(port, ()=>{
    console.log(`Listening on port ${port}`)
})


process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    process.exit(1);
});




app.all('*', (req, res) => {
    return res.status(404).send('Not found')
})


