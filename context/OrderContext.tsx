import React, { useEffect, useContext, useReducer, useMemo } from 'react';
import { TracerContext, Web3Context } from './';
import { Children, OpenOrder, UserBalance } from 'types';
import { calcMinimumMargin, calcTotalMargin, calcSlippage } from '@tracer-protocol/tracer-utils';
import { BigNumber } from 'bignumber.js';
import { OMEContext } from './OMEContext';
import { OMEOrder } from 'types/OrderTypes';
import { FlatOrder } from '@tracer-protocol/tracer-utils/dist/Types/accounting';
import { defaults, defaults as tracerDefaults } from '@libs/Tracer';
import { ErrorKey } from '@components/General/Error';

// Position types
export const LONG = 0;
export const SHORT = 1;
// Adjust types
export const ADJUST = 0;
export const CLOSE = 1;
// Order types
export const MARKET = 0;
export const LIMIT = 1;

/**
 * Returns the Error ID relating to the mapping above
 * These do not need to be in numeric order. It doesnt really matter.
 * @param balances
 * @param orders
 * @returns
 */
const checkErrors: (
    balances: UserBalance | undefined,
    orders: OMEOrder[],
    account: string | undefined,
    order: OrderState,
    fairPrice: BigNumber | undefined,
    maxLeverage: BigNumber | undefined,
) => ErrorKey = (balances, orders, account, order, fairPrice, maxLeverage) => {
    const priceBN = order.orderType === LIMIT ? new BigNumber(order.price) : fairPrice ?? tracerDefaults.fairPrice;
    const { quote: newQuote, base: newBase } = order.nextPosition;
    if (!account) {
        return 'ACCOUNT_DISCONNECTED';
    } else if (orders?.length === 0 && order.orderType === MARKET && order.exposure) {
        // there are no orders
        return 'NO_ORDERS';
    } else if (!balances?.base.eq(0) && order.orderType === MARKET && !order.advanced) {
        // user has a position already
        return 'NO_POSITION';
    } else if (balances?.tokenBalance.eq(0) && !order.advanced) {
        // ignore if on advanced
        // user has no web3 wallet balance
        return 'NO_WALLET_BALANCE';
    } else if (balances?.quote.eq(0) && order.exposure && order.price) {
        // user has no tcr margin balance
        return 'NO_MARGIN_BALANCE';
    } else if (
        calcTotalMargin(newQuote, newBase, priceBN).lt(
            calcMinimumMargin(newQuote, newBase, priceBN, maxLeverage ?? tracerDefaults.maxLeverage),
        )
    ) {
        return 'INVALID_ORDER';
    } else {
        return 'NO_ERROR';
    }
};

export const orderDefaults = {
    order: {
        market: 'Market', // exposed market asset
        collateral: 'USD', // collateral asset
        amountToPay: NaN, // required margin / amount of margin being used
        exposure: NaN,
        // Bignumber representation of exposure. These will not differ as it is set in setExposure
        // Implemented this way to avoid complications with the exposure input and bignumbers
        exposureBN: new BigNumber(0),
        leverage: NaN, // defaults 0 leverage
        position: LONG, // long or short, 1 long, 0 is short
        price: NaN, // price of the market asset in relation to the collateral asset
        orderType: MARKET, // orderType
        adjustType: ADJUST,
        nextPosition: {
            quote: new BigNumber(0),
            base: new BigNumber(0),
        },
        oppositeOrders: [],
        error: 'NO_ERROR',
        wallet: 0,
        lockAmountToPay: false, // deprecated with basic trade
        advanced: false,
        slippage: 0,
        marketTradePrice: new BigNumber(0),
    },
};

export type OrderState = {
    market: string; // exposed market asset
    collateral: string; // collateral asset
    amountToPay: number; // required margin / amount of margin being used
    exposure: number;
    exposureBN: BigNumber;
    leverage: number; // value used for when adjusting leverage
    position: number; // long or short, 0 is short, 1 is long
    price: number; // price of the market asset in relation to the collateral asset
    orderType: number; // for basic this will always be 0 (market order), 1 is limit and 2 is spot
    adjustType: number; // selection for adjust order 0 (adjust), 1 (close)
    nextPosition: {
        base: BigNumber;
        quote: BigNumber;
    };
    oppositeOrders: FlatOrder[];
    error: ErrorKey; // number ID relating to the error map above
    wallet: number; // ID of corresponding wallet in use 0 -> web3, 1 -> TCR margin
    // boolean to tell if the amount to buy or amount to pay inputs are locked. eg
    //  by changing the amount to pay field it should update the amount to buy and vice versa.
    //  The lock helps avoiding infinite loops when setting these values
    lockAmountToPay: boolean;
    advanced: boolean; // boolean to check if on basic or advanced page
    slippage: number;
    marketTradePrice: BigNumber; // trade price calculated when fetching slippage
};

