import { useState } from "react"

type Props = 'bordered' | 'stripe' | 'resizableColumns' | 'sortableColumns'

type UseConfigActionsProps = Partial<Record<Props, boolean>>

const useConfigActions = (props?: UseConfigActionsProps) => {
  const [state, setState] = useState<Props[]>(Object.keys(props || {}).filter(Boolean) as Props[])
  
  return {
    state,
    onChange: setState,
    baseProps: {
      bordered: state?.includes('bordered'),
      stripe: state?.includes('stripe'),
      resizableColumns: state?.includes('resizableColumns'),
      sortableColumns: state?.includes('sortableColumns')
    }
  }
}

export default useConfigActions