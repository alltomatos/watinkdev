import React from 'react';
import { Position } from 'reactflow';
import { List as MenuIcon } from '@material-ui/icons';
import BaseNode from './BaseNode';

const MenuNode = ({ data, isConnectable }) => {
    const menuType = data?.menuType || (data?.options?.length > 3 ? 'list' : 'buttons');
    const optionCount = menuType === 'list'
        ? (data?.listConfig?.sections || []).reduce((acc, section) => acc + ((section?.rows || []).length), 0)
        : (data?.options?.length || 0);

    const modeLabel = menuType === 'list' ? 'Lista' : 'Botões';
    const helpLabel = optionCount > 0
        ? `${modeLabel}: ${optionCount} opções`
        : `${modeLabel}: configure as opções`;

    return (
        <BaseNode
            data={data}
            icon={MenuIcon}
            colorClass="colorMenu"
            defaultLabel="Menu"
            sublabel={helpLabel}
            isConnectable={isConnectable}
            badge={optionCount > 0 ? optionCount : null}
        />
    );
};

export default MenuNode;
