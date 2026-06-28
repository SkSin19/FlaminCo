"use client";

import { KeyboardControls } from "@react-three/drei";

export enum Controls {
  forward = "forward",
  backward = "backward",
  left = "left",
  right = "right",
  jump = "jump",
}

const keyboardMap = [
  { name: Controls.forward, keys: ["KeyW", "ArrowUp"] },
  { name: Controls.backward, keys: ["KeyS", "ArrowDown"] },
  { name: Controls.left, keys: ["KeyA", "ArrowLeft"] },
  { name: Controls.right, keys: ["KeyD", "ArrowRight"] },
  { name: Controls.jump, keys: ["Space"] },
];

export default function Keyboard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <KeyboardControls map={keyboardMap}>
      {children}
    </KeyboardControls>
  );
}