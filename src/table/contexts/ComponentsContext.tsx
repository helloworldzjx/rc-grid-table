import { createContext, useContext } from 'react';

import { type ComponentsContextProps } from '../interface';

const defaultGetComponent: ComponentsContextProps['getComponent'] = (
  _path,
  defaultComponent = 'div',
) => defaultComponent;

const ComponentsContext = createContext<ComponentsContextProps>({
  getComponent: defaultGetComponent,
});

const useComponentsContext = () => useContext(ComponentsContext);

export { useComponentsContext };

export default ComponentsContext;
