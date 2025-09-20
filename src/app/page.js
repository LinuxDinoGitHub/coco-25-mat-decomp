import Image from "next/image";
import styles from "./page.module.css";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function Home() {
  return (
    <div className={styles.page}>
      <SpeedInsights />
      <main>
        <p>React is BumFuck Stupid</p>
      </main>
    </div>
  );
}