interface ContextProps {
    oppositeOrders: OpenOrder[];
    order: OrderState;
    orderDispatch: React.Dispatch<OrderAction>;
    reset: () => void;
}

/**
 * This class is used to control the order hooks throughout making a trade
 *
 */
export const OrderContext = React.createContext<Partial<ContextProps>>({});

export type OrderAction =
    | { type: 'setMarket'; value: string }
    | { type: 'setCollateral'; value: string }
    | { type: 'setAmountToPay'; value: number }
    | { type: 'setExposure'; value: number }
    | { type: 'setMaxExposure' }
    | { type: 'setBestPrice' }
    | { type: 'setMaxClosure' }
    | { type: 'setExposureFromLeverage'; leverage: number }
    | {
          type: 'setLeverageFromExposure';
          amount: number;
      }
    | { type: 'setSlippage'; value: number }
    | { type: 'setMarketTradePrice'; value: BigNumber }
    | { type: 'setLeverage'; value: number }
    | { type: 'setLeverage'; value: number }
    | { type: 'setPosition'; value: number }
    | {
          type: 'setNextPosition';
          nextPosition: {
              base: BigNumber;
              quote: BigNumber;
          };
      }
    | { type: 'setPrice'; value: number }
    | { type: 'setOrderType'; value: number }
    | { type: 'setAdjustType'; value: number }
    | { type: 'setError'; value: ErrorKey }
    | { type: 'setWallet'; value: number }
    | { type: 'setLock'; value: boolean }
    | { type: 'setAdvanced'; value: boolean }
    | { type: 'setOppositeOrders'; orders: FlatOrder[] };

