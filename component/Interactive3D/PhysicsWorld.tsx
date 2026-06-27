"use client";

import { Physics } from "@react-three/rapier";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function PhysicsWorld({ children }: Props) {
  return (
    <Physics
      gravity={[0, -3, 0]} // Moon gravity
      interpolate
      timeStep="vary"
    >
      {children}
    </Physics>
  );
}