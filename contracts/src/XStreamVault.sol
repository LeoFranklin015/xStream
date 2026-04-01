// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IXStock} from "./interfaces/IXStock.sol";
import {IXStreamVault} from "./interfaces/IXStreamVault.sol";
import {PrincipalToken} from "./tokens/PrincipalToken.sol";
import {DividendToken} from "./tokens/DividendToken.sol";

contract XStreamVault is IXStreamVault, Ownable, Pausable, ReentrancyGuard {
    struct AssetConfig {
        address principalToken;
        address dividendToken;
        bytes32 pythFeedId;
        uint256 lastMultiplier;
        uint256 accDivPerShare; // 1e36 precision
        uint256 totalDeposited;
        uint256 minDepositAmount;
    }

    mapping(address xStock => AssetConfig) public assets;
    mapping(address dxToken => address xStock) public dxToXStock;
    mapping(address user => mapping(address xStock => uint256)) public rewardDebt;

    event AssetRegistered(
        address indexed xStock,
        address principalToken,
        address dividendToken,
        bytes32 pythFeedId
    );
    event Deposited(address indexed user, address indexed xStock, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed user, address indexed xStock, uint256 amount, uint256 dividendClaimed);
    event DividendClaimed(address indexed user, address indexed xStock, uint256 claimed);
    event DividendSynced(address indexed xStock, uint256 delta, uint256 newAccDivPerShare);

    error AssetAlreadyRegistered();
    error AssetNotRegistered();
    error MinDepositNotMet();
    error InsufficientBalance();
    error OnlyDxToken();

    constructor() Ownable(msg.sender) {}

    function registerAsset(
        address xStock,
        bytes32 pythFeedId,
        string calldata name
    ) external onlyOwner returns (address principalToken, address dividendToken) {
        if (assets[xStock].principalToken != address(0)) revert AssetAlreadyRegistered();

        principalToken = address(
            new PrincipalToken(
                string.concat(name, " Principal Token"),
                string.concat(name, "px"),
                address(this)
            )
        );

        dividendToken = address(
            new DividendToken(
                string.concat(name, " Dividend Token"),
                string.concat(name, "dx"),
                address(this),
                xStock
            )
        );

        uint256 currentMultiplier = IXStock(xStock).multiplier();

        assets[xStock] = AssetConfig({
            principalToken: principalToken,
            dividendToken: dividendToken,
            pythFeedId: pythFeedId,
            lastMultiplier: currentMultiplier,
            accDivPerShare: 0,
            totalDeposited: 0,
            minDepositAmount: 0
        });

        dxToXStock[dividendToken] = xStock;

        emit AssetRegistered(xStock, principalToken, dividendToken, pythFeedId);
    }

    function deposit(
        address xStock,
        uint256 amount
    ) external whenNotPaused nonReentrant {
        AssetConfig storage config = assets[xStock];
        if (config.principalToken == address(0)) revert AssetNotRegistered();
        if (amount < config.minDepositAmount) revert MinDepositNotMet();

        _syncDividend(xStock);

        IERC20(xStock).transferFrom(msg.sender, address(this), amount);
        PrincipalToken(config.principalToken).mint(msg.sender, amount);
        DividendToken(config.dividendToken).mint(msg.sender, amount);

        rewardDebt[msg.sender][xStock] =
            DividendToken(config.dividendToken).balanceOf(msg.sender) *
            config.accDivPerShare / 1e36;

        config.totalDeposited += amount;

        emit Deposited(msg.sender, xStock, amount, block.timestamp);
    }

    function withdraw(
        address xStock,
        uint256 amount
    ) external whenNotPaused nonReentrant {
        AssetConfig storage config = assets[xStock];
        if (config.principalToken == address(0)) revert AssetNotRegistered();

        PrincipalToken px = PrincipalToken(config.principalToken);
        DividendToken dx = DividendToken(config.dividendToken);

        if (px.balanceOf(msg.sender) < amount || dx.balanceOf(msg.sender) < amount) {
            revert InsufficientBalance();
        }

        _syncDividend(xStock);
        uint256 claimed = _claimDividend(msg.sender, xStock);

        px.burn(msg.sender, amount);
        dx.burn(msg.sender, amount);

        // Update reward debt for remaining dx balance
        rewardDebt[msg.sender][xStock] =
            dx.balanceOf(msg.sender) * config.accDivPerShare / 1e36;

        config.totalDeposited -= amount;
        IERC20(xStock).transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, xStock, amount, claimed);
    }

    function claimDividend(address xStock) external nonReentrant returns (uint256 claimed) {
        AssetConfig storage config = assets[xStock];
        if (config.principalToken == address(0)) revert AssetNotRegistered();

        _syncDividend(xStock);
        claimed = _claimDividend(msg.sender, xStock);
    }

    function syncDividend(address xStock) external returns (uint256 delta) {
        if (assets[xStock].principalToken == address(0)) revert AssetNotRegistered();
        delta = _syncDividend(xStock);
    }

    function pendingDividend(address xStock, address user) external view returns (uint256) {
        AssetConfig storage config = assets[xStock];
        uint256 dxBalance = DividendToken(config.dividendToken).balanceOf(user);
        if (dxBalance == 0) return 0;

        uint256 accumulated = dxBalance * config.accDivPerShare / 1e36;
        uint256 debt = rewardDebt[user][xStock];
        return accumulated > debt ? accumulated - debt : 0;
    }

    function getAssetConfig(address xStock) external view returns (AssetConfig memory) {
        return assets[xStock];
    }

    function getRewardDebt(address xStock, address user) external view returns (uint256) {
        return rewardDebt[user][xStock];
    }

    function setMinDepositAmount(address xStock, uint256 amount) external onlyOwner {
        assets[xStock].minDepositAmount = amount;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Called by DividendToken on transfer to handle dividend accounting
    function onDxTransfer(
        address xStock,
        address from,
        uint256 fromBalanceBefore,
        address to,
        uint256 toBalanceBefore,
        uint256 amount
    ) external override {
        if (dxToXStock[msg.sender] != xStock) revert OnlyDxToken();

        AssetConfig storage config = assets[xStock];

        // Claim for sender based on current balance
        if (fromBalanceBefore > 0) {
            uint256 pendingFrom = fromBalanceBefore * config.accDivPerShare / 1e36
                - rewardDebt[from][xStock];
            if (pendingFrom > 0) {
                IERC20(xStock).transfer(from, pendingFrom);
                emit DividendClaimed(from, xStock, pendingFrom);
            }
        }

        // Claim for receiver based on current balance
        if (toBalanceBefore > 0) {
            uint256 pendingTo = toBalanceBefore * config.accDivPerShare / 1e36
                - rewardDebt[to][xStock];
            if (pendingTo > 0) {
                IERC20(xStock).transfer(to, pendingTo);
                emit DividendClaimed(to, xStock, pendingTo);
            }
        }

        // Reset reward debt based on new balances (after transfer)
        uint256 fromBalanceAfter = fromBalanceBefore - amount;
        uint256 toBalanceAfter = toBalanceBefore + amount;

        rewardDebt[from][xStock] = fromBalanceAfter * config.accDivPerShare / 1e36;
        rewardDebt[to][xStock] = toBalanceAfter * config.accDivPerShare / 1e36;
    }

    function _syncDividend(address xStock) internal returns (uint256 delta) {
        AssetConfig storage config = assets[xStock];
        if (config.totalDeposited == 0) {
            config.lastMultiplier = IXStock(xStock).multiplier();
            return 0;
        }

        uint256 currentMultiplier = IXStock(xStock).multiplier();
        if (currentMultiplier <= config.lastMultiplier) {
            return 0;
        }

        delta = (currentMultiplier - config.lastMultiplier) * config.totalDeposited / 1e18;
        config.accDivPerShare += delta * 1e36 / config.totalDeposited;
        config.lastMultiplier = currentMultiplier;

        emit DividendSynced(xStock, delta, config.accDivPerShare);
    }

    function _claimDividend(address user, address xStock) internal returns (uint256 claimed) {
        AssetConfig storage config = assets[xStock];
        uint256 dxBalance = DividendToken(config.dividendToken).balanceOf(user);
        if (dxBalance == 0) return 0;

        uint256 accumulated = dxBalance * config.accDivPerShare / 1e36;
        uint256 debt = rewardDebt[user][xStock];

        if (accumulated > debt) {
            claimed = accumulated - debt;
            rewardDebt[user][xStock] = accumulated;
            IERC20(xStock).transfer(user, claimed);
            emit DividendClaimed(user, xStock, claimed);
        }
    }
}
