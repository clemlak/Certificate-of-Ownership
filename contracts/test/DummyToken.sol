pragma solidity 0.4.25;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


contract DummyToken is ERC20 {
    constructor() public {
        _mint(msg.sender, 21000000 * 10 ** 18);
    }
}
