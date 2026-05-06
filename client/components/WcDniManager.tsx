import { useEffect } from "react";
import {
  startDniPhoneStabilizer,
  stopDniPhoneStabilizer,
} from "@site/lib/syncDniPhone";

export default function WcDniManager(): null {
  useEffect(() => {
    startDniPhoneStabilizer();

    return () => {
      stopDniPhoneStabilizer();
    };
  }, []);

  return null;
}
