import { Checkbox, ConfigProvider, theme } from "antd"
import { CheckboxGroupProps } from "antd/es/checkbox"
import React, { FC } from "react"
import { Theme } from "rc-grid-table"

const ConfigActions: FC<CheckboxGroupProps> = ({value, onChange}) => {
  const { isDark } = Theme.useToken()

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <div style={{color: '#999', fontSize: 14}}>动态控制 bordered、stripe、resizableColumns、sortableColumns 属性</div>
      <Checkbox.Group value={value} onChange={onChange} style={{marginBlock: '10px 20px'}}>
        <Checkbox value='bordered'>bordered</Checkbox>
        <Checkbox value='stripe'>stripe</Checkbox>
        <Checkbox value='resizableColumns'>resizableColumns</Checkbox>
        <Checkbox value='sortableColumns'>sortableColumns</Checkbox>
      </Checkbox.Group>
    </ConfigProvider>
  )
}

export default ConfigActions