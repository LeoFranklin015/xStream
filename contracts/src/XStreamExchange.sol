// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IMarketKeeper} from "./interfaces/IMarketKeeper.sol";
import {PrincipalToken} from "./tokens/PrincipalToken.sol";
import {LPToken} from "./tokens/LPToken.sol";
import {PythAdapter} from "./PythAdapter.sol";

contract XStreamExchange is Ownable, ReentrancyGuard {
    struct PoolConfig {
        address xStock;
        bytes32 pythFeedId;
        uint256 usdcLiquidity;
        uint256 pxReserve;
        uint256 totalFees;
        uint256 openInterestLong;
        uint256 openInterestShort;
        address lpToken;
        uint256 maxLeverage;
    }

    struct Position {
        address trader;
        address pxToken;
        bool isLong;
        uint256 size;       // px units (1e18)
        uint256 entryPrice; // 1e18
        uint256 collateral; // USDC (6 dec)
        uint256 leverage;   // 1e18
        uint256 openedAt;
    }

    uint256 public constant TRADING_FEE_BPS = 5; // 0.05%
    uint256 public constant LIQUIDATION_REWARD_BPS = 1000; // 10%
    uint256 public constant HEALTH_FACTOR_THRESHOLD = 2e17; // 0.2
    uint256 public constant DEFAULT_MAX_LEVERAGE = 5e18;
    uint256 private constant SCALE_12 = 1e12; // USDC 6dec -> shares 18dec

    IERC20 public immutable usdc;
    PythAdapter public immutable pythAdapter;
    address public keeper;

    mapping(address pxToken => PoolConfig) public pools;
    mapping(bytes32 positionId => Position) public positions;
    mapping(address pxToken => bytes32[]) public openPositionIds;
    mapping(bytes32 positionId => uint256) internal positionIndex;

    bool public marketOpen;

    event PoolRegistered(address indexed xStock, address indexed pxToken, bytes32 pythFeedId);
    event LiquidityDeposited(address indexed provider, address indexed pxToken, uint256 usdcAmount, uint256 lpShares);
    event LiquidityWithdrawn(address indexed provider, address indexed pxToken, uint256 usdcReturned, uint256 lpShares);
    event PositionOpened(
        bytes32 indexed positionId, address indexed trader, address pxToken,
        bool isLong, uint256 size, uint256 entryPrice, uint256 collateral, uint256 leverage
    );
    event PositionClosed(bytes32 indexed positionId, uint256 exitPrice, int256 pnl, uint256 collateralReturned);
    event Liquidated(bytes32 indexed positionId, address liquidator, uint256 keeperReward, uint256 collateralSeized);
    event MarketOpened(uint256 timestamp);
    event MarketClosed(uint256 timestamp);

    error MarketNotOpen();
    error MarketAlreadyOpen();
    error PoolNotRegistered();
    error PoolAlreadyRegistered();
    error ExceedsMaxLeverage();
    error InsufficientLiquidity();
    error InsufficientPxReserve();
    error NotPositionOwner();
    error PositionNotLiquidatable();
    error OnlyKeeper();
    error NoOpenPositions();
    error HighUtilization();

    modifier onlyMarketOpen() {
        if (!marketOpen) revert MarketNotOpen();
        _;
    }

    modifier onlyKeeper() {
        if (msg.sender != keeper) revert OnlyKeeper();
        _;
    }

    constructor(address usdc_, address pythAdapter_) Ownable(msg.sender) {
        usdc = IERC20(usdc_);
        pythAdapter = PythAdapter(pythAdapter_);
    }

    function setKeeper(address keeper_) external onlyOwner {
        keeper = keeper_;
    }

    function setMarketOpen(bool open_) external onlyKeeper {
        marketOpen = open_;
        if (open_) {
            emit MarketOpened(block.timestamp);
        } else {
            emit MarketClosed(block.timestamp);
        }
    }

    // --- Pool management ---

    function registerPool(
        address xStock,
        address pxToken,
        bytes32 pythFeedId
    ) external onlyOwner {
        if (pools[pxToken].xStock != address(0)) revert PoolAlreadyRegistered();

        address lpToken = address(
            new LPToken(
                string.concat(PrincipalToken(pxToken).symbol(), " LP"),
                string.concat(PrincipalToken(pxToken).symbol(), "-LP"),
                address(this),
                false // non-transferable for v1
            )
        );

        pools[pxToken] = PoolConfig({
            xStock: xStock,
            pythFeedId: pythFeedId,
            usdcLiquidity: 0,
            pxReserve: 0,
            totalFees: 0,
            openInterestLong: 0,
            openInterestShort: 0,
            lpToken: lpToken,
            maxLeverage: DEFAULT_MAX_LEVERAGE
        });

        emit PoolRegistered(xStock, pxToken, pythFeedId);
    }

    function depositLiquidity(
        address pxToken,
        uint256 usdcAmount
    ) external nonReentrant returns (uint256 lpShares) {
        PoolConfig storage pool = pools[pxToken];
        if (pool.xStock == address(0)) revert PoolNotRegistered();

        LPToken lp = LPToken(pool.lpToken);
        uint256 totalShares = lp.totalSupply();

        if (totalShares == 0) {
            lpShares = usdcAmount * SCALE_12;
        } else {
            lpShares = usdcAmount * totalShares / pool.usdcLiquidity;
        }

        usdc.transferFrom(msg.sender, address(this), usdcAmount);
        pool.usdcLiquidity += usdcAmount;
        lp.mint(msg.sender, lpShares);

        emit LiquidityDeposited(msg.sender, pxToken, usdcAmount, lpShares);
    }

    function withdrawLiquidity(
        address pxToken,
        uint256 lpShares
    ) external nonReentrant returns (uint256 usdcReturned) {
        PoolConfig storage pool = pools[pxToken];
        if (pool.xStock == address(0)) revert PoolNotRegistered();

        LPToken lp = LPToken(pool.lpToken);
        uint256 totalShares = lp.totalSupply();

        usdcReturned = lpShares * pool.usdcLiquidity / totalShares;

        // Check that withdrawal does not leave pool underfunded for open positions
        uint256 remainingLiquidity = pool.usdcLiquidity - usdcReturned;
        if (remainingLiquidity < pool.openInterestLong / 5) revert HighUtilization();

        lp.burn(msg.sender, lpShares);
        pool.usdcLiquidity -= usdcReturned;
        usdc.transfer(msg.sender, usdcReturned);

        emit LiquidityWithdrawn(msg.sender, pxToken, usdcReturned, lpShares);
    }

    function depositPxReserve(
        address pxToken,
        uint256 amount
    ) external nonReentrant returns (uint256) {
        PoolConfig storage pool = pools[pxToken];
        if (pool.xStock == address(0)) revert PoolNotRegistered();

        IERC20(pxToken).transferFrom(msg.sender, address(this), amount);
        pool.pxReserve += amount;
        return amount; // 1:1 reserve tracking for v1
    }

    // --- Trading ---

    function openLong(
        address pxToken,
        uint256 collateral,
        uint256 leverage,
        bytes[] calldata pythUpdateData
    ) external payable onlyMarketOpen nonReentrant returns (bytes32 positionId) {
        positionId = _openPosition(pxToken, collateral, leverage, pythUpdateData, true);
    }

    function closeLong(
        bytes32 positionId,
        bytes[] calldata pythUpdateData
    ) external payable nonReentrant returns (int256 pnl) {
        Position storage pos = positions[positionId];
        if (pos.trader == address(0)) revert NotPositionOwner();
        if (pos.trader != msg.sender && msg.sender != keeper) revert NotPositionOwner();

        PoolConfig storage pool = pools[pos.pxToken];
        (uint256 exitPrice,) = pythAdapter.getPrice{value: msg.value}(pool.pythFeedId, pythUpdateData);

        pnl = _computePnl(pos.size, pos.entryPrice, exitPrice, true);
        uint256 collateralReturned = _settlePosition(pool, pos, pnl);

        _removeOpenPosition(pos.pxToken, positionId);
        uint256 notional = pos.size * pos.entryPrice / 1e18 / 1e12;
        pool.openInterestLong -= notional;

        emit PositionClosed(positionId, exitPrice, pnl, collateralReturned);
        delete positions[positionId];
    }

    function openShort(
        address pxToken,
        uint256 collateral,
        uint256 leverage,
        bytes[] calldata pythUpdateData
    ) external payable onlyMarketOpen nonReentrant returns (bytes32 positionId) {
        positionId = _openPosition(pxToken, collateral, leverage, pythUpdateData, false);
    }

    function closeShort(
        bytes32 positionId,
        bytes[] calldata pythUpdateData
    ) external payable nonReentrant returns (int256 pnl) {
        Position storage pos = positions[positionId];
        if (pos.trader == address(0)) revert NotPositionOwner();
        if (pos.trader != msg.sender && msg.sender != keeper) revert NotPositionOwner();

        PoolConfig storage pool = pools[pos.pxToken];
        (uint256 exitPrice,) = pythAdapter.getPrice{value: msg.value}(pool.pythFeedId, pythUpdateData);

        pnl = _computePnl(pos.size, pos.entryPrice, exitPrice, false);
        uint256 collateralReturned = _settlePosition(pool, pos, pnl);

        pool.pxReserve += pos.size;
        _removeOpenPosition(pos.pxToken, positionId);
        uint256 notional = pos.size * pos.entryPrice / 1e18 / 1e12;
        pool.openInterestShort -= notional;

        emit PositionClosed(positionId, exitPrice, pnl, collateralReturned);
        delete positions[positionId];
    }

    function liquidate(
        bytes32 positionId,
        bytes[] calldata pythUpdateData
    ) external payable nonReentrant returns (uint256 keeperReward) {
        keeperReward = _liquidate(positionId, pythUpdateData);
    }

    function liquidateByIndex(
        address pxToken,
        uint256 index,
        bytes[] calldata pythUpdateData
    ) external payable nonReentrant returns (uint256 keeperReward) {
        keeperReward = _liquidate(openPositionIds[pxToken][index], pythUpdateData);
    }

    function _liquidate(
        bytes32 positionId,
        bytes[] calldata pythUpdateData
    ) internal returns (uint256 keeperReward) {
        Position storage pos = positions[positionId];
        if (pos.trader == address(0)) revert NotPositionOwner();

        PoolConfig storage pool = pools[pos.pxToken];
        (uint256 exitPrice,) = pythAdapter.getPrice{value: msg.value}(pool.pythFeedId, pythUpdateData);

        int256 pnl = _computePnl(pos.size, pos.entryPrice, exitPrice, pos.isLong);

        // Check liquidation condition: healthFactor < 0.2
        if (pnl >= 0) revert PositionNotLiquidatable();
        uint256 loss = uint256(-pnl) / 1e12; // Convert to USDC decimals
        if (loss * 1e18 / pos.collateral < (1e18 - HEALTH_FACTOR_THRESHOLD)) {
            revert PositionNotLiquidatable();
        }

        uint256 remaining = pos.collateral > loss ? pos.collateral - loss : 0;
        keeperReward = remaining * LIQUIDATION_REWARD_BPS / 10000;
        uint256 toLPs = remaining - keeperReward;

        pool.usdcLiquidity += toLPs;
        if (pos.isLong) {
            uint256 notional = pos.size * pos.entryPrice / 1e18 / 1e12;
            pool.openInterestLong -= notional;
        } else {
            pool.pxReserve += pos.size;
            uint256 notional = pos.size * pos.entryPrice / 1e18 / 1e12;
            pool.openInterestShort -= notional;
        }

        _removeOpenPosition(pos.pxToken, positionId);

        if (keeperReward > 0) {
            usdc.transfer(msg.sender, keeperReward);
        }

        emit Liquidated(positionId, msg.sender, keeperReward, remaining);
        delete positions[positionId];
    }

    function settleAllPositions(
        address pxToken,
        bytes[] calldata pythUpdateData
    ) external payable onlyKeeper nonReentrant returns (uint256 positionsClosed, int256 netPnl) {
        PoolConfig storage pool = pools[pxToken];
        if (pool.xStock == address(0)) revert PoolNotRegistered();

        (uint256 exitPrice,) = pythAdapter.getPrice{value: msg.value}(pool.pythFeedId, pythUpdateData);

        bytes32[] storage ids = openPositionIds[pxToken];
        positionsClosed = ids.length;
        if (positionsClosed == 0) return (0, 0);

        for (uint256 i = ids.length; i > 0;) {
            unchecked { --i; }
            bytes32 posId = ids[i];
            Position storage pos = positions[posId];

            int256 pnl = _computePnl(pos.size, pos.entryPrice, exitPrice, pos.isLong);
            uint256 returned = _settlePosition(pool, pos, pnl);
            netPnl += pnl;

            if (!pos.isLong) {
                pool.pxReserve += pos.size;
            }

            uint256 notional = pos.size * pos.entryPrice / 1e18 / 1e12;
            if (pos.isLong) {
                pool.openInterestLong -= notional;
            } else {
                pool.openInterestShort -= notional;
            }

            emit PositionClosed(posId, exitPrice, pnl, returned);
            delete positions[posId];
            ids.pop();
        }
    }

    // --- Views ---

    function getPosition(bytes32 positionId) external view returns (Position memory) {
        return positions[positionId];
    }

    function getPoolConfig(address pxToken) external view returns (PoolConfig memory) {
        return pools[pxToken];
    }

    function getUnrealizedPnl(
        bytes32 positionId,
        bytes[] calldata pythUpdateData
    ) external payable returns (int256 pnl, uint256 currentPrice, bool isLiquidatable) {
        Position storage pos = positions[positionId];
        PoolConfig storage pool = pools[pos.pxToken];

        (currentPrice,) = pythAdapter.getPrice{value: msg.value}(pool.pythFeedId, pythUpdateData);
        pnl = _computePnl(pos.size, pos.entryPrice, currentPrice, pos.isLong);

        if (pnl < 0) {
            uint256 loss = uint256(-pnl) / 1e12;
            isLiquidatable = loss * 1e18 / pos.collateral >= (1e18 - HEALTH_FACTOR_THRESHOLD);
        }
    }

    function getOpenPositionCount(address pxToken) external view returns (uint256) {
        return openPositionIds[pxToken].length;
    }

    function setMaxLeverage(address pxToken, uint256 maxLev) external onlyOwner {
        pools[pxToken].maxLeverage = maxLev;
    }

    // --- Internal ---

    function _openPosition(
        address pxToken,
        uint256 collateral,
        uint256 leverage,
        bytes[] calldata pythUpdateData,
        bool isLong
    ) internal returns (bytes32 positionId) {
        PoolConfig storage pool = pools[pxToken];
        if (pool.xStock == address(0)) revert PoolNotRegistered();
        if (leverage > pool.maxLeverage) revert ExceedsMaxLeverage();

        (uint256 price,) = pythAdapter.getPrice{value: msg.value}(pool.pythFeedId, pythUpdateData);

        uint256 notional = collateral * leverage / 1e18;
        uint256 fee = notional * TRADING_FEE_BPS / 10000;
        uint256 size = notional * 1e12 * 1e18 / price;

        if (isLong) {
            if (pool.usdcLiquidity < notional) revert InsufficientLiquidity();
            pool.openInterestLong += notional;
        } else {
            if (pool.pxReserve < size) revert InsufficientPxReserve();
            pool.pxReserve -= size;
            pool.openInterestShort += notional;
        }

        usdc.transferFrom(msg.sender, address(this), collateral);
        pool.totalFees += fee;

        positionId = keccak256(abi.encode(msg.sender, pxToken, block.timestamp));
        positions[positionId] = Position({
            trader: msg.sender,
            pxToken: pxToken,
            isLong: isLong,
            size: size,
            entryPrice: price,
            collateral: collateral - fee,
            leverage: leverage,
            openedAt: block.timestamp
        });

        _addOpenPosition(pxToken, positionId);
        _emitPositionOpened(positionId);
    }

    function _emitPositionOpened(bytes32 positionId) internal {
        Position storage p = positions[positionId];
        emit PositionOpened(
            positionId, p.trader, p.pxToken, p.isLong,
            p.size, p.entryPrice, p.collateral, p.leverage
        );
    }

    function _computePnl(
        uint256 size,
        uint256 entryPrice,
        uint256 exitPrice,
        bool isLong
    ) internal pure returns (int256) {
        if (isLong) {
            return int256(size) * (int256(exitPrice) - int256(entryPrice)) / int256(1e18);
        } else {
            return int256(size) * (int256(entryPrice) - int256(exitPrice)) / int256(1e18);
        }
    }

    function _settlePosition(
        PoolConfig storage pool,
        Position storage pos,
        int256 pnl
    ) internal returns (uint256 collateralReturned) {
        int256 pnlUsdc = pnl / 1e12; // 1e18 pnl -> 1e6 USDC

        if (pnlUsdc >= 0) {
            // Trader profits: LP pool pays
            uint256 profit = uint256(pnlUsdc);
            collateralReturned = pos.collateral + profit;
            pool.usdcLiquidity -= profit;
        } else {
            // Trader loses: collateral absorbed by LP pool
            uint256 loss = uint256(-pnlUsdc);
            if (loss >= pos.collateral) {
                collateralReturned = 0;
                pool.usdcLiquidity += pos.collateral;
            } else {
                collateralReturned = pos.collateral - loss;
                pool.usdcLiquidity += loss;
            }
        }

        if (collateralReturned > 0) {
            usdc.transfer(pos.trader, collateralReturned);
        }
    }

    function _addOpenPosition(address pxToken, bytes32 positionId) internal {
        positionIndex[positionId] = openPositionIds[pxToken].length;
        openPositionIds[pxToken].push(positionId);
    }

    function _removeOpenPosition(address pxToken, bytes32 positionId) internal {
        bytes32[] storage ids = openPositionIds[pxToken];
        uint256 idx = positionIndex[positionId];
        uint256 lastIdx = ids.length - 1;

        if (idx != lastIdx) {
            bytes32 lastId = ids[lastIdx];
            ids[idx] = lastId;
            positionIndex[lastId] = idx;
        }

        ids.pop();
        delete positionIndex[positionId];
    }
}
