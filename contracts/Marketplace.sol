/* solhint-disable not-rely-on-time */
pragma solidity 0.4.25;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC721/IERC721.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title Marketplace contract
 * @dev This contract handles how certificates can be traded
 */
contract Marketplace is Ownable, Pausable {
    address public tokenContractAddress;
    address public cooContractAddress;

    constructor(address initialTokenContractAddress, address initialCooContractAddress) public {
        tokenContractAddress = initialTokenContractAddress;
        cooContractAddress = initialCooContractAddress;
    }

    enum Status { Open, Completed, Canceled }

    /**
     * Sales are instantaneous orders
     */
    struct Sale {
        uint256 price;
        uint256 certificateId;
        uint256 expiresAt;
        Status status;
        address seller;
        address buyer;
    }

    Sale[] public sales;

    mapping (address => uint256[]) public salesToSellers;
    mapping (address => uint256[]) public salesToBuyers;

    /**
     * @dev Emitted when a new sale has been created
     * @param saleId The id of the sale
     * @param seller The address of the seller
     */
    event SaleCreated(
        uint256 saleId,
        address indexed seller
    );

    /**
     * @dev Emitted when a sale has been completed
     * @param saleId The id of the sale
     * @param buyer The address of the buyer
     */
    event SaleCompleted(
        uint256 saleId,
        address indexed buyer
    );

    /**
     * @dev Emitted when a sale has been canceled
     * @param saleId The id of the sale
     */
    event SaleCanceled(
        uint256 saleId
    );

    /**
     * Orders can be auctions too
     */
    struct Auction {
        Status status;
        address seller;
        address buyer;
        uint256 startingPrice;
        uint256 currentBid;
        uint256 certificateId;
        uint256 expiresAt;
    }

    Auction[] public auctions;

    mapping (address => uint256[]) public auctionsToSellers;
    mapping (address => uint256[]) public auctionsToBuyers;

    /**
     * @dev Emitted when a new auction has been created
     * @param auctionId The id of the auction
     * @param seller The address of the seller
     */
    event AuctionCreated(
        uint256 auctionId,
        address indexed seller
    );

    /**
     * @dev Emitted when a new bid has been made
     * @param auctionId The id of the auction
     * @param bidder The address of the bidder
     * @param currentBid The amount of the bid
     */
    event NewBid(
        uint256 auctionId,
        address bidder,
        uint256 currentBid
    );

    /**
     * @dev Emitted when an auction has been completed
     * @param auctionId The id of the auction
     * @param buyer The address of the buyer
     * @param price The final price of the auction
     */
    event AuctionCompleted(
        uint256 auctionId,
        address indexed buyer,
        uint256 price
    );

    /**
     * @dev Emitted when an auction has been canceled
     * @param auctionId The id of the auction
     */
    event AuctionCanceled(
        uint256 auctionId
    );

    /**
     * @dev Updates the address of the token contract
     * @param newTokenContractAddress The new address of the token contract
     */
    function setTokenContractAddress(address newTokenContractAddress) external onlyOwner() whenPaused() {
        require(newTokenContractAddress != address(0), "New token contract address is invalid");

        tokenContractAddress = newTokenContractAddress;
    }

    /**
     * @dev Updates the address of the COO contract
     * @param newCooContractAddress The new address of the COO contract
     */
    function setCooContractAddress(address newCooContractAddress) external onlyOwner() whenPaused() {
        require(newCooContractAddress != address(0), "New token contract address is invalid");

        cooContractAddress = newCooContractAddress;
    }

    /**
     * @dev Creates a new sale
     * @param certificateId The id of the certificate
     * @param price The expected price
     * @param expiresAt The expiry date of the sale (as a timestamp)
     */
    function createSale(uint256 certificateId, uint256 price, uint256 expiresAt) external whenNotPaused() {
        IERC721 cooContract = IERC721(cooContractAddress);

        require(
            cooContract.ownerOf(certificateId) == msg.sender,
            "Sender is not the owner of the certificate"
        );

        require(
            cooContract.getApproved(certificateId) == address(this),
            "Contract is not allowed to manipulate certificate"
        );

        uint256 saleId = sales.push(
            Sale({
                status: Status.Open,
                seller: msg.sender,
                buyer: address(0),
                price: price,
                certificateId: certificateId,
                expiresAt: expiresAt
            })
        ) - 1;

        salesToSellers[msg.sender].push(saleId);

        emit SaleCreated(saleId, msg.sender);
    }

    /**
     * @dev Cancels a sale
     * @param saleId The id of the sale
     */
    function cancelSale(uint256 saleId) external whenNotPaused() {
        require(
            sales[saleId].seller == msg.sender,
            "You cannot cancel this sale"
        );

        require(
            sales[saleId].status == Status.Open,
            "Sale is not open anymore"
        );

        sales[saleId].status = Status.Canceled;

        emit SaleCanceled(saleId);
    }

    /**
     * @dev Executes a sale
     * @param saleId The id of the sale
     */
    function executeSale(uint256 saleId) external whenNotPaused() {
        IERC20 tokenContract = IERC20(tokenContractAddress);
        IERC721 cooContract = IERC721(cooContractAddress);

        require(
            sales[saleId].seller != msg.sender,
            "You cannot execute your own sale"
        );

        require(
            sales[saleId].status == Status.Open,
            "Sale is not open anymore"
        );

        require(
            now > sales[saleId].expiresAt,
            "Sale has expired"
        );

        require(
            cooContract.getApproved(sales[saleId].certificateId) == address(this),
            "Contract is not allowed to manipulate certificate"
        );

        require(
            tokenContract.allowance(msg.sender, address(this)) >= sales[saleId].price,
            "Contract is not allowed to manipulate buyer funds"
        );

        require(
            tokenContract.transferFrom(msg.sender, sales[saleId].seller, sales[saleId].price),
            "Contract could not transfer the funds"
        );

        cooContract.transferFrom(sales[saleId].seller, msg.sender, sales[saleId].certificateId);

        sales[saleId].buyer = msg.sender;
        sales[saleId].status = Status.Completed;

        emit SaleCompleted(saleId, msg.sender);
    }

    /**
     * @dev Creates an auction
     * @param certificateId The id of the certificate
     * @param startingPrice The starting price of the auction
     * @param expiresAt The expiry date of the auction
     */
    function createAuction(uint256 certificateId, uint256 startingPrice, uint256 expiresAt) external whenNotPaused() {
        IERC721 cooContract = IERC721(cooContractAddress);

        require(
            cooContract.ownerOf(certificateId) == msg.sender,
            "Sender is not the owner of the certificate"
        );

        require(
            cooContract.getApproved(certificateId) == address(this),
            "Contract is not allowed to manipulate certificate"
        );

        uint256 auctionId = auctions.push(
            Auction({
                status: Status.Open,
                seller: msg.sender,
                buyer: address(0),
                startingPrice: startingPrice,
                currentBid: 0,
                certificateId: certificateId,
                expiresAt: expiresAt
            })
        ) - 1;

        auctionsToSellers[msg.sender].push(auctionId);

        emit AuctionCreated(auctionId, msg.sender);
    }

    /**
     * @dev Cancels an auction
     * @param auctionId The id of the auction
     */
    function cancelAuction(uint256 auctionId) external whenNotPaused() {
        require(
            auctions[auctionId].seller == msg.sender,
            "You cannot cancel this auction"
        );

        require(
            auctions[auctionId].status == Status.Open,
            "Auction is not open anymore"
        );

        auctions[auctionId].status = Status.Canceled;

        emit AuctionCanceled(auctionId);
    }

    /**
     * @dev Executes an auction (Makes a new bid)
     * @param auctionId The id of the auction
     * @param amount The amount to bid
     */
    function executeAuction(uint256 auctionId, uint256 amount) external whenNotPaused() {
        IERC20 tokenContract = IERC20(tokenContractAddress);
        IERC721 cooContract = IERC721(cooContractAddress);

        require(
            auctions[auctionId].seller != msg.sender,
            "You cannot bid on your own auction"
        );

        require(
            auctions[auctionId].status == Status.Open,
            "Auction is not open anymore"
        );

        require(
            now > auctions[auctionId].expiresAt,
            "Auction has expired"
        );

        require(
            amount >= auctions[auctionId].startingPrice && amount > auctions[auctionId].currentBid,
            "Amount must be higher"
        );

        require(
            cooContract.getApproved(auctions[auctionId].certificateId) == address(this),
            "Contract is not allowed to manipulate certificate"
        );

        require(
            tokenContract.allowance(msg.sender, address(this)) >= amount,
            "Contract is not allowed to manipulate buyer funds"
        );

        auctions[auctionId].currentBid = amount;
        auctions[auctionId].buyer = msg.sender;

        emit NewBid(auctionId, msg.sender, amount);
    }

    /**
     * @dev Completes an auction (to claim the certificate)
     * @param auctionId The id of the auction
     */
    function completeAuction(uint256 auctionId) external whenNotPaused() {
        IERC20 tokenContract = IERC20(tokenContractAddress);
        IERC721 cooContract = IERC721(cooContractAddress);

        require(
            auctions[auctionId].status == Status.Open,
            "Auction is not open anymore"
        );

        require(
            auctions[auctionId].expiresAt < now,
            "Auction has not expired yet"
        );

        require(
            cooContract.getApproved(auctions[auctionId].certificateId) == address(this),
            "Contract is not allowed to manipulate certificate"
        );

        require(
            tokenContract.allowance(msg.sender, address(this)) >= auctions[auctionId].currentBid,
            "Contract is not allowed to manipulate buyer funds"
        );

        require(
            tokenContract.transferFrom(msg.sender, auctions[auctionId].seller, auctions[auctionId].currentBid),
            "Contract could not transfer the funds"
        );

        cooContract.transferFrom(auctions[auctionId].seller, msg.sender, auctions[auctionId].certificateId);

        auctions[auctionId].buyer = msg.sender;
        auctions[auctionId].status = Status.Completed;

        emit AuctionCompleted(auctionId, msg.sender, auctions[auctionId].currentBid);
    }

    /**
     * @dev Gets all the sales
     * @return An array containing the id of all the sales
     */
    function getSales() external view returns (uint256[]) {
        return sales;
    }

    /**
     * @dev Gets all the auctions
     * @return An array containing the id of all the auctions
     */
    function getAuctions() external view returns (uint256[]) {
        return auctions;
    }
}
