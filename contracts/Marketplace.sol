pragma solidity 0.4.25;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC721/IERC721.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


contract Marketplace is Ownable, Pausable {
    address public tokenContractAddress;
    address public cooContractAddress;

    constructor(address initialTokenContractAddress, address initialCooContractAddress) public {
        tokenContractAddress = initialTokenContractAddress;
        cooContractAddress = initialCooContractAddress;
    }

    enum Status { Open, Completed, Canceled }

    struct Order {
        Status status;
        address seller;
        address buyer;
        uint256 price;
        uint256 certificateId;
        uint256 expiresAt;
    }

    Order[] public orders;

    mapping (address => uint256[]) public ordersToSellers;
    mapping (address => uint256[]) public ordersToBuyers;

    event LogOrderCreated(
        uint256 orderId,
        address indexed seller
    );

    event LogOrderCompleted(
        uint256 orderId,
        address indexed buyer
    );

    event LogOrderCanceled(
        uint256 orderId
    );

    function setTokenContractAddress(address newTokenContractAddress) external onlyOwner() whenPaused() {
        require(newTokenContractAddress != address(0), "New token contract address is invalid");

        tokenContractAddress = newTokenContractAddress;
    }

    function setCooContractAddress(address newCooContractAddress) external onlyOwner() whenPaused() {
        require(newCooContractAddress != address(0), "New token contract address is invalid");

        cooContractAddress = newCooContractAddress;
    }

    function createOrder(uint256 certificateId, uint256 price, uint256 expiresAt) external whenNotPaused() {
        IERC721 cooContract = IERC721(cooContractAddress);

        require(
            cooContract.ownerOf(certificateId) == msg.sender,
            "Sender is not the owner of the certificate"
        );

        require(
            cooContract.getApproved(certificateId) == address(this),
            "Contract is not allowed to manipulate certificate"
        );

        uint256 orderId = orders.push(
            Order({
                status: Status.Open,
                seller: msg.sender,
                buyer: address(0),
                price: price,
                certificateId: certificateId,
                expiresAt: expiresAt
            })
        ) - 1;

        ordersToSellers[msg.sender].push(orderId);

        emit LogOrderCreated(orderId, msg.sender);
    }

    function cancelOrder(uint256 orderId) external whenNotPaused() {
        require(
            orders[orderId].seller == msg.sender,
            "You cannot cancel this order"
        );

        require(
            orders[orderId].status == Status.Open,
            "Order is not open anymore"
        );

        orders[orderId].status = Status.Canceled;

        emit LogOrderCanceled(orderId);
    }

    function executeOrder(uint256 orderId) external whenNotPaused() {
        IERC20 tokenContract = IERC20(tokenContractAddress);
        IERC721 cooContract = IERC721(cooContractAddress);

        require(
            orders[orderId].seller != msg.sender,
            "You cannot execute your own order"
        );

        require(
            orders[orderId].status == Status.Open,
            "Order is not open anymore"
        );

        require(
            orders[orderId].expiresAt > now,
            "Order has expired"
        );

        require(
            cooContract.getApproved(orders[orderId].certificateId) == address(this),
            "Contract is not allowed to manipulate certificate"
        );

        require(
            tokenContract.allowance(msg.sender, address(this)) >= orders[orderId].price,
            "Contract is not allowed to manipulate buyer funds"
        );

        require(
            tokenContract.transferFrom(msg.sender, orders[orderId].seller, orders[orderId].price),
            "Contract could not transfer the funds"
        );

        cooContract.transferFrom(orders[orderId].seller, msg.sender, orders[orderId].certificateId);

        orders[orderId].buyer = msg.sender;
        orders[orderId].status = Status.Completed;

        emit LogOrderCompleted(orderId, msg.sender);
    }

}
