const fs = require("node:fs");

const file = process.argv[2];

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

if (
  !source.includes(
    "RKN_HPP_ZERO_INPUT_FIX_V1103B"
  )
) {
  const labelIndex =
    source.indexOf(
      "HPP Final"
    );

  if (labelIndex < 0) {
    throw new Error(
      "HPP_FINAL_LABEL_NOT_FOUND"
    );
  }

  const searchEnd =
    Math.min(
      source.length,
      labelIndex + 1000
    );

  const segment =
    source.slice(
      labelIndex,
      searchEnd
    );

  const regex =
    /value=\{\s*manualHpp\s*\}/;

  if (!regex.test(segment)) {
    throw new Error(
      "MANUAL_HPP_VALUE_NOT_FOUND"
    );
  }

  const fixed =
    segment.replace(
      regex,
`value={
                  manualHpp === 0
                    ? ""
                    : manualHpp
                }`
    );

  source =
    source.slice(
      0,
      labelIndex
    ) +
    fixed +
    source.slice(
      searchEnd
    );

  source =
    source.replace(
      '"use client";',
`"use client";

// RKN_HPP_ZERO_INPUT_FIX_V1103B`
    );
}

fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "HPP_ZERO_INPUT_FIX_PASS"
);