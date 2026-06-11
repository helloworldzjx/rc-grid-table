import { isValidElement, ReactNode } from 'react';

import { TitleEllipsisType } from '../interface';

export const getEllipsisTitle = (children: ReactNode) => {
  let title: string | undefined = undefined;
  if (typeof children === 'string' || typeof children === 'number') {
    title = children.toString();
  } else if (
    isValidElement(children) &&
    (typeof children?.props?.children === 'string' ||
      typeof children?.props?.children === 'number')
  ) {
    title = children.props.children.toString();
  }

  return title;
};

export const getEllipsisShowTitle = (ellipsis?: TitleEllipsisType) =>
  typeof ellipsis === 'boolean' ? ellipsis : ellipsis?.showTitle;
