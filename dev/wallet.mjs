
import crypto from 'crypto';
// import bip32 from 'bip32';



class Wallet{
    constructor(){
        // Generate Alice's keys...
        const ec = crypto.createECDH('secp521r1');

        const aliceKeys = ec.generateKeys();
        
        const hybridPubKey = ec.getPublicKey('hex', 'hybrid');
        const hybridPrivKey = ec.getPrivateKey('hex', 'hybrid');

        
        console.log('')
        console.log('alices privKey', hybridPubKey)
        console.log('')
        console.log('alices pubKey', hybridPrivKey)
    }

    

    // generateKeys(){
    //     let node = bip32.fromBase58('xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi')
    //     let child = node.derivePath('m/0/0');
    //     return child;
    // }


}


export default Wallet;
























