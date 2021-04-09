import React, { useState, useContext } from 'react';
import { Web3Context, SelectedTracerStore, TracerContext } from 'context';
import { SearchBar } from '@components/Nav/SearchBar';
import { SearchableTable } from '@components/Tables/SearchableTable';
import { NumberSelect } from '@components/Input/NumberSelect';
import { Section } from '@components/SummaryInfo';
import { ConnectButton } from '@components/Buttons';

const PoolSummary: React.FC = () => {
    return (
        <>
            <Section label={'Last price'} fontSize={'text-lg'}>
                11, 200 USDC
            </Section>
            <Section label={'Available margin'} fontSize={'text-lg'}>
                1200 USDC
            </Section>
            <Section label={'APY'} fontSize={'text-lg'}>
                XX
            </Section>
        </>
    );
};

const PoolFunds: React.FC = () => {
    const {
        tracerId,
        tracerInfo: { baseTokenBalance } = { baseTokenBalance: 0 }, // defaults 0
    } = useContext(TracerContext);
    const { account } = useContext(Web3Context);
    const [amount, setAmount] = useState(0);
    const balance = baseTokenBalance;

    return (
        <div className="text-center h-full w-full flex flex-col">
            <h1 className="py-5">Add liquidity</h1>
            <div className="border-b-2 border-gray-100 mb-5">
                <h3 className="text-left font-bold text-blue-100 flex">
                    Market
                    <span className="text-blue-100 ml-auto font-normal">{tracerId}</span>
                </h3>
            </div>
            <NumberSelect
                unit={tracerId?.split('/')[1] ?? 'NO_ID'}
                title="Quantity"
                amount={amount}
                setAmount={setAmount}
                balance={balance}
            />
            <div className="m-auto w-full">
                <PoolSummary />
            </div>
            <div className="mt-auto">
                {account ? <button className="button mb-5">Deposit</button> : <ConnectButton />}
            </div>
        </div>
    );
};

// TODO When AMM's are ready
const PoolList: React.FC = () => {
    const headings = ['Trace', 'Available Margin', 'Position Size', 'APY', 'My Share', 'My Rewards'];
    const [filter, setFilter] = useState('');
    const { setTracerId } = useContext(TracerContext);
    const rows: string[][] = [];

    return (
        <div className="w-10/12 mx-auto text-md">
            <div className="w-full text-center text-blue-100 font-bold text-2xl py-5">Available Pools</div>
            <div className="w-full">
                <SearchBar cClasses={'h-10'} filter={filter} setFilter={setFilter} />
                <SearchableTable rows={rows} filter={filter} headings={headings} handleRowClick={setTracerId} />
            </div>
        </div>
    );
};

const Pools: React.FC = () => {
    return (
        <SelectedTracerStore>
            <div className="h-full px-12 flex w-full">
                <div className="h-full w-4/12 flex flex-col">
                    <div className="m-6 px-6 py-2 card h-full">
                        <PoolFunds />
                    </div>
                </div>
                <div className="h-full w-8/12 flex flex-col">
                    <div className="m-6 px-6 py-2 card h-full">
                        <PoolList />
                    </div>
                </div>
            </div>
        </SelectedTracerStore>
    );
};

export default Pools;
