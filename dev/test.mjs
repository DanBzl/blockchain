import Blockchain from "./blockchain.mjs";
import Wallet from "./wallet.mjs";


const bitcoin = new Blockchain();
const wallet = new Wallet();

const bc1 = {
    "chain": [
      {
        "index": 1,
        "timestamp": 1609538362678,
        "transactions": [],
        "nonce": 100,
        "hash": "0",
        "previousBlockHash": "0"
      },
      {
        "index": 2,
        "timestamp": 1609538451125,
        "transactions": [],
        "nonce": 18140,
        "hash": "0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100",
        "previousBlockHash": "0"
      },
      {
        "index": 3,
        "timestamp": 1609538452451,
        "transactions": [
          {
            "amount": 12.5,
            "sender": "00",
            "recipient": "685061ee14e84d0b96162003bd4f45aa",
            "transactionId": "9186a9e7af0648538f0961367683f5b7"
          }
        ],
        "nonce": 26099,
        "hash": "0000b02decb1526de2f8d6a5b5ea4d42a6647604e908687580d94be6e4bf803b",
        "previousBlockHash": "0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100"
      },
      {
        "index": 4,
        "timestamp": 1609538524607,
        "transactions": [
          {
            "amount": 12.5,
            "sender": "00",
            "recipient": "ae98ed0cb67f45578fbcd0928ba16822",
            "transactionId": "78b0a24a631a4a22bba103888c60f292"
          },
          {
            "amount": 30,
            "sender": "ASDFBFG345DFGDFG",
            "recipient": "ASDFsdfoG345DF88FG",
            "transactionId": "524ff2c6297c48ff85eea1d5db431f82"
          },
          {
            "amount": 30,
            "sender": "ASDFBFG345DFGDFG",
            "recipient": "ASDFsdfoG345DF88FG",
            "transactionId": "03cef3d540014c8083cdbbb1bbe7871c"
          },
          {
            "amount": 50,
            "sender": "ASDFBFG345DFGDFG",
            "recipient": "ASDFsdfoG345DF88FG",
            "transactionId": "e9d6478ee6504a1386aecc5d91078929"
          }
        ],
        "nonce": 12525,
        "hash": "0000f76f5163a25b97b14909f184ab2e62f136d7d048ca7f020c4efd139fe0be",
        "previousBlockHash": "0000b02decb1526de2f8d6a5b5ea4d42a6647604e908687580d94be6e4bf803b"
      },
      {
        "index": 5,
        "timestamp": 1609538538434,
        "transactions": [
          {
            "amount": 12.5,
            "sender": "00",
            "recipient": "c6530816084941edaaa0ae3267eb8305",
            "transactionId": "d4dc6b48ca7542d8b19521671184e377"
          }
        ],
        "nonce": 85165,
        "hash": "00006b2cbc8de3787623e9ba08c257f32e0809bdb6b3fad331b42218fea51a95",
        "previousBlockHash": "0000f76f5163a25b97b14909f184ab2e62f136d7d048ca7f020c4efd139fe0be"
      }
    ],
    "pendingTransaction": [
      {
        "amount": 12.5,
        "sender": "00",
        "recipient": "df7f13c06236432e871f7ab860c0d9d0",
        "transactionId": "585bdf8dd8ac497d81f228bd46dda782"
      }
    ],
    "currentNodeUrl": "http://localhost:3001",
    "networkNodes": []
  }

  console.log('VALID:', bitcoin.chainIsValid(bc1.chain))

// console.log('BIP32', wallet.generateKeys())