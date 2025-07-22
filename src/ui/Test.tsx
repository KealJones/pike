'use client';

import { use } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Test({data1, data2}: {data1: any, data2: any}) {
  const gameMaster = use(data1);
  const rankings1500 = use(data2);
  console.log(gameMaster, rankings1500);
  return (
    <div>
      <h1>Test Component</h1>
      <p>This is a test component to verify the setup.</p>
    </div>
  );
}
