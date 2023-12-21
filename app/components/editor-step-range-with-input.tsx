/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useState } from "react";
import { EditorInput } from "./editor-input";
import { EditorStepRange } from "./editor-step-range";

export function EditorStepRangeWithInput({
  inputStyles,
  max,
  maxLength,
  min,
  onChange,
  step,
  stepRangeStyles,
  transform,
  validate,
  value
}: {
  inputStyles: string;
  max: number;
  maxLength: number;
  min: number;
  onChange(value: number): void;
  step: number;
  stepRangeStyles: string;
  transform?(value: number): string;
  validate(value: number): boolean;
  value: number;
}) {
  transform = transform !== undefined ? transform : String;
  const [text, setText] = useState(transform(value));

  function handleTextChange({
    target: { value: text }
  }: React.ChangeEvent<HTMLInputElement>) {
    setText(text);
    const value = Number(text);
    if (text && validate(value)) {
      onChange(value);
    }
  }

  function handleTextBlur() {
    if (!text || !validate(Number(text))) {
      setText(transform!(value));
    }
  }

  function handleChange(value: number) {
    onChange(value);
    setText(transform!(value));
  }

  return (
    <>
      <EditorInput
        inflexible
        unstyled
        className={inputStyles}
        maxLength={maxLength}
        onChange={handleTextChange}
        onBlur={handleTextBlur}
        validate={(wearText) => validate(Number(wearText))}
        value={text}
      />
      <EditorStepRange
        className={stepRangeStyles}
        value={value}
        onChange={handleChange}
        max={max}
        min={min}
        step={step}
      />
    </>
  );
}
