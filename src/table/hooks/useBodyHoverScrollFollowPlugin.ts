import { useCallback, useEffect, useMemo } from 'react';

import type { GetScrollContainer } from '../interface';
import type { BodyHoverController } from './useBodyHoverController';
import useViewportMouseTracker from './viewportMouseTracker';

interface UseBodyHoverScrollFollowPluginProps {
  enabled?: boolean;
  controller: BodyHoverController;
  bodyElement?: HTMLDivElement;
  getScrollContainer?: GetScrollContainer;
}

interface BodyHoverScrollFollowPlugin {
  notifyScroll: () => void;
}

export default function useBodyHoverScrollFollowPlugin({
  enabled = true,
  controller,
  bodyElement,
  getScrollContainer,
}: UseBodyHoverScrollFollowPluginProps): BodyHoverScrollFollowPlugin {
  const targetWindow = bodyElement?.ownerDocument.defaultView;
  useViewportMouseTracker(targetWindow);

  const notifyScroll = useCallback(() => {
    if (!enabled) {
      return;
    }

    controller.scheduleSyncHoverFromPointer(bodyElement);
  }, [bodyElement, controller, enabled]);

  useEffect(() => {
    if (!enabled || !bodyElement || !getScrollContainer) {
      return;
    }

    const scrollContainer = getScrollContainer();
    if (!scrollContainer || scrollContainer === bodyElement) {
      return;
    }

    const handleExternalScroll = () => {
      notifyScroll();
    };

    scrollContainer.addEventListener('scroll', handleExternalScroll, {
      passive: true,
    });

    return () => {
      scrollContainer.removeEventListener('scroll', handleExternalScroll);
    };
  }, [bodyElement, enabled, getScrollContainer, notifyScroll]);

  return useMemo(
    () => ({
      notifyScroll,
    }),
    [notifyScroll],
  );
}
