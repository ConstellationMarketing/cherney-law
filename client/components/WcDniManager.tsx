import { useEffect } from "react";
import {
  startDniFooterSync,
  stopDniFooterSync,
} from "@site/lib/syncDniPhone";

export default function WcDniManager(): null {
  useEffect(() => {
    startDniFooterSync();

    return () => {
      stopDniFooterSync();
    };
  }, []);

  return null;
}
