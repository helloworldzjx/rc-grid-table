import type { HTMLAttributes, MouseEventHandler } from 'react';
import { useCallback, useEffect, useMemo } from 'react';

import { setViewportMousePosition } from '../utils/viewportMouseTracker';
import type { BodyHoverController } from './useBodyHoverController';

interface UseBodyHoverPointerPluginProps {
  enabled?: boolean;
  controller: BodyHoverController;
  bodyElement?: HTMLDivElement;
}

type BodyHoverPointerProps = Pick<
  HTMLAttributes<HTMLDivElement>,
  'onMouseLeave' | 'onMouseMove'
>;

export default function useBodyHoverPointerPlugin({
  enabled = true,
  controller,
  bodyElement,
}: UseBodyHoverPointerPluginProps): BodyHoverPointerProps {
  const handleMouseMove = useCallback<MouseEventHandler<HTMLDivElement>>(
    (event) => {
      const targetWindow = bodyElement?.ownerDocument.defaultView;
      setViewportMousePosition(targetWindow, event.clientX, event.clientY);
      controller.handlePointerMove({
        bodyElement,
        target: event.target,
      });
    },
    [bodyElement, controller],
  );

  const handleMouseLeave = useCallback(() => {
    controller.handlePointerLeave();
  }, [controller]);

  useEffect(() => {
    if (!enabled || !bodyElement) {
      controller.handlePointerLeave();
    }
  }, [bodyElement, controller, enabled]);

  return useMemo(() => {
    if (!enabled) {
      return {};
    }

    return {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    };
  }, [enabled, handleMouseLeave, handleMouseMove]);
}
