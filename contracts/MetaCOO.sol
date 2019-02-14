pragma solidity 0.5.0;
pragma experimental ABIEncoderV2;

import "./COO.sol";


/**
 * @title Certificate of Ownership Meta Transactions
 * @dev This contract handles our meta-transactions
 */
contract MetaCOO is COO {
    mapping (address => uint256) public nonces;

    function metaTransfer(bytes memory signature, address to, uint256 tokenId, uint256 nonce) public {
        bytes32 hash = metaTransferHash(to, tokenId, nonce);
        address signer = getSigner(hash, signature);

        require(signer != address(0), "Cannot get the signer");
        require(nonce == nonces[signer], "Meta transaction has already been used");

        nonces[signer] += 1;

        _transferFrom(signer, to, tokenId);
    }

    function metaTransferHash(address to, uint256 tokenId, uint256 nonce) public view returns (bytes32) {
        return keccak256(abi.encodePacked(address(this), "metaTransfer", to, tokenId, nonce));
    }

    /**
     * @dev Gets the signer of an hash using the signature
     * @param hash The hash to check
     * @param signature The signature to use
     * @return The address of the signer or 0x0 address is something went wrong
     */
    function getSigner(bytes32 hash, bytes memory signature) internal pure returns (address) {
        bytes32 r;
        bytes32 s;
        uint8 v;

        if (signature.length != 65) {
            return address(0);
        }

        /* solhint-disable-next-line no-inline-assembly */
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        if (v < 27) {
            v += 27;
        }

        if (v != 27 && v != 28) {
            return address(0);
        } else {
            return ecrecover(keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
            ), v, r, s);
        }
    }
}
