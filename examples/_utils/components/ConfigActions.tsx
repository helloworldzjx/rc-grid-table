import { Checkbox, Flex } from 'antd';
import { CheckboxGroupProps } from 'antd/es/checkbox';
import React, { FC } from 'react';

type ConfigActionsProps = CheckboxGroupProps & {
  showColumnConfig?: boolean;
};

const ConfigActions: FC<ConfigActionsProps> = ({
  value,
  onChange,
  showColumnConfig = false,
}) => {
  const features = [
    'bordered',
    'stripe',
    'resizableColumns',
    'sortableColumns',
  ];
  const UIFeatures = showColumnConfig
    ? ['fixableColumns', 'visibleColumns']
    : [];
  const text = `动态控制 ${features.concat(UIFeatures).join('、')} 属性`;

  return (
    <Flex vertical>
      <div style={{ color: '#999', fontSize: 14 }}>{text}</div>
      <Checkbox.Group
        value={value}
        onChange={onChange}
        style={{ marginBlock: '10px 20px', rowGap: 15 }}
      >
        <Checkbox value="bordered">bordered（边框）</Checkbox>
        <Checkbox value="stripe">stripe（斑马纹）</Checkbox>
        <Checkbox value="resizableColumns">
          resizableColumns（拖拽调整列宽）
        </Checkbox>
        <Checkbox value="sortableColumns">sortableColumns（拖拽排序）</Checkbox>
        {showColumnConfig && (
          <>
            <Checkbox value="fixableColumns">
              fixableColumns（固定列配置）
            </Checkbox>
            <Checkbox value="visibleColumns">
              visibleColumns（显隐列配置）
            </Checkbox>
          </>
        )}
      </Checkbox.Group>
    </Flex>
  );
};

export default ConfigActions;