// amountToPay => require margin
export const OrderStore: React.FC<Children> = ({ children }: Children) => {
    const { account } = useContext(Web3Context);
    const { setTracerId, tracerId, selectedTracer } = useContext(TracerContext);
    const { omeState } = useContext(OMEContext);

    useEffect(() => {
        if (tracerId) {
            const id = tracerId.split('/');
            orderDispatch({ type: 'setMarket', value: id[0] });
            orderDispatch({ type: 'setCollateral', value: id[1] });
        }
    }, [tracerId]);

    // Resets the trading screen
    const reset = () => {
        console.error('Reset is not implemented ');
    };

    // calculates the newQuote and newBase based on a given exposre
    const calcNewBalance: (
        addedExposure: BigNumber,
        price: BigNumber,
        position: number,
    ) => { base: BigNumber; quote: BigNumber } = (addedExposure, price, position) => {
        const balances = selectedTracer?.getBalance();
        if (position === SHORT) {
            const newBalance = balances?.base.minus(addedExposure) ?? tracerDefaults.balances.base; // subtract how much exposure you get
            const newQuote = balances?.quote.plus(addedExposure.times(price)) ?? tracerDefaults.balances.quote; // add how much it costs
            return {
                base: newBalance,
                quote: newQuote,
            };
        }
        return {
            base: balances?.base.plus(addedExposure) ?? tracerDefaults.balances.base, // add how much exposure you get
            quote: balances?.quote.minus(addedExposure.times(price)) ?? tracerDefaults.balances.quote, // subtract how much it costs
        };
    };

    const initialState: OrderState = orderDefaults.order;

    const reducer = (state: any, action: OrderAction) => {
        const { quote, base, totalMargin, leverage } = selectedTracer?.getBalance() ?? defaults.balances;
        const fairPrice = selectedTracer?.getFairPrice() ?? defaults.fairPrice;
        switch (action.type) {
            case 'setMarket':
                return { ...state, market: action.value };
            case 'setCollateral':
                return { ...state, collateral: action.value };
            case 'setAmountToPay':
                return { ...state, amountToPay: action.value };
            case 'setLeverage':
                return { ...state, leverage: action.value };
            case 'setPosition':
                return { ...state, position: action.value };
            case 'setPrice':
                return { ...state, price: action.value };
            case 'setOrderType':
                return {
                    ...state,
                    orderType: action.value,
                };
            case 'setAdjustType':
                const short = base.lt(0);
                const long = base.gt(0);
                if (action.value === CLOSE) {
                    if (short) {
                        return {
                            ...state,
                            adjustType: action.value,
                            position: LONG,
                        };
                    }
                    if (long) {
                        return {
                            ...state,
                            adjustType: action.value,
                            position: SHORT,
                        };
                    }
                }
                return { ...state, adjustType: action.value };
            case 'setExposureFromLeverage': {
                let position, deleverage;
                // issue here is action.leverage is negative for short values
                // but leverage is always positive no matter if short or long
                if (base.lt(0)) {
                    if (action.leverage > leverage.negated().toNumber()) {
                        // deleverage short bosition
                        position = LONG;
                        deleverage = true;
                    } else {
                        position = SHORT;
                    }
                    // } else if (base.gt(0)) {
                } else if (base.gt(0)) {
                    if (action.leverage < leverage.toNumber()) {
                        // deleverage
                        position = SHORT;
                        deleverage = true;
                    } else {
                        position = LONG;
                    }
                } else if (base.eq(0)) {
                    // if base is 0 let leverage determing position
                    position = action.leverage < 0 ? SHORT : action.leverage > 0 ? LONG : state.position;
                } else if (quote.eq(0)) {
                    // if quote is 0 then dont change anything
                    return {
                        ...state,
                        position: action.leverage < 0 ? SHORT : action.leverage > 0 ? LONG : state.position,
                    };
                }
                const notional = totalMargin.times(Math.abs(action.leverage));
                let targetExposure = notional.div(fairPrice);
                let difference = targetExposure.minus(base.abs()).abs();
                if (deleverage) {
                    if (
                        (base.gt(0) && action.leverage < 0) || // long and shorting
                        (base.lt(0) && action.leverage > 0) // short and longing
                    ) {
                        targetExposure = notional.div(fairPrice);
                        difference = targetExposure.abs().plus(base.abs());
                    }
                }
                return {
                    ...state,
                    exposure: difference.toNumber(),
                    exposureBN: difference,
                    position: position,
                };
            }
            case 'setLeverageFromExposure': {
                if (Number.isNaN(action.amount)) {
                    return {
                        ...state,
                        leverage: base.lt(0) ? leverage * -1 : leverage,
                        exposure: action.amount, // is nan
                        exposureBN: orderDefaults.order.exposureBN,
                    };
                }
                const notional = new BigNumber(action.amount).times(fairPrice);
                let targetLeverage = notional.div(totalMargin);
                // here targetLeverage and leverage are both positive
                let position;
                if (base.lt(0)) {
                    if (targetLeverage.gt(leverage)) {
                        // deleverage
                        position = LONG;
                    } else {
                        position = SHORT;
                    }
                } else if (base.gt(0)) {
                    if (targetLeverage.lt(leverage)) {
                        // deleverage
                        position = SHORT;
                    } else {
                        position = LONG;
                    }
                } else {
                    position = state.position;
                }
                if (base.gt(0)) {
                    targetLeverage = leverage.minus(targetLeverage);
                } else if (base.lt(0)) {
                    targetLeverage = targetLeverage.minus(leverage);
                } else {
                    // base is 0
                    targetLeverage = state.position === SHORT ? targetLeverage.negated() : targetLeverage;
                }
                return {
                    ...state,
                    leverage: targetLeverage.toNumber(),
                    position: position,
                };
            }
            case 'setLeverage':
                return { ...state, leverage: action.value };
            case 'setOppositeOrders':
                return { ...state, oppositeOrders: action.orders };
            case 'setExposure':
                return { ...state, exposure: action.value, exposureBN: new BigNumber(action.value ?? 0) };
            case 'setNextPosition':
                return { ...state, nextPosition: action.nextPosition };
            case 'setMaxExposure':
                const exposure = 1;
                return { ...state, exposure: exposure };
            case 'setMaxClosure':
                const fullClosure = selectedTracer?.getBalance().base.abs();
                return { ...state, exposure: fullClosure };
            case 'setBestPrice':
                const price = state.position === LONG ? omeState?.maxAndMins?.minAsk : omeState?.maxAndMins?.maxBid;
                if (!price) {
                    // if there is no price set error to no open orders
                    return { ...state, error: 'NO_ORDERS' };
                } else {
                    return { ...state, price: price };
                }
            case 'setSlippage':
                return { ...state, slippage: action.value };
            case 'setMarketTradePrice':
                return { ...state, marketTradePrice: action.value };
            case 'setError':
                return { ...state, error: action.value };
            case 'setWallet':
                return { ...state, wallet: action.value };
            case 'setLock':
                return { ...state, lock: action.value };
            case 'setAdvanced':
                return { ...state, advanced: action.value };
            default:
                throw new Error(`Unexpected action`);
        }
    };

    const [order, orderDispatch] = useReducer(reducer, initialState);

    useMemo(() => {
        if (omeState?.orders) {
            const oppositeOrders = (
                order.position === LONG ? omeState.orders.askOrders : omeState.orders.bidOrders
            ).map((order) => ({
                price: new BigNumber(order.price),
                amount: new BigNumber(order.quantity),
            }));
            orderDispatch({ type: 'setOppositeOrders', orders: oppositeOrders });
            if (order.orderType === MARKET) {
                // market order set the price to the bottom of the book
                orderDispatch({
                    type: 'setPrice',
                    value:
                        (order.position === LONG ? omeState?.maxAndMins?.maxAsk : omeState?.maxAndMins?.minBid) ?? NaN,
                });
            }
        }
    }, [order.position, omeState?.orders]);

    useMemo(() => {
        if (order.orderType === MARKET) {
            orderDispatch({
                type: 'setPrice',
                value: (order.position === LONG ? omeState?.maxAndMins?.maxAsk : omeState?.maxAndMins?.minBid) ?? NaN,
            });
        } else {
            orderDispatch({ type: 'setPrice', value: NaN });
        }
    }, [order.position, order.orderType]);

    useMemo(() => {
        // when user swaps to close order, set opposite side
        // set the amount to the users position
        if (order.adjustType === CLOSE) {
            const balances = selectedTracer?.getBalance() ?? tracerDefaults.balances;
            if (balances?.base.lt(0)) {
                orderDispatch({ type: 'setPosition', value: LONG });
            } else if (balances?.base.gt(0)) {
                orderDispatch({ type: 'setPosition', value: SHORT });
            }
            orderDispatch({ type: 'setExposure', value: balances.base.abs() });
        }
    }, [order.adjustType]);

    useMemo(() => {
        // calculate the exposure based on the opposite orders
        if (order.orderType === MARKET && order.oppositeOrders.length) {
            // convert orders
            const { slippage, tradePrice } = calcSlippage(
                order.exposureBN,
                // TODO remove this, its because we used to factor in leverage per trade ie 2x would double exposure
                new BigNumber(1),
                order.oppositeOrders,
            );
            if (!slippage.eq(0)) {
                orderDispatch({ type: 'setSlippage', value: slippage.toNumber() });
            } else {
                orderDispatch({ type: 'setSlippage', value: 0 });
            }
            if (!tradePrice.eq(0)) {
                orderDispatch({ type: 'setMarketTradePrice', value: tradePrice });
            }
        }
    }, [order.exposure, order.oppositeOrders]);

    // Handles setting the selected tracer Id on a market or collateral change
    useEffect(() => {
        setTracerId ? setTracerId(`${order.market}/${order.collateral}`) : console.error('Error setting tracerId');
    }, [order.market, order.collateral]);

    useEffect(() => {
        if (order.orderType === LIMIT) {
            orderDispatch({
                type: 'setNextPosition',
                nextPosition: calcNewBalance(order.exposureBN, new BigNumber(order.price), order.position),
            });
        } else {
            orderDispatch({
                type: 'setNextPosition',
                nextPosition: calcNewBalance(order.exposureBN, order.marketTradePrice, order.position),
            });
        }
    }, [order.exposure, order.price]);

    // Check errors
    useMemo(() => {
        if (omeState?.orders) {
            const oppositeOrders = order.position === LONG ? omeState.orders.askOrders : omeState.orders.bidOrders;
            const error = checkErrors(
                selectedTracer?.getBalance(),
                oppositeOrders,
                account,
                order,
                selectedTracer?.getFairPrice(),
                selectedTracer?.getMaxLeverage(),
            );
            if (error !== order.error) {
                orderDispatch({ type: 'setError', value: error });
            }
        }
    }, [
        // listens to a lot, but not all
        selectedTracer?.getBalance(),
        account,
        order.orders,
        order.orderType,
        order.nextPosition,
    ]);

    return (
        <OrderContext.Provider
            value={{
                order,
                orderDispatch,
                reset,
            }}
        >
            {children}
        </OrderContext.Provider>
    );
};
