const fs = require("node:fs");

const file =
  process.argv[2];

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

if (
  !source.includes(
    "RKN_MOBILE_TAB_SCROLL_RESET_V1102"
  )
) {
  const anchor =
`  const marketplaceActive =
    marketplaceTabs.includes(activeTab);`;

  if (!source.includes(anchor)) {
    throw new Error(
      "MARKETPLACE_ACTIVE_ANCHOR_NOT_FOUND"
    );
  }

  const patch =
`${anchor}

  // RKN_MOBILE_TAB_SCROLL_RESET_V1102
  useEffect(() => {
    window.scrollTo(0, 0);

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);`;

  source =
    source.replace(
      anchor,
      patch
    );
}

fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "TAB_SCROLL_RESET_PASS"
);