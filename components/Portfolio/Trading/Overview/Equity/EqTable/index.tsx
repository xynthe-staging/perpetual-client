import styled from 'styled-components';
// @ts-ignore
import profit_arrow_up from 'public/img/general/triangle_up_green.svg';
// import profit_arrow_down from 'public/img/general/triangle_down_red.svg';

export const EqTable = styled.table`
    margin: 10px -20px 0px;
    border-top: 1px solid var(--table-darkborder);
`;

export const EqTableHeader = styled.thead``;

export const EqTableHeading = styled.th`
    text-align: left;
    color: var(--color-primary);
    height: 40px;
    font-size: var(--font-size-extra-small);
    padding-left: 10px;
    border-right: 1px solid var(--color-accent);
    border-bottom: 1px solid var(--color-accent);
`;

export const EqTableLastHeading = styled(EqTableHeading)`
    border-right: none;
`;

export const EqTableBody = styled.tbody``;

export const EqTableRow = styled.tr`
    transition: 0.5s;
    color: white;
    opacity: 1;

    &:hover {
        background: var(--color-accent);
        cursor: pointer;
    }
`;

export const EqTableCell = styled.td`
    padding: 0 10px;
    width: 135px;
    border-left: 1px solid var(--table-darkborder);
    border-right: 1px solid var(--table-darkborder);
    border-bottom: 1px solid var(--table-darkborder);
`;

interface TBCellProps {
    border?: boolean;
}
export const EqTableCellEmpty = styled.td<TBCellProps>`
    width: 135px;
    ${(props) => props.border 
        ? 'border-bottom: 1px solid var(--table-darkborder);\
           border-left: 1px solid var(--table-darkborder);\
           border-right: 1px solid var(--table-darkborder);'
        : 'border: none;'
    }
`;

export const EqTableCellLarge = styled.td`
    display: flex;
    flex-direction: row; 
    align-items: center;
    flex-wrap: wrap;
    width: 235px;
    padding: 10px 20px;
    border-bottom: 1px solid var(--table-darkborder);
`;

export const EqTableCellLargeEmpty = styled.td`
    width: 235px;
`;

// Last cell on a EqTable row
export const EqTableCellLast = styled.td`
    display: flex;
    flex-direction: row; 
    align-items: center;
    flex-wrap: wrap;
    padding: 10px 20px;
    border-bottom: 1px solid var(--table-darkborder);
`;

interface AmountProps {
    color?: string;
    fontSize?: string;
}
export const Amount = styled.span<AmountProps>`
    display: flex;
    align-items: flex-start;
    flex-basis: auto;
    color: ${(props) => props.color ? props.color as string : '#ffffff'};
    font-size: ${(props) => props.fontSize ? props.fontSize as string : '40px'};
    line-height: ${(props) => props.fontSize ? props.fontSize as string : '40px'};
`;
export const Profit = styled.span`
    font-size: 12px;
    flex-basis: auto;
    padding-left: 5px;
`;

export const ProfitArrow = styled.span<{ direction: string }>`
    ${(props) => props.direction 
        ? 'background-image: url(/img/general/triangle_up_green.png);'
        : 'background-image: url(/img/general/triangle_down_red.png);'
    }
    width: 14px;
    height: 14px;
    background-size: cover;
    margin-left: 5px;
`;

export const ProfitAmount = styled.span<{ color: string }>`
    color: ${(props) => props.color};
`;

export const Text = styled.p`
    flex-basis: 100%;
    text-align: left;
    font-size: 12px;
    color: #3DA8F5;
`;

export const CellTitle = styled.span`
    color: #3DA8F5;
`;

export const CellDesc = styled.span`
    color: #005EA4;
    margin-left: 5px;
`;