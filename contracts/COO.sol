/* solhint-disable no-empty-blocks */

pragma solidity 0.5.0;
pragma experimental ABIEncoderV2;

import "./openzeppelin/ERC721Full.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


/**
 * @title Certificate of Ownership
 * @dev This is our main contract
 */
contract COO is ERC721Full, Ownable {
    constructor() public ERC721Full(
        "Certificate Of Ownership",
        "COO"
    ) {
    }

    struct Certificate {
        uint256 assetId;
        string name;
        string label;
        uint256 price;
        uint256 timestamp;
        string factomEntryHash;
        string anotherEncryptionKey;
        string data;
    }

    Certificate[] internal certificates;

    /**
     * @dev Creates a new certificate and links it to the sender
     * @param newCertificate The new certificate to create
     */
    function createCertificate(
        Certificate memory newCertificate
    ) public {
        uint256 certificateId = certificates.push(
            Certificate({
                assetId: newCertificate.assetId,
                name: newCertificate.name,
                label: newCertificate.label,
                price: newCertificate.price,
                timestamp: newCertificate.timestamp,
                factomEntryHash: newCertificate.factomEntryHash,
                anotherEncryptionKey: newCertificate.anotherEncryptionKey,
                data: newCertificate.data
            })
        ) - 1;

        _mint(msg.sender, certificateId);
    }

    /**
     * @dev Updates the information of a certificate, can only be called by the certificate owner
     * @param certificateId The id of the certificate to update
     * @param name The new name of the asset
     * @param label The new label of the asset
     * @param price The new price of the asset
     * @param factomEntryHash The new factom entry hash of the asset
     * @param anotherEncryptionKey Another new encryption key
     * @param data The hash linked to the file containing the data
     */
    function updateCertificate(
        uint256 certificateId,
        string memory name,
        string memory label,
        uint256 price,
        string memory factomEntryHash,
        string memory anotherEncryptionKey,
        string memory data
    ) public {
        require(ownerOf(certificateId) == msg.sender, "Certificates can only be updated by their owners");

        certificates[certificateId].name = name;
        certificates[certificateId].label = label;
        certificates[certificateId].price = price;
        certificates[certificateId].factomEntryHash = factomEntryHash;
        certificates[certificateId].anotherEncryptionKey = anotherEncryptionKey;
        certificates[certificateId].data = data;
    }

    /**
     * @dev Gets a certificate and the related information, can only be called by the certificate owner
     * @param certificateId The id of a certificate
     * @return The required certificate
     */
    function getCertificate(
        uint256 certificateId
    ) public view returns (
        Certificate memory
    ) {
        return certificates[certificateId];
    }
}
