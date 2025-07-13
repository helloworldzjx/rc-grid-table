import { Checkbox } from "antd"
import { CheckboxGroupProps } from "antd/es/checkbox"
import React, { FC } from "react"

const ConfigActions: FC<CheckboxGroupProps> = ({value, onChange}) => {

  return (
    <>
      <div style={{color: '#999', fontSize: 14}}>动态控制 bordered、stripe、resizableColumns、sortableColumns 属性</div>
      <Checkbox.Group value={value} onChange={onChange} style={{marginBlock: '10px 20px'}}>
        <Checkbox value='bordered'>bordered（边框）</Checkbox>
        <Checkbox value='stripe'>stripe（斑马纹）</Checkbox>
        <Checkbox value='resizableColumns'>resizableColumns（拖拽调整列宽）</Checkbox>
        <Checkbox value='sortableColumns'>sortableColumns（拖拽排序）</Checkbox>
      </Checkbox.Group>
    </>
  )
}

export default ConfigActions