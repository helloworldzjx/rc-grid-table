import { useState } from "react"

const useConfigActions = () => {
  const [state, setState] = useState<Array<'bordered' | 'resizableColumns' | 'sortableColumns'>>([])
  
  return {
    state,
    onChange: setState,
    baseProps: {
      bordered: state?.includes('bordered'),
      resizableColumns: state?.includes('resizableColumns'),
      sortableColumns: state?.includes('sortableColumns')
    }
  }
}

export default useConfigActions